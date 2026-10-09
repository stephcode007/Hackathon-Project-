import { useState } from 'react'
import { shortDate } from '../../lib/time'
import Icon from '../Icon'
import Card from './Card'

export function Cover({ isbn, title, className = 'h-[72px] w-12' }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className={`grid shrink-0 place-items-center rounded-md bg-accent-soft p-1 text-center text-[8px] leading-tight font-semibold text-accent ${className}`}>
        {title}
      </div>
    )
  }
  return (
    <img
      src={`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`}
      alt=""
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-md bg-stone-100 object-cover shadow-sm ${className}`}
    />
  )
}

// Shelf location + whether a copy is in (or when it's due back)
export function Availability({ book: b }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
      <span className="flex items-center gap-1 text-muted">
        <Icon name="pin" size={12} /> Floor {b.floor} · {b.section} · {b.shelf}
      </span>
      {b.copies_available > 0 ? (
        <span className="rounded-full bg-quiet/12 px-2 py-0.5 font-semibold text-quiet">
          {b.copies_total ? `${b.copies_available} of ${b.copies_total}` : b.copies_available} available
        </span>
      ) : (
        <span className="rounded-full bg-very-busy/10 px-2 py-0.5 font-semibold text-very-busy">
          Taken out{b.due_back && ` · back ${shortDate(new Date(b.due_back))}`}
        </span>
      )}
    </div>
  )
}

export default function BooksCard({ data, onAction }) {
  return (
    <Card icon="book" title={data.results.length === 1 ? 'Book' : `${data.results.length} books`}>
      <ul className="-my-1 divide-y divide-line">
        {data.results.map((b) => (
          <li key={b.book_id} className="flex gap-3 py-2.5">
            <Cover isbn={b.isbn} title={b.title} />
            <div className="min-w-0 flex-1">
              <div className="text-sm leading-snug font-semibold">{b.title}</div>
              <div className="truncate text-xs text-muted">{b.author}</div>
              <Availability book={b} />
            </div>
            <button
              onClick={() => onAction(`Reserve ${b.title}`)}
              className="shrink-0 self-center rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95 hover:bg-accent/90"
            >
              {b.copies_available ? 'Reserve' : 'Join waitlist'}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
