// Turns a tool's output into the cards the frontend renders (see README "Card types").
// Failed tools produce no card; Claude explains the error in its reply instead.

export function toCards(toolName, output) {
  if (!output || output.error) return [];

  switch (toolName) {
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

    default:
      return [];
  }
}
