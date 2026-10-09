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

export const TOOLS = {
  search_books: searchBooks,
};
