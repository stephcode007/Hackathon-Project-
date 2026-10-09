// Tool implementations (Postgres queries) for the chat agent.
// agent.ts calls them as TOOLS[name](input, studentId).
// Each tool returns plain JSON, or { error: "..." } in plain English so Claude can explain it.
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const coverUrl = (isbn) => (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : null);

async function searchBooks({ query }) {
  const q = String(query ?? "").trim();
  if (!q) return { error: "Tell me a title, author, subject or ISBN to search for." };

  const { data, error } = await supabase.rpc("search_books", { q, max_results: 8 });
  if (error) {
    console.error("search_books failed", error);
    return { error: "The catalogue search isn't working right now. Please try again in a moment." };
  }

  if (data.length === 0) {
    return { query: q, results: [], message: `No books in the library match "${q}".` };
  }

  return {
    query: q,
    results: data.map((b) => ({
      book_id: b.book_id,
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      subject: b.subject,
      floor: b.floor,
      shelf: b.shelf,
      copies_total: b.copies_total,
      copies_available: b.copies_available,
      cover_url: coverUrl(b.isbn),
    })),
  };
}

// ---------- time helpers (everything the student sees is campus time) ----------

const TZ = Deno.env.get("CAMPUS_TIMEZONE") ?? "Europe/London";
const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;
const MAX_DAYS_AHEAD = 7;
const MAX_MINUTES = { room: 180, desk: 240, laptop: 240 };
const NOUN = { room: "room", desk: "desk", laptop: "laptop" };

const pad = (n) => String(n).padStart(2, "0");

// Campus wall-clock parts of an instant
function campus(d) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, hourCycle: "h23", weekday: "long",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  const offset = Math.round(
    (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - d.getTime()) / 60000,
  );
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
    minutes: +p.hour * 60 + +p.minute,
    weekday: p.weekday,
    offset,
  };
}

// "2026-10-10" + "15:30" in campus time -> Date
function fromCampus(date, time) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let t = guess - campus(new Date(guess)).offset * 60000;
  t = guess - campus(new Date(t)).offset * 60000; // settle across DST changes
  return new Date(t);
}

// ISO 8601 with the campus offset, e.g. 2026-10-10T16:00:00+01:00 (as in the API contract)
function isoCampus(d) {
  const c = campus(d);
  const sign = c.offset < 0 ? "-" : "+";
  const off = Math.abs(c.offset);
  return `${c.date}T${c.time}:00${sign}${pad(Math.floor(off / 60))}:${pad(off % 60)}`;
}

const addDaysToDate = (date, n) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// "today" / "tomorrow" / "on Monday": the frontend's Book buttons send this back in a chat message
function dayWord(date) {
  const today = campus(new Date()).date;
  if (date === today) return "today";
  if (date === addDaysToDate(today, 1)) return "tomorrow";
  return `on ${campus(fromCampus(date, "12:00")).weekday}`;
}

const hhmm = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

// Library rules from the README. Returns a plain-English error, or null if the slot is fine.
function checkSlot(type, start, end) {
  if (isNaN(start) || isNaN(end)) return "I couldn't read that date or time.";
  if (end <= start) return "The end time has to be after the start time.";
  const s = campus(start);
  const e = campus(end);
  const minutes = (end - start) / 60000;
  if (s.minutes % 30 || e.minutes % 30) return "Bookings start and end on the hour or half hour (e.g. 14:00 or 14:30).";
  if (s.minutes < OPEN_HOUR * 60 || s.minutes >= CLOSE_HOUR * 60 || s.date !== e.date || e.minutes > CLOSE_HOUR * 60) {
    return `The library is open ${pad(OPEN_HOUR)}:00–${CLOSE_HOUR}:00, so bookings must fit inside those hours.`;
  }
  if (minutes > MAX_MINUTES[type]) return `A ${NOUN[type]} can be booked for at most ${MAX_MINUTES[type] / 60} hours.`;
  const now = new Date();
  if (start < now) return `That time has already passed. It's ${campus(now).time} now.`;
  const today = campus(now).date;
  if (s.date > addDaysToDate(today, MAX_DAYS_AHEAD)) return `Bookings can be made up to ${MAX_DAYS_AHEAD} days ahead.`;
  if (type === "laptop" && s.date !== today) return "Laptops can only be borrowed for today.";
  return null;
}

