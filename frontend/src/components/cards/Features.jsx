import Icon from '../Icon'

const FEATURES = {
  power: { icon: 'plug', label: 'Power' },
  screen: { icon: 'screen', label: 'Screen' },
  whiteboard: { icon: 'whiteboard', label: 'Whiteboard' },
  mac: { icon: 'laptop', label: 'macOS' },
  windows: { icon: 'laptop', label: 'Windows' },
}

export default function Features({ features = [], capacity, zone }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
      {capacity != null && (
        <span className="flex items-center gap-1">
          <Icon name="users" size={13} /> {capacity}
        </span>
      )}
      {zone && <span className="capitalize">{zone}</span>}
      {features.map((f) => (
        <span key={f} className="flex items-center gap-1">
          <Icon name={FEATURES[f]?.icon ?? 'check'} size={13} /> {FEATURES[f]?.label ?? f}
        </span>
      ))}
    </div>
  )
}
