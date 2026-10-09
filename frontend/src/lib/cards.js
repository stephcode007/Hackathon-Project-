// Reserving a book makes the agent search first, then reserve, so one reply can carry
// both a `books` card and a `book_reserved` card for the same book. Show the
// confirmation only, once per reservation.
export function visibleCards(cards = []) {
  if (!cards.some((c) => c.type === 'book_reserved')) return cards
  const seen = new Set()
  return cards.filter((c) => {
    if (c.type === 'books') return false
    if (c.type !== 'book_reserved') return true
    const key = c.data?.hold_id ?? c.data?.book?.book_id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
