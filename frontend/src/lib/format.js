const pad = n => String(n).padStart(2, '0')

export const fmtTime = iso => {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fmtDay = iso => {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export const fmtRange = (startIso, endIso) =>
  `${fmtDay(startIso)}, ${fmtTime(startIso)}–${fmtTime(endIso)}`
