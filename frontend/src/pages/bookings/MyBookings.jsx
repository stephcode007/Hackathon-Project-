import { Cover } from '../../components/cards/BooksCard'
import Icon from '../../components/Icon'
import { demoNow, hhmm, relativeDay, shortDate } from '../../lib/time'
import { myBookHolds, myBookings, toBookingData } from '../../mocks/db'
import { List, PageHeader, Section } from './shared'

const TYPE_LABEL = { room: 'Room', desk: 'Desk', laptop: 'Laptop' }

// Everything Alex has booked. Tap a booking or a book to see it.
export default function MyBookings({ onOpenBooking, onOpenBook, onGoChat }) {
  const spaces = myBookings(demoNow()).map(toBookingData)
  const books = myBookHolds()

  return (
    <>
      <PageHeader title="Bookings" />

      {spaces.length === 0 && books.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center">
          <div className="text-sm font-semibold">Nothing booked yet</div>
          <p className="mt-1 text-sm text-muted">Ask Bookmarked to book a study space, request a laptop or reserve a book, and it'll show up here.</p>
          <button onClick={onGoChat} className="mt-4 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white active:scale-95">
            Ask in Chat
          </button>
        </div>
      ) : (
        <>
          <Section title="Spaces & laptops">
            {spaces.length === 0 ? (
              <p className="px-1 text-sm text-muted">No study spaces or laptops booked.</p>
            ) : (
              <List>
                {spaces.map((b) => {
                  const s = new Date(b.starts_at)
                  return (
                    <li key={b.booking_id}>
                      <button onClick={() => onOpenBooking(b.booking_id)} className="flex w-full items-center gap-3 py-3 text-left">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{b.resource_name}</div>
                          <div className="text-xs text-muted">
                            {TYPE_LABEL[b.resource_type]} · {relativeDay(s)} · {hhmm(s)}–{hhmm(new Date(b.ends_at))}
                          </div>
                          {b.approval && (
                            <div className={`text-xs font-semibold ${b.approval === 'requested' ? 'text-moderate' : 'text-quiet'}`}>
                              {b.approval === 'requested' ? 'Requested · waiting for approval' : 'Request approved'}
                            </div>
                          )}
                        </div>
                        <Icon name="chevron" size={18} className="shrink-0 text-muted" />
                      </button>
                    </li>
                  )
                })}
              </List>
            )}
          </Section>

          <Section title="Books">
            {books.length === 0 ? (
              <p className="px-1 text-sm text-muted">No books reserved. Ask in Chat to find and reserve one.</p>
            ) : (
              <List>
                {books.map((h) => (
                  <li key={h.hold_id}>
                    <button onClick={() => onOpenBook(h.hold_id)} className="flex w-full items-center gap-3 py-3 text-left">
                      <Cover isbn={h.book.isbn} title={h.book.title} className="h-[60px] w-10" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{h.book.title}</div>
                        <div className="truncate text-xs text-muted">{h.book.author}</div>
                        <div className="mt-0.5 text-xs font-semibold text-accent">
                          {h.status === 'ready' ? `Collect by ${shortDate(new Date(h.collect_by))}` : `Waiting list · back ${shortDate(new Date(h.available_from))}`}
                          {' · '}due {shortDate(new Date(h.due))}
                        </div>
                      </div>
                      <Icon name="chevron" size={18} className="shrink-0 text-muted" />
                    </button>
                  </li>
                ))}
              </List>
            )}
          </Section>
        </>
      )}
    </>
  )
}
