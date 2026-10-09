import { hhmm, dayName } from '../../lib/time'
import BusynessMeter from './BusynessMeter'
import Card from './Card'
import LevelBadge from './LevelBadge'

export default function BusynessCard({ data }) {
  const { is_live, people, capacity, percent, level, as_of, typical_now } = data
  const when = new Date(as_of)
  const typicalPercent = Math.round((typical_now / capacity) * 100)
  const diff = people - typical_now

  return (
    <Card
      icon="activity"
      title={is_live ? 'Library right now' : `Usually · ${dayName(when)} ${hhmm(when)}`}
      right={
        is_live && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-quiet">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-quiet opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-quiet" />
            </span>
            LIVE
          </span>
        )
      }
    >
      <div className="mb-3 flex items-end justify-between">
        <LevelBadge level={level} size="lg" />
        <div className="text-right">
          <div className="font-display text-2xl leading-none font-semibold">{percent}%</div>
          <div className="text-[11px] text-muted">full</div>
        </div>
      </div>
      <BusynessMeter percent={percent} level={level} typicalPercent={is_live ? typicalPercent : null} />
      <div className="mt-2.5 flex justify-between text-xs text-muted">
        <span>
          <b className="text-ink">{people}</b> of {capacity} seats taken
        </span>
        {is_live && (
          <span>
            Usually {typical_now} · {diff > 20 ? 'busier than normal' : diff < -20 ? 'quieter than normal' : 'about normal'}
          </span>
        )}
      </div>
    </Card>
  )
}
