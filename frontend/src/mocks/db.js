// In-memory stand-in for Supabase. Resets on page reload, which is handy for demos.
import { levelFor } from '../lib/levels'
import { CLOSE_HOUR, OPEN_HOUR, addDays, addMinutes, at, dayName, hourLabel, sameDay, startOfDay } from '../lib/time'

export const CAPACITY = 600

export const STUDENT = {
  id: 'demo-student-001',
  name: 'Alex',
  fullName: 'Alex Morgan',
  course: 'BSc Computer Science',
  year: 2,
  number: '20261001',
  qr: 'stacks:demo-student-001',
}

const room = (id, name, floor, capacity, features) => ({ id, type: 'room', name, floor, zone: 'group', capacity, features })

export const resources = [
  room('r1', 'Group Room 1.01', 1, 4, ['whiteboard']),
  room('r2', 'Group Room 1.02', 1, 6, ['whiteboard', 'screen']),
  room('r3', 'Group Room 2.03', 2, 4, ['screen']),
  room('r4', 'Group Room 2.04', 2, 6, ['whiteboard', 'screen']),
  room('r5', 'Group Room 2.05', 2, 8, ['whiteboard', 'screen']),
  room('r6', 'Seminar Room 3.01', 3, 12, ['screen', 'whiteboard']),
  room('r7', 'Study Pod 3.02', 3, 2, ['power']),
  room('r8', 'Study Pod 3.03', 3, 2, ['power']),
  ...deskRange('G', 1, 8, 1, 'group'),
  ...deskRange('S', 1, 12, 2, 'silent'),
  ...deskRange('Q', 9, 12, 3, 'quiet'),
  ...[1, 2, 3, 4].map((n) => ({ id: `lm${n}`, type: 'laptop', name: `MacBook Air #${n}`, floor: 1, zone: null, features: ['mac'] })),
  ...[1, 2, 3, 4].map((n) => ({ id: `lw${n}`, type: 'laptop', name: `Dell Latitude #${n}`, floor: 1, zone: null, features: ['windows'] })),
]

function deskRange(prefix, from, count, floor, zone) {
  return Array.from({ length: count }, (_, i) => {
    const n = String(from + i).padStart(2, '0')
    return { id: `d${prefix}${n}`, type: 'desk', name: `Desk ${prefix}-${n}`, floor, zone, features: (from + i) % 3 === 0 ? [] : ['power'] }
  })
}

