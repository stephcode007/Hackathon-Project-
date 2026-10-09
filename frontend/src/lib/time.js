export const OPEN_HOUR = 8
export const CLOSE_HOUR = 22

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export const pad = (n) => String(n).padStart(2, '0')
export const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
export const hourLabel = (h) => `${pad(h)}:00`

export function dayName(d) {
  const name = DAYS[d.getDay()]
  return name[0].toUpperCase() + name.slice(1)
}

export function shortDate(d) {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function addMinutes(d, n) {
  return new Date(d.getTime() + n * 60000)
}

export function at(day, h, m = 0) {
  const x = startOfDay(day)
  x.setHours(h, m, 0, 0)
  return x
}

export const sameDay = (a, b) => a.toDateString() === b.toDateString()

// "today" / "tomorrow" / "on Monday": also what parseDay() understands
export function dayWord(d, now = new Date()) {
  if (sameDay(d, now)) return 'today'
  if (sameDay(d, addDays(now, 1))) return 'tomorrow'
  return `on ${dayName(d)}`
}

export function relativeDay(d, now = new Date()) {
  if (sameDay(d, now)) return 'Today'
  if (sameDay(d, addDays(now, 1))) return 'Tomorrow'
  return shortDate(d)
}

// The prototype pretends the library is open: outside opening hours we act as if it's
// 14:10 today, so the demo always has something to show.
export function demoNow() {
  const n = new Date()
  if (n.getHours() < OPEN_HOUR || n.getHours() >= CLOSE_HOUR - 1) return at(n, 14, 10)
  return n
}

// Next 30-minute step after `now`
export function nextSlot(now) {
  const x = new Date(now)
  x.setSeconds(0, 0)
  const m = x.getMinutes()
  x.setMinutes(m < 30 ? 30 : 60)
  return x
}

export function parseDay(text, now) {
  const t = text.toLowerCase()
  if (/\btomorrow\b/.test(t)) return { date: addDays(now, 1), named: true }
  if (/\btoday\b|\btonight\b/.test(t)) return { date: now, named: false }
  for (let i = 0; i < 7; i++) {
    if (new RegExp(`\\b${DAYS[i]}s?\\b`).test(t)) {
      const diff = (i - now.getDay() + 7) % 7
      return { date: addDays(now, diff), named: true }
    }
  }
  return { date: now, named: false }
}

export function parseClock(text) {
  let m = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
  if (!m) m = text.match(/\b(?:at|from)\s+(\d{1,2})(?::(\d{2}))?\b/i)
  if (!m) m = text.match(/\b(\d{1,2}):(\d{2})\b/)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2] || 0)
  const ap = (m[3] || '').toLowerCase()
  if (ap === 'pm' && h < 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  if (!ap && h < OPEN_HOUR) h += 12 // "at 4" means 16:00 in a library
  return { h, m: min >= 30 ? 30 : 0 }
}

export function parseDuration(text) {
  const h = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i)
  if (h) return Math.round(Number(h[1]) * 60)
  const m = text.match(/(\d+)\s*(?:m|min|mins|minutes)\b/i)
  if (m) return Number(m[1])
  return null
}