function parseSlot({ date, start_time, duration_minutes }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !/^\d{1,2}:\d{2}$/.test(start_time ?? "")) {
    return { error: "I need a date (YYYY-MM-DD) and a start time (HH:MM)." };
  }
  const start = fromCampus(date, start_time);
  const end = new Date(start.getTime() + Number(duration_minutes) * 60000);
  return { start, end };
}

// ---------- shared helpers ----------

const RESOURCE_FIELDS = "id, type, name, floor, zone, capacity, features";

const toOption = (r) => ({
  resource_id: r.id,
  name: r.name,
  floor: r.floor,
  zone: r.zone,
  capacity: r.capacity,
  features: r.features ?? [],
});

function toBooking(b, r) {
  return {
    booking_id: b.id,
    resource_type: r.type,
    resource_name: r.name,
    floor: r.floor,
    zone: r.zone,
    capacity: r.capacity,
    features: r.features ?? [],
    starts_at: isoCampus(new Date(b.starts_at)),
    ends_at: isoCampus(new Date(b.ends_at)),
  };
}

// Active bookings that overlap [start, end) for the given resources
async function busyResourceIds(ids, start, end) {
  const { data, error } = await supabase
    .from("bookings")
    .select("resource_id")
    .in("resource_id", ids)
    .eq("status", "active")
    .lt("starts_at", end.toISOString())
    .gt("ends_at", start.toISOString());
  if (error) throw error;
  return new Set(data.map((b) => b.resource_id));
}

async function findAvailable(type, input) {
  const slot = parseSlot(input);
  if (slot.error) return slot;
  const problem = checkSlot(type, slot.start, slot.end);
  if (problem) return { error: problem };

  let query = supabase.from("resources").select(RESOURCE_FIELDS).eq("type", type).eq("is_active", true);
  if (input.capacity) query = query.gte("capacity", input.capacity);
  if (input.zone) query = query.eq("zone", input.zone);
  const wanted = [...(input.features ?? []), ...(input.needs_power ? ["power"] : []), ...(input.os ? [input.os] : [])];
  if (wanted.length) query = query.contains("features", wanted);

  const { data: resources, error } = await query;
  if (error) throw error;

  const busy = resources.length ? await busyResourceIds(resources.map((r) => r.id), slot.start, slot.end) : new Set();
  const free = resources
    .filter((r) => !busy.has(r.id))
    .sort((a, b) => (a.capacity ?? 0) - (b.capacity ?? 0) || a.name.localeCompare(b.name, "en", { numeric: true }));

  const s = campus(slot.start);
  const result = {
    resource_type: type,
    date: s.date,
    start_time: s.time,
    end_time: campus(slot.end).time,
    day_word: dayWord(s.date),
    starts_at: isoCampus(slot.start),
    ends_at: isoCampus(slot.end),
    options: free.slice(0, 6).map(toOption),
  };
  if (free.length === 0) {
    result.message = resources.length
      ? `Every matching ${NOUN[type]} is taken ${result.day_word} ${result.start_time}–${result.end_time}.`
      : `No ${NOUN[type]} matches those requirements.`;
  }
  return result;
}

