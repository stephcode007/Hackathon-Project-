// A pretend agent: keyword matching instead of Claude, so the UI can be built
// before the backend exists. It returns the same { reply, cards } shape as the
// real `chat` Edge Function (see README "API contract"), plus the updated
// bookings list, because there's no database to hold them yet.

import { books, rooms, laptops, desks, student } from './data.js'
import { fmtTime, fmtRange } from '../lib/format.js'

const OPEN_HOUR = 8
const CLOSE_HOUR = 22
const MAX_HOURS = { room: 3, desk: 4, laptop: 4 }
const DEFAULT_HOURS = { room: 2, desk: 2, laptop: 2 }

let nextBookingNumber = 1001

const TIME = String.raw`(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)`

function parseClock(token) {
  const m = token.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  let hour = Number(m[1])
  const minute = Number(m[2] ?? 0)
  if (m[3] === 'pm' && hour < 12) hour += 12
  if (m[3] === 'am' && hour === 12) hour = 0
  // "at 2" with no am/pm almost certainly means the afternoon
  if (!m[3] && hour < OPEN_HOUR) hour += 12
  return { hour, minute: minute < 30 ? 0 : 30 }
}

function parseDay(text) {
  const day = new Date()
  day.setHours(0, 0, 0, 0)
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  if (/\btomorrow\b/.test(text)) day.setDate(day.getDate() + 1)
  return day
}

function at(day, { hour, minute }) {
  const d = new Date(day)
  d.setHours(hour, minute, 0, 0)
  return d
}

// Works out the requested slot and applies the library rules.
// Returns { start, end, notes } or { error }.
function parseSlot(text, type) {
  const day = parseDay(text)
  const notes = []

  const startMatch = text.match(new RegExp(String.raw`\b(?:at|from)\s+${TIME}`)) ??
    text.match(new RegExp(String.raw`\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b`))
  let start
  if (startMatch) {
    start = at(day, parseClock(startMatch[1]))
  } else {
    // no time given: start now, rounded up to the next half hour
    start = new Date()
    start.setSeconds(0, 0)
    start.setMinutes(start.getMinutes() <= 30 ? 30 : 60)
    if (day.toDateString() !== new Date().toDateString()) start = at(day, { hour: 10, minute: 0 })
  }

  let hours = DEFAULT_HOURS[type]
  const endMatch = text.match(new RegExp(String.raw`\b(?:to|until|till)\s+${TIME}`))
  const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b/)
  const minsMatch = text.match(/(\d+)\s*(?:m|mins?|minutes?)\b/)
  if (endMatch) hours = (at(day, parseClock(endMatch[1])) - start) / 3600000
  else if (hoursMatch) hours = Number(hoursMatch[1])
  else if (minsMatch) hours = Number(minsMatch[1]) / 60

  if (start < new Date(Date.now() - 30 * 60000)) return { error: "That time has already passed. Try a time later today or tomorrow." }
  const weekAhead = new Date()
  weekAhead.setDate(weekAhead.getDate() + 7)
  if (start > weekAhead) return { error: 'Bookings open up to 7 days ahead.' }
  if (start.getHours() < OPEN_HOUR || start.getHours() >= CLOSE_HOUR) {
    return { error: `The library is open ${OPEN_HOUR}:00–${CLOSE_HOUR}:00. Try a time in that window.` }
  }
  if (type === 'laptop' && start.toDateString() !== new Date().toDateString()) {
    return { error: 'Laptops can only be borrowed for the same day. Ask again on the day.' }
  }
  if (hours <= 0) return { error: "That end time is before the start time. Could you check it?" }

  if (hours > MAX_HOURS[type]) {
    notes.push(`${type[0].toUpperCase() + type.slice(1)}s can be booked for up to ${MAX_HOURS[type]} hours`)
    hours = MAX_HOURS[type]
  }
  let end = new Date(start.getTime() + Math.round(hours * 2) * 30 * 60000)
  const closing = at(day, { hour: CLOSE_HOUR, minute: 0 })
  if (end > closing) {
    notes.push(`the library closes at ${CLOSE_HOUR}:00`)
    end = closing
  }
  return { start, end, notes }
}

