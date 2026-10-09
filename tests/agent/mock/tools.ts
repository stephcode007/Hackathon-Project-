// Mock of Jason's tools.ts for local agent testing. Enforces the README rules.
export const CALLS: { name: string; input: any; output: any }[] = [];

const TZ = "Europe/London";
const mins = (d: string, t: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  return Date.UTC(y, m - 1, dd, h, mi) / 60000;
};
function nowMins() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(new Date()).map((x) => [x.type, x.value]),
  );
  return mins(`${p.year}-${p.month}-${p.day}`, `${p.hour === "24" ? "00" : p.hour}:${p.minute}`);
}
const dayOf = (m: number) => new Date(m * 60000).toISOString().slice(0, 10);
const hhmm = (m: number) => new Date(m * 60000).toISOString().slice(11, 16);

const RESOURCES = [
  ...[["Group Room 2.04", 2, 6], ["Group Room 2.05", 2, 4], ["Group Room 3.01", 3, 8], ["Study Room 1.02", 1, 2]].map(([n, f, c], i) => ({
    id: `room-uuid-${i + 1}`, type: "room", name: n, floor: f, capacity: c, zone: "group",
    features: i % 2 === 0 ? ["whiteboard", "screen"] : ["whiteboard"],
  })),
  { id: "desk-uuid-1", type: "desk", name: "Desk Q-17", floor: 3, zone: "quiet", capacity: null, features: ["power"] },
  { id: "desk-uuid-2", type: "desk", name: "Desk S-04", floor: 4, zone: "silent", capacity: null, features: [] },
  { id: "desk-uuid-3", type: "desk", name: "Desk G-09", floor: 1, zone: "group", capacity: null, features: ["power"] },
  { id: "laptop-uuid-1", type: "laptop", name: "MacBook Air #3", floor: 1, zone: null, capacity: null, features: ["mac"] },
  { id: "laptop-uuid-2", type: "laptop", name: "Dell XPS #5", floor: 1, zone: null, capacity: null, features: ["windows"] },
];
const BOOKS = [
  { book_id: "b1", title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", floor: 3, shelf: "QA76.76 .M37", copies_available: 2 },
  { book_id: "b2", title: "Introduction to Algorithms", author: "Cormen et al.", isbn: "9780262033848", floor: 3, shelf: "QA76.6 .I5858", copies_available: 0 },
  { book_id: "b3", title: "Pattern Recognition and Machine Learning", author: "Christopher Bishop", isbn: "9780387310732", floor: 4, shelf: "Q325.5 .B57", copies_available: 1 },
];
const bookings: any[] = [];
let seq = 0;

const level = (p: number) => (p < 40 ? "quiet" : p < 70 ? "moderate" : p < 90 ? "busy" : "very_busy");
const typicalPeople = (h: number) => (h >= 11 && h < 15 ? 480 : h >= 15 && h < 18 ? 330 : h >= 18 ? 120 : h >= 10 ? 260 : 90);

function validate(start: number, end: number, type: string) {
  const dur = end - start;
  const now = nowMins();
  if (start < now) return "That time has already passed.";
  if (start % 30 !== 0 || end % 30 !== 0) return "Bookings must start and end on the hour or half hour.";
  const [oh, ch] = [8 * 60, 22 * 60];
  const dayStart = Math.floor(start / 1440) * 1440;
  if (start - dayStart < oh || end - dayStart > ch || Math.floor((end - 1) / 1440) * 1440 !== dayStart) return "The library is open 08:00-22:00; the slot must fall inside those hours.";
  if (type === "room" && dur > 180) return "Rooms can be booked for a maximum of 3 hours.";
  if (type !== "room" && dur > 240) return `${type === "desk" ? "Desks" : "Laptops"} can be booked for a maximum of 4 hours.`;
  if (dur < 30) return "Bookings must be at least 30 minutes.";
  if (start > now + 7 * 1440) return "You can only book up to 7 days ahead.";
  if (type === "laptop" && dayOf(start) !== dayOf(now)) return "Laptops can only be borrowed for the same day.";
  return null;
}
const free = (id: string, s: number, e: number) =>
  !bookings.some((b) => b.status === "active" && b.resource_id === id && s < b.e && e > b.s);

function find(type: string, i: any) {
  const s = mins(i.date, i.start_time), e = s + i.duration_minutes;
  const err = validate(s, e, type);
  if (err) return { error: err };
  let opts = RESOURCES.filter((r) => r.type === type && free(r.id, s, e));
  if (i.capacity) opts = opts.filter((r) => (r.capacity ?? 0) >= i.capacity);
  if (i.features?.length) opts = opts.filter((r) => i.features.every((f: string) => r.features.includes(f)));
  if (i.zone) opts = opts.filter((r) => r.zone === i.zone);
  if (i.needs_power) opts = opts.filter((r) => r.features.includes("power"));
  if (i.os) opts = opts.filter((r) => r.features.includes(i.os));
  return {
    resource_type: type, date: i.date, start_time: i.start_time, duration_minutes: i.duration_minutes,
    options: opts.map((r) => ({ resource_id: r.id, name: r.name, floor: r.floor, zone: r.zone, capacity: r.capacity, features: r.features })),
  };
}
function book(type: string, id: string, i: any) {
  const r = RESOURCES.find((x) => x.id === id && x.type === type);
  if (!r) return { error: `No ${type} with that id. Use find_${type}s to get a valid id.` };
  const s = mins(i.starts_at.slice(0, 10), i.starts_at.slice(11, 16));
  const e = mins(i.ends_at.slice(0, 10), i.ends_at.slice(11, 16));
  const err = validate(s, e, type);
  if (err) return { error: err };
  if (!free(id, s, e)) return { error: `${r.name} is already booked then. Try another time or resource.` };
  const b = { booking_id: `booking-uuid-${++seq}`, resource_id: id, s, e, status: "active", resource_type: type, resource_name: r.name, floor: r.floor, zone: r.zone, features: r.features, starts_at: i.starts_at, ends_at: i.ends_at };
  bookings.push(b);
  const { s: _s, e: _e, status: _st, resource_id: _r, ...pub } = b;
  return pub;
}

export function resetBookings() { bookings.length = 0; CALLS.length = 0; seq = 0; }
export function preBook(name: string, date: string, from: string, to: string) {
  const r = RESOURCES.find((x) => x.name === name)!;
  bookings.push({ booking_id: `booking-uuid-${++seq}`, resource_id: r.id, s: mins(date, from), e: mins(date, to), status: "active", resource_type: r.type, resource_name: r.name, floor: r.floor, zone: r.zone, features: r.features, starts_at: `${date}T${from}:00+01:00`, ends_at: `${date}T${to}:00+01:00` });
}
export { dayOf, nowMins, hhmm };

const impl: Record<string, (i: any) => any> = {
  get_busyness: (i) => {
    if (!i.date && !i.time) return { is_live: true, people: 318, capacity: 600, percent: 53, level: "moderate", as_of: hhmm(nowMins()), typical_now: 300 };
    const h = Number((i.time ?? "12:00").slice(0, 2)); const p = typicalPeople(h);
    return { is_live: false, people: p, capacity: 600, percent: Math.round(p / 6), level: level(p / 6), as_of: `${i.date ?? dayOf(nowMins())} ${i.time ?? ""}`.trim(), typical_now: p };
  },
  get_peak_times: (i) => {
    const day = i.day ?? dayOf(nowMins());
    const hours = Array.from({ length: 14 }, (_, k) => { const h = 8 + k; const p = typicalPeople(h); return { hour: h, avg_people: p, level: level(p / 6) }; });
    return { day, now_hour: Number(hhmm(nowMins()).slice(0, 2)), peak: "11:00–15:00", quietest: "08:00–10:00", hours };
  },
  show_library_pass: () => ({ student_name: "Alex", qr_value: "stacks:demo-student-001" }),
  search_books: (i) => {
    const q = String(i.query).toLowerCase();
    return { results: BOOKS.filter((b) => (b.title + b.author).toLowerCase().split(/\s+/).some((w) => q.split(/\s+/).some((x) => x.length > 2 && w.includes(x)))) };
  },
  find_rooms: (i) => find("room", i),
  find_desks: (i) => find("desk", i),
  find_laptops: (i) => find("laptop", i),
  book_room: (i) => book("room", i.room_id, i),
  book_desk: (i) => book("desk", i.desk_id, i),
  book_laptop: (i) => book("laptop", i.laptop_id, i),
  get_my_bookings: () => ({ bookings: bookings.filter((b) => b.status === "active").map(({ s, e, status, resource_id, ...p }) => p) }),
  cancel_booking: (i) => {
    const b = bookings.find((x) => x.booking_id === i.booking_id && x.status === "active");
    if (!b) return { error: "No active booking with that id." };
    b.status = "cancelled";
    return { booking_id: b.booking_id, resource_name: b.resource_name };
  },
};

export const TOOLS: Record<string, (input: any, studentId: string) => Promise<any>> = Object.fromEntries(
  Object.entries(impl).map(([name, fn]) => [name, async (input: any) => {
    const output = fn(input ?? {});
    CALLS.push({ name, input, output });
    return output;
  }]),
);