export const books = [
  { book_id: 'b1', title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', subject: 'software engineering', floor: 3, shelf: 'QA76.76 .M37', copies_total: 3, copies_available: 2 },
  { book_id: 'b2', title: 'The Pragmatic Programmer', author: 'David Thomas, Andrew Hunt', isbn: '9780135957059', subject: 'software engineering', floor: 3, shelf: 'QA76.6 .H857', copies_total: 2, copies_available: 1 },
  { book_id: 'b3', title: 'Design Patterns', author: 'Gamma, Helm, Johnson, Vlissides', isbn: '9780201633610', subject: 'software engineering', floor: 3, shelf: 'QA76.64 .D47', copies_total: 2, copies_available: 0 },
  { book_id: 'b4', title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', isbn: '9780262046305', subject: 'algorithms computer science', floor: 3, shelf: 'QA76.6 .C662', copies_total: 5, copies_available: 3 },
  { book_id: 'b5', title: 'Refactoring', author: 'Martin Fowler', isbn: '9780134757599', subject: 'software engineering', floor: 3, shelf: 'QA76.76 .F69', copies_total: 2, copies_available: 2 },
  { book_id: 'b6', title: 'Structure and Interpretation of Computer Programs', author: 'Abelson, Sussman', isbn: '9780262510875', subject: 'programming computer science', floor: 3, shelf: 'QA76.6 .A255', copies_total: 1, copies_available: 1 },
  { book_id: 'b7', title: 'Code Complete', author: 'Steve McConnell', isbn: '9780735619678', subject: 'software engineering', floor: 3, shelf: 'QA76.76 .M33', copies_total: 2, copies_available: 1 },
  { book_id: 'b8', title: "Don't Make Me Think", author: 'Steve Krug', isbn: '9780321965516', subject: 'design usability web', floor: 2, shelf: 'TK5105.888 .K78', copies_total: 2, copies_available: 2 },
  { book_id: 'b9', title: 'The Design of Everyday Things', author: 'Don Norman', isbn: '9780465050659', subject: 'design psychology', floor: 2, shelf: 'TS171.4 .N67', copies_total: 3, copies_available: 1 },
  { book_id: 'b10', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '9780374533557', subject: 'psychology', floor: 2, shelf: 'BF441 .K238', copies_total: 4, copies_available: 0 },
  { book_id: 'b11', title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316097', subject: 'history', floor: 1, shelf: 'GN281 .H37', copies_total: 3, copies_available: 2 },
  { book_id: 'b12', title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', subject: 'physics science', floor: 1, shelf: 'QB981 .H377', copies_total: 2, copies_available: 1 },
]

// ---------- bookings ----------

let seq = 0
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `bk${Date.now()}${seq++}`)

// Other students' bookings today and tomorrow, so the availability looks realistic
const bookings = (() => {
  const out = []
  const today = startOfDay(new Date())
  resources.forEach((r, i) => {
    for (const d of [0, 1]) {
      const day = addDays(today, d)
      const blocks = [
        [8 + ((i * 5 + d * 3) % 6), 1 + (i % 3)],
        [13 + ((i * 3 + d) % 5), 1 + ((i + d) % 2)],
      ]
      for (const [h, len] of blocks) {
        out.push({ id: newId(), resource_id: r.id, student_id: 'seed', starts_at: at(day, h), ends_at: at(day, h + len), status: 'active' })
      }
    }
  })
  return out
})()

export const getResource = (id) => resources.find((r) => r.id === id)

export function findResourceByName(text) {
  const t = text.toLowerCase()
  return [...resources].sort((a, b) => b.name.length - a.name.length).find((r) => t.includes(r.name.toLowerCase()))
}

const active = (b) => b.status === 'active'

export function isFree(resourceId, start, end) {
  return !bookings.some((b) => active(b) && b.resource_id === resourceId && b.starts_at < end && b.ends_at > start)
}

export function findAvailable(type, start, end) {
  return resources.filter((r) => r.type === type && isFree(r.id, start, end))
}

export function nextFreeStart(resourceId, start, minutes) {
  for (let s = addMinutes(start, 30); s.getHours() < CLOSE_HOUR; s = addMinutes(s, 30)) {
    const e = addMinutes(s, minutes)
    if (e.getHours() > CLOSE_HOUR || (e.getHours() === CLOSE_HOUR && e.getMinutes() > 0)) break
    if (isFree(resourceId, s, e)) return s
  }
  return null
}

// Status of a resource at `now`: free (and until when) or taken (and until when)
export function statusAt(resourceId, now) {
  const todays = bookings
    .filter((b) => active(b) && b.resource_id === resourceId && sameDay(b.starts_at, now))
    .sort((a, b) => a.starts_at - b.starts_at)
  const current = todays.find((b) => b.starts_at <= now && b.ends_at > now)
  if (current) {
    // merge back-to-back bookings
    let until = current.ends_at
    for (const b of todays) if (b.starts_at <= until && b.ends_at > until) until = b.ends_at
    return { free: false, until, mine: current.student_id === STUDENT.id }
  }
  const next = todays.find((b) => b.starts_at > now)
  return { free: true, until: next ? next.starts_at : at(now, CLOSE_HOUR) }
}

export function createBooking(resourceId, start, end) {
  const b = { id: newId(), resource_id: resourceId, student_id: STUDENT.id, starts_at: start, ends_at: end, status: 'active' }
  bookings.push(b)
  return b
}

export function cancelBooking(idPrefix) {
  const b = bookings.find((x) => x.student_id === STUDENT.id && active(x) && x.id.startsWith(idPrefix))
  if (b) b.status = 'cancelled'
  return b
}

export const isCancelled = (id) => bookings.find((b) => b.id === id)?.status === 'cancelled'

export function myBookings(now) {
  return bookings
    .filter((b) => b.student_id === STUDENT.id && active(b) && b.ends_at > now)
    .sort((a, b) => a.starts_at - b.starts_at)
}

export function toBookingData(b) {
  const r = getResource(b.resource_id)
  return {
    booking_id: b.id,
    resource_type: r.type,
    resource_name: r.name,
    floor: r.floor,
    zone: r.zone,
    capacity: r.capacity,
    features: r.features,
    starts_at: b.starts_at.toISOString(),
    ends_at: b.ends_at.toISOString(),
  }
}

// ---------- busyness ----------

// Typical people inside on a Mon–Thu, 08:00 … 21:00 (stands in for the typical_busyness view)
const WEEKDAY_CURVE = [80, 160, 260, 400, 500, 540, 520, 400, 340, 280, 200, 180, 120, 70]
const DAY_FACTOR = [0.45, 1, 1, 1, 1, 0.75, 0.5] // Sun … Sat

let livePeople = 318

export const typicalPeople = (date, hour) =>
  hour < OPEN_HOUR || hour >= CLOSE_HOUR ? 0 : Math.round(WEEKDAY_CURVE[hour - OPEN_HOUR] * DAY_FACTOR[date.getDay()])

const pct = (people) => Math.round((people / CAPACITY) * 100)

export function liveBusyness(now) {
  return {
    is_live: true,
    people: livePeople,
    capacity: CAPACITY,
    percent: pct(livePeople),
    level: levelFor(pct(livePeople)),
    as_of: now.toISOString(),
    typical_now: typicalPeople(now, now.getHours()),
  }
}

export function typicalBusyness(date, hour) {
  const people = typicalPeople(date, hour)
  return {
    is_live: false,
    people,
    capacity: CAPACITY,
    percent: pct(people),
    level: levelFor(pct(people)),
    as_of: at(date, hour).toISOString(),
    typical_now: people,
  }
}

// Demo helper (what the gate's "Simulate rush" button does)
export function simulateRush(n) {
  livePeople = Math.min(CAPACITY, livePeople + n)
}

function ranges(hours) {
  const out = []
  for (const h of hours) {
    const last = out[out.length - 1]
    if (last && last[1] === h) last[1] = h + 1
    else out.push([h, h + 1])
  }
  return out.map(([a, b]) => `${hourLabel(a)}–${hourLabel(b)}`)
}

export function peakTimes(date, now) {
  const hours = []
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    const avg = typicalPeople(date, h)
    hours.push({ hour: h, avg_people: avg, level: levelFor(pct(avg)) })
  }
  const max = Math.max(...hours.map((h) => h.avg_people))
  return {
    day: dayName(date),
    is_today: sameDay(date, now),
    now_hour: now.getHours(),
    peak: ranges(hours.filter((h) => h.avg_people >= max * 0.85).map((h) => h.hour)).join(' & '),
    quietest: ranges(hours.filter((h) => h.avg_people <= max * 0.4).map((h) => h.hour)).join(' & '),
    hours,
  }
}
