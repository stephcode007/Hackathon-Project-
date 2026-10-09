// Bookings page API: everything the student has booked, without going through Claude.
// Reuses the chat tools so the page and the chat always agree.
//   { action: "list" }                         -> { bookings: [...], reservations: [...], busyness }
//   { action: "cancel_booking", id }           -> { booking_id, resource_name }
//   { action: "cancel_reservation", id }       -> { hold_id, title }
import { TOOLS } from "../chat/tools.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const body = await req.json().catch(() => ({}));
  const { student_id = "demo-student-001", action = "list", id } = body ?? {};

  try {
    if (action === "list") {
      const [spaces, books, busyness] = await Promise.all([
        TOOLS.get_my_bookings({}, student_id),
        TOOLS.get_my_reservations({}, student_id),
        TOOLS.get_busyness({}),
      ]);
      if (books.error) return json({ error: books.error }, 500);
      return json({
        bookings: spaces.bookings,
        reservations: books.reservations,
        busyness: "error" in busyness ? null : busyness, // the page hides the busyness line when null
      });
    }

    let result;
    if (action === "cancel_booking") result = await TOOLS.cancel_booking({ booking_id: id }, student_id);
    else if (action === "cancel_reservation") result = await TOOLS.cancel_reservation({ hold_id: id }, student_id);
    else return json({ error: `Unknown action: ${action}` }, 400);

    return json(result, result.error ? 400 : 200);
  } catch (err) {
    console.error("bookings failed", err);
    return json({ error: "Couldn't load your bookings right now. Please try again." }, 500);
  }
});
