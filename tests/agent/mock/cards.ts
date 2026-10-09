const MAP: Record<string, string> = {
  get_busyness: "busyness", get_peak_times: "peak_times", show_library_pass: "library_pass",
  find_rooms: "availability", find_desks: "availability", find_laptops: "availability",
  book_room: "booking", book_desk: "booking", book_laptop: "booking",
  search_books: "books", get_my_bookings: "my_bookings", cancel_booking: "cancelled",
};
export function toCards(name: string, output: unknown) {
  return MAP[name] ? [{ type: MAP[name], data: output }] : [];
}
