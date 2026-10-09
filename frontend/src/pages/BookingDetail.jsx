import Features from '../components/cards/Features'
import Icon from '../components/Icon'
import { downloadIcs } from '../lib/ics'
import { hhmm, relativeDay, shortDate } from '../lib/time'

const TYPE_LABEL = { room: 'Room booking', desk: 'Desk booking', laptop: 'Laptop loan' }
const ZONE_LABEL = { group: 'Group study', silent: 'Silent zone', quiet: 'Quiet zone' }

function Row({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon name={icon} size={18} className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0">
        <div className="text-xs text-muted">{label}</div>
        <div className="text-sm font-semibold">{children}</div>
      </div>
    </div>
  )
}

// One booking: what, when, where, with Cancel at the bottom
export default function BookingDetail({ booking: b, onBack, onCancel }) {
  const start = new Date(b.starts_at)
  const end = new Date(b.ends_at)
  const where = b.pickup ?? [`Floor ${b.floor}`, b.zone && ZONE_LABEL[b.zone]].filter(Boolean).join(' · ')

  return (
    <div className="flex min-h-full flex-col">
      <button onClick={onBack} className="mb-3 flex items-center gap-1.5 self-start px-1 text-sm font-semibold text-muted hover:text-ink">
        <Icon name="back" size={17} /> Bookings
      </button>

      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="text-[11px] font-semibold tracking-wide text-muted uppercase">{TYPE_LABEL[b.resource_type]}</div>
        <h1 className="font-display text-2xl leading-tight font-semibold">{b.resource_name}</h1>

        <div className="mt-2 divide-y divide-line">
          <Row icon="calendar" label="Date">
            {relativeDay(start)} · {shortDate(start)}
          </Row>
          <Row icon="clock" label="Time">
            {hhmm(start)}–{hhmm(end)}
          </Row>
          <Row icon="pin" label={b.resource_type === 'laptop' ? 'Collect from' : 'Where'}>
            {where}
          </Row>
          {(b.features?.length > 0 || b.capacity) && (
            <div className="py-3 pl-[30px] text-xs">
              <Features features={b.features} capacity={b.capacity} />
            </div>
          )}
          <Row icon="qr" label="Booking reference">
            <span className="font-mono">{b.booking_id.slice(0, 8).toUpperCase()}</span>
          </Row>
        </div>

        <button
          onClick={() => downloadIcs({ id: b.booking_id, title: b.resource_name, location: `Library, ${where}`, start, end })}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-line py-2.5 text-sm font-semibold transition hover:bg-paper active:scale-[0.99]"
        >
          <Icon name="calendar" size={15} /> Add to calendar
        </button>
      </div>

      <button
        onClick={() => onCancel(b)}
        className="mt-auto w-full rounded-2xl border border-very-busy/30 bg-white py-3 text-sm font-semibold text-very-busy transition hover:bg-very-busy/5 active:scale-[0.99]"
      >
        Cancel booking
      </button>
    </div>
  )
}
