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

// ---------- book reservations ----------

const COLLECT_FROM = "Reservations shelf, floor 1";
const RETURN_TO = "Help desk, floor 1";
const LOAN_DAYS = 21;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const addDays = (date, n) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Same shape as the frontend's book_reserved card
function toHold(hold, book, already = false) {
  const loanStart = hold.status === "waiting" ? hold.available_from : hold.created_at;
  return {
    hold_id: hold.id,
    status: hold.status,
    collect_from: COLLECT_FROM,
    collect_by: hold.collect_by,
    available_from: hold.available_from,
    due: addDays(loanStart, LOAN_DAYS),
    return_to: RETURN_TO,
    already,
    book: {
      book_id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      floor: book.floor,
      shelf: book.shelf,
      copies_available: book.copies_available,
      cover_url: coverUrl(book.isbn),
    },
  };
}

async function reserveBook({ book_id }, studentId) {
  if (!UUID.test(String(book_id ?? ""))) {
    return { error: "Search for the book first so I know exactly which one to reserve." };
  }
  const { data, error } = await supabase.rpc("reserve_book", { p_book_id: book_id, p_student_id: studentId });
  if (error) {
    if (error.message?.includes("book not found")) return { error: "I couldn't find that book in the catalogue." };
    console.error("reserve_book failed", error);
    return { error: "Reservations aren't working right now. Please try again in a moment." };
  }
  return toHold(data.hold, data.book, data.already);
}

async function getMyReservations(_input, studentId) {
  const { data, error } = await supabase
    .from("book_holds")
    .select("*, books(*)")
    .eq("student_id", studentId)
    .neq("status", "cancelled")
    .order("created_at");
  if (error) {
    console.error("get_my_reservations failed", error);
    return { error: "I can't load your reservations right now. Please try again in a moment." };
  }
  return { reservations: data.map((h) => toHold(h, h.books)) };
}

async function cancelReservation({ hold_id }, studentId) {
  if (!UUID.test(String(hold_id ?? ""))) {
    return { error: "I need the reservation's id. Check your reservations first." };
  }
  const { data, error } = await supabase.rpc("cancel_book_hold", { p_hold_id: hold_id, p_student_id: studentId });
  if (error) {
    console.error("cancel_book_hold failed", error);
    return { error: "I couldn't cancel that right now. Please try again in a moment." };
  }
  if (!data) return { error: "That reservation doesn't exist or is already cancelled." };
  return { hold_id: data.hold.id, title: data.book.title };
}

export const TOOLS = {
  search_books: searchBooks,
  reserve_book: reserveBook,
  get_my_reservations: getMyReservations,
  cancel_reservation: cancelReservation,
};
