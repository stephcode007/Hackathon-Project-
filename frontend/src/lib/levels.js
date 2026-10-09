export const LEVELS = {
  quiet: { label: 'Quiet', color: '#2e9e6b' },
  moderate: { label: 'Moderate', color: '#e0a526' },
  busy: { label: 'Busy', color: '#e8742c' },
  very_busy: { label: 'Very busy', color: '#d64242' },
}

export function levelFor(percent) {
  if (percent < 40) return 'quiet'
  if (percent < 70) return 'moderate'
  if (percent < 90) return 'busy'
  return 'very_busy'
}
