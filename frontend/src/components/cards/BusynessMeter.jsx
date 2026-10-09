import { LEVELS } from '../../lib/levels'

// Coloured fill with tick marks at the 40 / 70 / 90 % level boundaries
export default function BusynessMeter({ percent, level, typicalPercent }) {
  const color = LEVELS[level].color
  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-stone-100">
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(percent, 100)}%`, background: color }} />
      {[40, 70, 90].map((p) => (
        <span key={p} className="absolute top-0 h-full w-px bg-white/80" style={{ left: `${p}%` }} />
      ))}
      {typicalPercent != null && (
        <span
          title="Usual for this time"
          className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded bg-ink/60"
          style={{ left: `${Math.min(typicalPercent, 100)}%` }}
        />
      )}
    </div>
  )
}