const overlaps = (b, resourceId, start, end) =>
  b.status === 'active' && b.resource_id === resourceId &&
  new Date(b.starts_at) < end && new Date(b.ends_at) > start

const isFree = (bookings, resourceId, start, end) =>
  !bookings.some(b => overlaps(b, resourceId, start, end))

function makeBooking(bookings, type, resource, slot) {
  const clash = bookings.find(b => overlaps(b, resource.resource_id, slot.start, slot.end))
  if (clash) {
    return {
      reply: `${resource.name} is already booked ${fmtTime(clash.starts_at)}–${fmtTime(clash.ends_at)}. Want a different time?`,
      cards: [],
      bookings,
    }
  }
  const booking = {
    booking_id: `BK-${nextBookingNumber++}`,
    resource_id: resource.resource_id,
    resource_type: type,
    resource_name: resource.name,
    floor: resource.floor,
    zone: resource.zone,
    features: resource.features,
    starts_at: slot.start.toISOString(),
    ends_at: slot.end.toISOString(),
    status: 'active',
  }
  const when = fmtRange(booking.starts_at, booking.ends_at)
  const reply = slot.notes.length
    ? `Heads up: ${slot.notes.join(' and ')}, so I booked ${resource.name} for ${when}.`
    : `Done! ${resource.name} is yours, ${when}.`
  return { reply, cards: [{ type: 'booking', data: booking }], bookings: [...bookings, booking] }
}

function availability(type, list, slot, bookings) {
  const options = list.filter(r => isFree(bookings, r.resource_id, slot.start, slot.end))
  const when = fmtRange(slot.start.toISOString(), slot.end.toISOString())
  if (!options.length) return { reply: `Nothing is free ${when}. Try another time?`, cards: [], bookings }
  return {
    reply: `Here's what's free ${when}.${slot.notes.length ? ` (Note: ${slot.notes.join(' and ')}.)` : ''}`,
    cards: [{
      type: 'availability',
      data: {
        resource_type: type,
        starts_at: slot.start.toISOString(),
        ends_at: slot.end.toISOString(),
        options,
      },
    }],
    bookings,
  }
}

const slotPhrase = slot => {
  const d = slot.start
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `on ${date} from ${fmtTime(slot.start)} to ${fmtTime(slot.end)}`
}

// The message a card's Book button sends back into the chat
export const bookMessage = (option, type, startsAt, endsAt) => {
  const label = type === 'laptop' ? `laptop ${option.number}` : option.name
  return `Book ${label} ${slotPhrase({ start: new Date(startsAt), end: new Date(endsAt) })}`
}

