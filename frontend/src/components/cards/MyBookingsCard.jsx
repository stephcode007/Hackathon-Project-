import { hhmm, relativeDay } from '../../lib/time'
import { isCancelled } from '../../mocks/db'
import Card from './Card'

export default function MyBookingsCard({ data, onAction }) {
  const list = data.bookings.filter((b) => !isCancelled(b.booking_id))
  return (
    <Card icon="calendar" title="My bookings">
      {list.length === 0 ? (
        <p className="text-sm text-muted">Nothing booked yet. Ask me for a room, desk or laptop.</p>
      ) : (
        <ul className="-my-1 divide-y divide-line">
          {list.map((b) => {
            const s = new Date(b.starts_at)
            return (
              <li key={b.booking_id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{b.resource_name}</div>
                  <div className="text-xs text-muted">
                    {relativeDay(s)} · {hhmm(s)}–{hhmm(new Date(b.ends_at))} · Floor {b.floor}
                  </div>
                </div>
                <button
                  onClick={() => onAction(`Cancel booking ${b.booking_id.slice(0, 8)}`)}
                  className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-very-busy hover:bg-very-busy/5"
                >
                  Cancel
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