// First start time on the same day (30-minute steps) when the resource is free for the same length
async function nextFreeStart(resourceId, start, end) {
  const c = campus(start);
  const dayStart = fromCampus(c.date, `${pad(OPEN_HOUR)}:00`);
  const dayEnd = fromCampus(c.date, `${CLOSE_HOUR}:00`);
  const { data } = await supabase
    .from("bookings")
    .select("starts_at, ends_at")
    .eq("resource_id", resourceId)
    .eq("status", "active")
    .lt("starts_at", dayEnd.toISOString())
    .gt("ends_at", dayStart.toISOString());
  const taken = (data ?? []).map((b) => [new Date(b.starts_at), new Date(b.ends_at)]);
  const length = end - start;
  for (let t = start.getTime() + 30 * 60000; t + length <= dayEnd.getTime(); t += 30 * 60000) {
    if (!taken.some(([s, e]) => s.getTime() < t + length && e.getTime() > t)) return campus(new Date(t)).time;
  }
  return null;
}

async function createBooking(type, resourceId, startsAt, endsAt, studentId) {
  // a malformed id errors and leaves data null, which is handled as "not found"
  const { data: r } = await supabase.from("resources").select(RESOURCE_FIELDS).eq("id", resourceId ?? "").maybeSingle();
  if (!r || r.type !== type) {
    return { error: `That ${NOUN[type]} id isn't valid. Call find_${type}s again and use a resource_id from its options.` };
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const problem = checkSlot(type, start, end);
  if (problem) return { error: problem };

  const { data: b, error } = await supabase
    .from("bookings")
    .insert({ resource_id: r.id, student_id: studentId, starts_at: start.toISOString(), ends_at: end.toISOString() })
    .select("id, starts_at, ends_at")
    .single();

  if (error?.code === "23P01") { // exclusion constraint: overlaps another booking
    const next = await nextFreeStart(r.id, start, end);
    return {
      error: `${r.name} is already booked during ${campus(start).time}–${campus(end).time}. ` +
        (next ? `Next free slot that day starts at ${next}.` : "It's booked for the rest of that day."),
    };
  }
  if (error) throw error;
  return { booking: toBooking(b, r) };
}

// ---------- tools ----------

const findRooms = (input) => findAvailable("room", input);
const findDesks = (input) => findAvailable("desk", input);
const findLaptops = (input) => findAvailable("laptop", input);

const bookRoom = ({ room_id, starts_at, ends_at }, studentId) => createBooking("room", room_id, starts_at, ends_at, studentId);
const bookDesk = ({ desk_id, starts_at, ends_at }, studentId) => createBooking("desk", desk_id, starts_at, ends_at, studentId);
const bookLaptop = ({ laptop_id, starts_at, ends_at }, studentId) =>
  createBooking("laptop", laptop_id, starts_at, ends_at, studentId);

async function myActiveBookings(studentId) {
  const { data, error } = await supabase
    .from("bookings")
    .select(`id, starts_at, ends_at, resources (${RESOURCE_FIELDS})`)
    .eq("student_id", studentId)
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at");
  if (error) throw error;
  return data;
}

async function getMyBookings(_input, studentId) {
  const rows = await myActiveBookings(studentId);
  return { bookings: rows.map((b) => toBooking(b, b.resources)) };
}

// Accepts a full booking id, or the first 8 characters the frontend's Cancel buttons send
async function cancelBooking({ booking_id }, studentId) {
  const id = String(booking_id ?? "").trim().toLowerCase();
  if (id.length < 6) return { error: "I need the booking id to cancel. Call get_my_bookings to find it." };

  const matches = (await myActiveBookings(studentId)).filter((b) => b.id.startsWith(id));
  if (matches.length === 0) return { error: "I couldn't find that booking. It may already be cancelled or finished." };
  if (matches.length > 1) return { error: "That matches more than one booking. Which one do you mean?" };

  const b = matches[0];
  const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", b.id);
  if (error) throw error;
  return { booking_id: b.id, resource_name: b.resources.name };
}

export const TOOLS = {
  search_books: searchBooks,
  find_rooms: findRooms,
  book_room: bookRoom,
  find_desks: findDesks,
  book_desk: bookDesk,
  find_laptops: findLaptops,
  book_laptop: bookLaptop,
  get_my_bookings: getMyBookings,
  cancel_booking: cancelBooking,
};