function handleLaptop(text, bookings) {
  const slot = parseSlot(text, 'laptop')
  if (slot.error) return { reply: slot.error, cards: [], bookings }
  const num = text.match(/laptop\s*#?\s*(\d+)/)
  if (!num) return availability('laptop', laptops, slot, bookings)
  const laptop = laptops.find(l => l.number === Number(num[1]))
  if (!laptop) return { reply: `We have laptops 1 to ${laptops.length}. Which one would you like?`, cards: [], bookings }
  return makeBooking(bookings, 'laptop', laptop, slot)
}

function handleDesk(text, bookings) {
  const slot = parseSlot(text, 'desk')
  if (slot.error) return { reply: slot.error, cards: [], bookings }
  const named = desks.find(d => text.includes(d.name.toLowerCase()))
  const desk = named ?? desks.find(d => isFree(bookings, d.resource_id, slot.start, slot.end))
  if (!desk) return { reply: 'All desks are taken then. Try another time?', cards: [], bookings }
  return makeBooking(bookings, 'desk', desk, slot)
}

function handleRoom(text, bookings) {
  const slot = parseSlot(text, 'room')
  if (slot.error) return { reply: slot.error, cards: [], bookings }
  const named = rooms.find(r => text.includes(r.name.toLowerCase()) || text.includes(r.name.split(' ').pop()))
  if (named && /\b(book|reserve)\b/.test(text)) return makeBooking(bookings, 'room', named, slot)

  const people = text.match(/\bfor\s+(\d+)(?!\s*(?:h|hrs?|hours?|m|mins?|minutes?|:|am|pm)\b)/) ??
    text.match(/(\d+)\s*(?:people|persons|students|of us)/)
  const capacity = people ? Number(people[1]) : 1
  const fits = rooms.filter(r => r.capacity >= capacity)
  if (!fits.length) return { reply: `Our biggest room fits ${Math.max(...rooms.map(r => r.capacity))}.`, cards: [], bookings }
  return availability('room', fits, slot, bookings)
}

function handleCancel(text, bookings) {
  const active = bookings.filter(b => b.status === 'active')
  const id = text.match(/bk-\d+/)
  const target = id
    ? active.find(b => b.booking_id.toLowerCase() === id[0])
    : active.find(b => text.includes(b.resource_name.toLowerCase())) ?? (active.length === 1 ? active[0] : null)
  if (!target) {
    return active.length
      ? { reply: 'Which booking should I cancel?', cards: [{ type: 'my_bookings', data: { bookings: active } }], bookings }
      : { reply: "You don't have any bookings to cancel.", cards: [], bookings }
  }
  return {
    reply: `Cancelled ${target.resource_name} (${fmtRange(target.starts_at, target.ends_at)}).`,
    cards: [{ type: 'cancelled', data: { booking_id: target.booking_id, resource_name: target.resource_name } }],
    bookings: bookings.map(b => (b === target ? { ...b, status: 'cancelled' } : b)),
  }
}

const STOP_WORDS = new Set(('do you have a an the any is there where can i find search for look looking ' +
  'book books called by about on please me get borrow need want copy of it what').split(' '))

function handleBooks(text, bookings) {
  const words = text.replace(/[^a-z0-9\s'-]/g, ' ').split(/\s+/).filter(w => w && !STOP_WORDS.has(w))
  if (!words.length) return null
  const query = words.join(' ')
  const results = books.filter(b => {
    const hay = `${b.title} ${b.author} ${b.subject}`.toLowerCase()
    return hay.includes(query) || words.every(w => hay.includes(w))
  })
  if (!results.length) return null
  const first = results[0]
  const reply = results.length === 1
    ? first.copies_available
      ? `${first.title} is on floor ${first.floor}, shelf ${first.shelf}, with ${first.copies_available} ${first.copies_available === 1 ? 'copy' : 'copies'} in.`
      : `${first.title} is on floor ${first.floor}, shelf ${first.shelf}, but all copies are out right now.`
    : `I found ${results.length} books. Here's where they are.`
  return { reply, cards: [{ type: 'books', data: { results } }], bookings }
}

const HELP =
  `I can find books and tell you where they are, book study rooms and desks, and lend you a laptop. Try "Do you have Clean Code?", "Book a room for 4 at 2pm tomorrow" or "Book laptop 3 for 2 hours".`

export function mockChat(messages, bookings) {
  const text = messages[messages.length - 1].content.toLowerCase().trim()

  if (/^(hi|hello|hey)\b/.test(text)) {
    return { reply: `Hi ${student.name}! ${HELP}`, cards: [], bookings }
  }
  if (/\bcancel\b/.test(text)) return handleCancel(text, bookings)
  if (/\bmy bookings?\b|what have i booked|my reservations/.test(text)) {
    const active = bookings.filter(b => b.status === 'active')
    return active.length
      ? { reply: `You have ${active.length} upcoming ${active.length === 1 ? 'booking' : 'bookings'}.`, cards: [{ type: 'my_bookings', data: { bookings: active } }], bookings }
      : { reply: "You don't have any bookings yet. Want me to book something?", cards: [], bookings }
  }
  if (/\blaptops?\b/.test(text)) return handleLaptop(text, bookings)
  if (/\bdesks?\b/.test(text)) return handleDesk(text, bookings)
  if (/\b(rooms?|pod)\b/.test(text)) return handleRoom(text, bookings)

  return handleBooks(text, bookings) ?? { reply: `Sorry, I didn't catch that. ${HELP}`, cards: [], bookings }
}
