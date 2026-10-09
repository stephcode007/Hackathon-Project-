// Turns a tool's output into the cards the frontend renders (see README "Card types").
// Failed tools produce no card; Claude explains the error in its reply instead.

export function toCards(toolName, output) {
  if (!output || output.error) return [];

  switch (toolName) {
    case "get_busyness":
      return [{ type: "busyness", data: output }];

    case "get_peak_times":
      return [{ type: "peak_times", data: output }];

    case "search_books":
      if (output.results.length === 0) return [];
      return [{
        type: "books",
        data: {
          results: output.results.map((b) => ({
            book_id: b.book_id,
            title: b.title,
            author: b.author,
            isbn: b.isbn,
            floor: b.floor,
            shelf: b.shelf,
            copies_available: b.copies_available,
          })),
        },
      }];

    case "reserve_book":
      return [{ type: "book_reserved", data: output }];

    case "cancel_reservation":
      return [{ type: "cancelled", data: { booking_id: output.hold_id, resource_name: output.title } }];

    case "find_rooms":
    case "find_desks":
    case "find_laptops": {
      if (output.options.length === 0) return [];
      const { resource_type, date, start_time, end_time, day_word, options } = output;
      return [{ type: "availability", data: { resource_type, date, start_time, end_time, day_word, options } }];
    }

    case "book_room":
    case "book_desk":
    case "book_laptop":
      return [{ type: "booking", data: output.booking }];

    case "get_my_bookings":
      return [{ type: "my_bookings", data: { bookings: output.bookings } }];

    case "cancel_booking":
      return [{ type: "cancelled", data: { booking_id: output.booking_id, resource_name: output.resource_name } }];

    default:
      return [];
  }
}
