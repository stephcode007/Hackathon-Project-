import { downloadIcs } from '../../lib/ics'
import { hhmm, relativeDay } from '../../lib/time'
import { isCancelled } from '../../mocks/db'
import Icon from '../Icon'
import Card from './Card'
import Features from './Features'

const TYPE_LABEL = { room: 'Room', desk: 'Desk', laptop: 'Laptop loan' }

export default function BookingCard({ data, onAction }) {
  const { booking_id, resource_type, resource_name, floor, zone, capacity, features, pickup, starts_at, ends_at } = data
  const start = new Date(starts_at)
  const end = new Date(ends_at)
  const cancelled = isCancelled(booking_id)

  return (
    <Card className={cancelled ? 'opacity-60' : ''}>
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${cancelled ? 'bg-stone-100 text-muted' : 'bg-quiet/15 text-quiet'}`}>
          <Icon name={cancelled ? 'x' : 'check'} size={20} strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold tracking-wide text-muted uppercase">
            {cancelled ? 'Cancelled' : `${TYPE_LABEL[resource_type]} booked`}
          </div>
          <div className={`font-display text-lg leading-tight font-semibold ${cancelled ? 'line-through' : ''}`}>{resource_name}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-paper p-3 text-sm">
        <div className="flex items-center gap-2">
          <Icon name="calendar" size={15} className="text-muted" />
          {relativeDay(start)}
        </div>
        <div className="flex items-center gap-2">
          <Icon name="clock" size={15} className="text-muted" />
          {hhmm(start)}–{hhmm(end)}
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <Icon name="pin" size={15} className="text-muted" />
          {pickup ?? `Floor ${floor}`}
          <span className="ml-1">
            <Features features={features} capacity={capacity} zone={resource_type === 'desk' ? zone : null} />
          </span>
        </div>
      </div>

      {!cancelled && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() =>
              downloadIcs({ id: booking_id, title: resource_name, location: `Library, floor ${floor}`, start, end })
            }
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line py-2 text-xs font-semibold transition hover:bg-paper active:scale-95"
          >
            <Icon name="calendar" size={14} /> Add to calendar
          </button>
          <button
            onClick={() => onAction(`Cancel booking ${booking_id.slice(0, 8)}`)}
            className="flex-1 rounded-full border border-very-busy/30 py-2 text-xs font-semibold text-very-busy transition hover:bg-very-busy/5 active:scale-95"
          >
            Cancel
          </button>
        </div>
      )}
    </Card>
  )
}
