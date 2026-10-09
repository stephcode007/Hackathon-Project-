import { LEVELS } from '../../lib/levels'
import { pad } from '../../lib/time'
import Card from './Card'

export default function PeakTimesCard({ data }) {
  const { day, is_today, now_hour, peak, quietest, hours } = data
  const max = Math.max(...hours.map((h) => h.avg_people), 1)

  return (
    <Card icon="chart" title={`Popular times · ${day}`}>
      <div className="flex h-28 items-end gap-[3px]">
        {hours.map((h) => {
          const isNow = is_today && h.hour === now_hour
          return (
            <div key={h.hour} className="group relative flex h-full flex-1 flex-col justify-end">
              {isNow && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-accent">NOW</span>}
              <div
                className={`rounded-t-[4px] transition-opacity ${isNow ? 'ring-2 ring-accent ring-offset-1' : 'opacity-80 group-hover:opacity-100'}`}
                style={{ height: `${Math.max((h.avg_people / max) * 82, 4)}%`, background: LEVELS[h.level].color }}
                title={`${pad(h.hour)}:00 · ~${h.avg_people} people`}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex gap-[3px] text-[9px] text-muted">
        {hours.map((h) => (
          <span key={h.hour} className="flex-1 text-center">
            {h.hour % 3 === 2 ? pad(h.hour) : ''}
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-very-busy/10 px-3 py-2">
          <div className="font-semibold text-very-busy">Peak</div>
          <div className="text-ink">{peak}</div>
        </div>
        <div className="rounded-xl bg-quiet/10 px-3 py-2">
          <div className="font-semibold text-quiet">Quietest</div>
          <div className="text-ink">{quietest}</div>
        </div>
      </div>
    </Card>
  )
}
