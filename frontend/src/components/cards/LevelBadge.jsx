import { LEVELS } from '../../lib/levels'

export default function LevelBadge({ level, size = 'md' }) {
  const { label, color } = LEVELS[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${size === 'lg' ? 'px-3 py-1 text-base' : 'px-2 py-0.5 text-xs'}`}
      style={{ color, background: `${color}1f` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
