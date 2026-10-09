import BusynessMeter from '../components/cards/BusynessMeter'
import LevelBadge from '../components/cards/LevelBadge'
import { demoNow, hhmm, relativeDay, shortDate } from '../lib/time'
import { liveBusyness, loans, myBookings, toBookingData } from '../mocks/db'

const TYPE_LABEL = { room: 'Room', desk: 'Desk', laptop: 'Laptop' }

function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted uppercase">{title}</h2>
      {children}
    </section>
  )
}

export default function BookingsPage({ onAsk }) {
  const now = demoNow()
  const live = liveBusyness(now)
  const mine = myBookings(now).map(toBookingData)

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pt-5 pb-6">
      <h1 className="mb-4 px-1 font-display text-2xl font-semibold">Bookings</h1>

      <div className="mb-5 rounded-2xl border border-line bg-white p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">Library capacity</div>
            <div className="text-sm">
              <b className="text-base">{live.people}</b> <span className="text-muted">of {live.capacity} seats</span>
            </div>
          </div>
          <LevelBadge level={live.level} />
        </div>
        <BusynessMeter percent={live.percent} level={live.level} />
      </div>

      <Section title="Your bookings">
        {mine.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            Nothing booked. Ask in Chat and it'll show up here.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white px-4">
            {mine.map((b) => {
              const s = new Date(b.starts_at)
              return (
                <li key={b.booking_id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{b.resource_name}</div>
                    <div className="text-xs text-muted">
                      {TYPE_LABEL[b.resource_type]} · {relativeDay(s)} · {hhmm(s)}–{hhmm(new Date(b.ends_at))} · Floor {b.floor}
                    </div>
                  </div>
                  <button
                    onClick={() => onAsk(`Cancel booking ${b.booking_id.slice(0, 8)}`)}
                    className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-very-busy hover:bg-very-busy/5"
                  >
                    Cancel
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section title="Your books">
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white px-4">
          {loans.map((l) => (
            <li key={l.book_id} className="flex items-center gap-3 py-3">
              <img
                src={`https://covers.openlibrary.org/b/isbn/${l.isbn}-M.jpg`}
                alt=""
                className="h-[60px] w-10 shrink-0 rounded bg-stone-100 object-cover shadow-sm"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{l.title}</div>
                <div className="truncate text-xs text-muted">{l.author}</div>
                <div className="mt-0.5 text-xs font-semibold text-accent">Due {shortDate(l.due)}</div>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
