import { useState } from 'react'
import Icon from '../Icon'
import Card from './Card'

function Cover({ isbn, title }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="grid h-[72px] w-12 shrink-0 place-items-center rounded-md bg-accent-soft p-1 text-center text-[8px] leading-tight font-semibold text-accent">
        {title}
      </div>
    )
  }
  return (
    <img
      src={`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`}
      alt=""
      onError={() => setFailed(true)}
      className="h-[72px] w-12 shrink-0 rounded-md bg-stone-100 object-cover shadow-sm"
    />
  )
}

export default function BooksCard({ data }) {
  return (
    <Card icon="book" title={data.results.length === 1 ? 'Book' : `${data.results.length} books`}>
      <ul className="-my-1 divide-y divide-line">
        {data.results.map((b) => (
          <li key={b.book_id} className="flex gap-3 py-2.5">
            <Cover isbn={b.isbn} title={b.title} />
            <div className="min-w-0 flex-1">
              <div className="text-sm leading-snug font-semibold">{b.title}</div>
              <div className="truncate text-xs text-muted">{b.author}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-muted">
                  <Icon name="pin" size={12} /> Floor {b.floor} · {b.shelf}
                </span>
                {b.copies_available > 0 ? (
                  <span className="rounded-full bg-quiet/12 px-2 py-0.5 font-semibold text-quiet">
                    {b.copies_available} available
                  </span>
                ) : (
                  <span className="rounded-full bg-very-busy/10 px-2 py-0.5 font-semibold text-very-busy">All out</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
