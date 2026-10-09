import { addMinutes, demoNow, hhmm, nextSlot } from '../../lib/time'
import Card from './Card'
import Features from './Features'

// Every room: free (with a Book button) or booked, and until when
export default function RoomStatusCard({ data, onAction }) {
  const start = nextSlot(demoNow())
  const free = data.rooms.filter((r) => r.free).length
  return (
    <Card icon="users" title="Rooms right now" right={<span className="text-[11px] text-muted">{free} free · {data.rooms.length - free} booked</span>}>
      <ul className="-my-1 divide-y divide-line">
        {data.rooms.map((r) => {
          const until = new Date(r.until)
          const end = new Date(Math.min(addMinutes(start, 120), until))
          const canBook = r.free && end - start >= 30 * 60000
          return (
            <li key={r.resource_id} className="flex items-center gap-3 py-2.5">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.free ? 'bg-quiet' : 'bg-stone-300'}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{r.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <span>Floor {r.floor}</span>
                  <Features features={r.features} capacity={r.capacity} />
                </div>
                <div className={`text-xs font-semibold ${r.mine ? 'text-accent' : r.free ? 'text-quiet' : 'text-muted'}`}>
                  {r.mine ? `Yours until ${hhmm(until)}` : r.free ? `Free until ${hhmm(until)}` : `Booked until ${hhmm(until)}`}
                </div>
              </div>
              {canBook && (
                <button
                  onClick={() => onAction(`Book ${r.name} today from ${hhmm(start)} to ${hhmm(end)}`)}
                  className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95 hover:bg-accent/90"
                >
                  Book
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
