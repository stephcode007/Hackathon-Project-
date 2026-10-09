import { shortDate } from '../../lib/time'
import Card from './Card'
import Features from './Features'

const LABELS = { room: 'Rooms', desk: 'Desks', laptop: 'Laptops' }
const ICONS = { room: 'users', desk: 'spaces', laptop: 'laptop' }

export default function AvailabilityCard({ data, onAction }) {
  const { resource_type, date, start_time, end_time, day_word, options } = data
  return (
    <Card
      icon={ICONS[resource_type]}
      title={`${LABELS[resource_type]} free`}
      right={
        <span className="text-[11px] text-muted">
          {shortDate(new Date(date))} · {start_time}–{end_time}
        </span>
      }
    >
      <ul className="-my-1 divide-y divide-line">
        {options.map((o) => (
          <li key={o.resource_id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{o.name}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                <span>Floor {o.floor}</span>
                <Features features={o.features} capacity={o.capacity} zone={resource_type === 'desk' ? o.zone : null} />
              </div>
            </div>
            <button
              onClick={() => onAction(`Book ${o.name} ${day_word} from ${start_time} to ${end_time}`)}
              className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95 hover:bg-accent/90"
            >
              Book
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
