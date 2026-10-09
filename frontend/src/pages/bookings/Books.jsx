import { useState } from 'react'
import { Availability, Cover } from '../../components/cards/BooksCard'
import Icon from '../../components/Icon'
import { books, myBookHolds, reserveBook } from '../../mocks/db'
import { ConfirmBar, List, PageHeader } from './shared'

// Search the catalogue: where each book is, whether a copy is in, and reserve it
export default function Books({ onBack, onReserved }) {
  const [query, setQuery] = useState('')
  const [asking, setAsking] = useState(null)
  const held = new Set(myBookHolds().map((h) => h.book.book_id))

  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const results = books.filter((b) => {
    const hay = `${b.title} ${b.author} ${b.subject}`.toLowerCase()
    return words.every((w) => hay.includes(w))
  })

  return (
    <>
      <PageHeader title="Books" onBack={onBack} />
      <label className="mb-3 flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 focus-within:border-accent">
        <Icon name="book" size={16} className="shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author or subject"
          aria-label="Search books"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </label>

      {results.length === 0 ? (
        <p className="px-1 text-sm text-muted">No books match “{query}”.</p>
      ) : (
        <List>
          {results.map((b) => (
            <li key={b.book_id} className="py-3">
              <div className="flex gap-3">
                <Cover isbn={b.isbn} title={b.title} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-snug font-semibold">{b.title}</div>
                  <div className="truncate text-xs text-muted">{b.author}</div>
                  <Availability book={b} />
                </div>
                {held.has(b.book_id) ? (
                  <span className="shrink-0 self-center text-xs font-semibold text-accent">Reserved</span>
                ) : (
                  asking !== b.book_id && (
                    <button
                      onClick={() => setAsking(b.book_id)}
                      className="shrink-0 self-center rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95"
                    >
                      {b.copies_available ? 'Reserve' : 'Waitlist'}
                    </button>
                  )
                )}
              </div>
              {asking === b.book_id && (
                <ConfirmBar
                  text={b.copies_available ? `Reserve ${b.title}?` : `All copies are out. Join the waiting list?`}
                  onCancel={() => setAsking(null)}
                  onConfirm={() => {
                    const hold = reserveBook(b.book_id)
                    setAsking(null)
                    onReserved(hold.hold_id)
                  }}
                />
              )}
            </li>
          ))}
        </List>
      )}
    </>
  )
}
