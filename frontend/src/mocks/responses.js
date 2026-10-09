// Fake agent: matches keywords in the last message and returns { reply, cards }
// in the same shape as the real `chat` Edge Function (see README → API contract).
import { LEVELS, levelFor } from '../lib/levels'
import {
  CLOSE_HOUR, OPEN_HOUR, addMinutes, at, dayName, dayWord, demoNow, hhmm, hourLabel,
  nextSlot, parseClock, parseDay, parseDuration, sameDay, shortDate,
} from '../lib/time'
import * as db from './db'

const RESOURCE_WORDS = /\b(room|rooms|desk|desks|laptop|laptops|macbook|pod)\b/

export function mockReply(messages) {
  const text = messages[messages.length - 1].content.trim()
  const t = text.toLowerCase()
  const now = demoNow()

  // Messages sent by card buttons
  let m = t.match(/^book (.+?) (today|tomorrow|on \w+) from (\d{1,2}:\d{2}) to (\d{1,2}:\d{2})/)
  if (m) return bookNamed(m, now)
  m = t.match(/^cancel booking (\w+)/)
  if (m) return cancel(m[1])

  if (/my bookings|what (have i|did i) book|my reservations|upcoming/.test(t)) return myBookings(now)
  if (/\b(pass|qr|barcode|student id|scan in)\b/.test(t)) {
    return {
      reply: "Here's your library pass. Hold it up to the gate scanner.",
      cards: [{ type: 'library_pass', data: { student_name: db.STUDENT.name, qr_value: db.STUDENT.qr } }],
    }
  }

  if (/how (do i|to|can i|does it|do you) book|how does booking work/.test(t)) return howToBook()

  // "Find me X, book me a room and a laptop" → do it all in one go
  const combo = allInOne(t, now)
  if (combo) return combo

  // "What rooms are free / booked?" with no time → every room and its status right now
  if (!parseClock(t) && /\b(which|what|any) rooms?\b|\brooms? (are |is )?(free|booked|taken|available|left)\b|room status/.test(t)) {
    return roomOverview(now)
  }

  const replies = []
  const cards = []
  const add = (r) => {
    if (r.reply) replies.push(r.reply)
    cards.push(...r.cards)
  }

  if (/quiet|peak|popular|busiest|best time|when/.test(t) && !RESOURCE_WORDS.test(t)) add(peak(t, now))
  else if (/busy|packed|full|crowded|worth (going|it)|how many people|people inside/.test(t)) add(busyness(t, now))
  if (/\b(room|rooms|pod)\b/.test(t)) add(rooms(t, now))
  if (/\bdesks?\b/.test(t)) add(desks(t, now))
  if (/\b(laptops?|macbook|computer)\b/.test(t)) add(laptops(t, now))
  const q = bookQuery(t)
  if (q) add(searchBooks(q))

  if (!replies.length && !cards.length) {
    return {
      reply: "I can find books and tell you where they are, show which rooms are free, book rooms, desks and laptops, and check how busy it is. Try “Do you have a machine learning book?” or “How many laptops are free?”",
      cards: [],
    }
  }
  return { reply: replies.join(' '), cards }
}

// ---------- busyness ----------

function busyness(t, now) {
  const { date, named } = parseDay(t, now)
  const clock = parseClock(t)
  if (!named && !clock) {
    const data = db.liveBusyness(now)
    const lines = {
      quiet: `Quiet right now: ${data.people} people in, plenty of seats.`,
      moderate: `Moderate: ${data.people} people in, about half full.`,
      busy: `It's getting busy, ${data.people} of ${data.capacity} seats taken.`,
      very_busy: `🔴 Very busy right now. Want me to hold a desk for you, or try after 18:00?`,
    }
    return { reply: lines[data.level], cards: [{ type: 'busyness', data }] }
  }
  const hour = clock ? clock.h : now.getHours()
  const data = db.typicalBusyness(date, hour)
  return {
    reply: `${dayName(date)}s at ${hourLabel(hour)} are usually ${LEVELS[data.level].label.toLowerCase()}, around ${data.people} people.`,
    cards: [{ type: 'busyness', data }],
  }
}

function peak(t, now) {
  const { date } = parseDay(t, now)
  const data = db.peakTimes(date, now)
  return {
    reply: `${data.day}s peak around ${data.peak}. Quietest: ${data.quietest}.`,
    cards: [{ type: 'peak_times', data }],
  }
}

// Peak-aware booking: one short line naming a quieter time
function peakNote(start) {
  const level = levelFor((db.typicalPeople(start, start.getHours()) / db.CAPACITY) * 100)
  if (level !== 'busy' && level !== 'very_busy') return ''
  for (let h = start.getHours() + 1; h < CLOSE_HOUR - 1; h++) {
    if (db.typicalPeople(start, h) < db.CAPACITY * 0.6) {
      return `Heads up: ${hhmm(start)} is usually peak time, ${hourLabel(h)} is much calmer.`
    }
  }
  return `Heads up: ${hhmm(start)} is usually peak time.`
}

// ---------- finding + booking ----------

const MAX_MINUTES = { room: 180, desk: 240, laptop: 240 }

function slotFrom(t, now, type, defaultMinutes) {
  const { date } = parseDay(t, now)
  const clock = parseClock(t)
  const start = clock ? at(date, clock.h, clock.m) : sameDay(date, now) ? nextSlot(now) : at(date, 10)
  const minutes = Math.min(parseDuration(t) ?? defaultMinutes, MAX_MINUTES[type])
  let end = addMinutes(start, minutes)
  if (end > at(start, CLOSE_HOUR)) end = at(start, CLOSE_HOUR)

  if (start < addMinutes(now, -30)) return { error: "That time has already passed. Want to try a later slot?" }
  if (start.getHours() < OPEN_HOUR || start >= at(start, CLOSE_HOUR)) {
    return { error: `The library is open ${hourLabel(OPEN_HOUR)}–${hourLabel(CLOSE_HOUR)}. Pick a time in that window?` }
  }
  if (type === 'laptop' && !sameDay(start, now)) return { error: 'Laptops are same-day loans only. Ask me on the day!' }
  return { start, end }
}

const availability = (type, slot, options) => ({
  type: 'availability',
  data: {
    resource_type: type,
    date: slot.start.toISOString(),
    start_time: hhmm(slot.start),
    end_time: hhmm(slot.end),
    day_word: dayWord(slot.start, demoNow()),
    options: options.map((r) => ({ resource_id: r.id, name: r.name, floor: r.floor, zone: r.zone, capacity: r.capacity, features: r.features, pickup: r.pickup })),
  },
})

const when = (slot) => `${dayWord(slot.start, demoNow())} ${hhmm(slot.start)}–${hhmm(slot.end)}`

function rooms(t, now) {
  const slot = slotFrom(t, now, 'room', 120)
  if (slot.error) return { reply: slot.error, cards: [] }
  const people = partySize(t)
  const all = freeRooms(slot, people)
  const options = all.slice(0, 4)
  const note = peakNote(slot.start)
  const who = people > 1 ? people : 'you'
  // Show the choice and let the student confirm by tapping Book
  const found = !all.length
    ? `No rooms for ${who} are free ${when(slot)}. Try another time?`
    : all.length === 1
      ? `This is the only room left for ${who} ${when(slot)}: ${all[0].name} on floor ${all[0].floor}. Want me to book it?`
      : `${all.length} rooms left for ${who} ${when(slot)}. ${all[0].name} on floor ${all[0].floor} is the best fit. Want that one, or another?`
  return { reply: [note, found].filter(Boolean).join(' '), cards: options.length ? [availability('room', slot, options)] : [] }
}

const partySize = (t) =>
  Number(t.match(/for (\d+)(?!\s*(?:h|hr|hour|min|am|pm|:))/)?.[1] ?? t.match(/(\d+) (?:people|of us|students)/)?.[1] ?? 1)

// Smallest suitable room first, so one person gets a study pod, not the seminar room
const freeRooms = (slot, people) =>
  db.findAvailable('room', slot.start, slot.end).filter((r) => r.capacity >= people).sort((a, b) => a.capacity - b.capacity)

function roomOverview(now) {
  const list = db.roomStatus(now)
  const free = list.filter((r) => r.free).length
  return {
    reply: `${free} of ${list.length} rooms are free right now and ${list.length - free} are booked. Tap a free one to book it.`,
    cards: [{ type: 'room_status', data: { as_of: now.toISOString(), rooms: list } }],
  }
}

function howToBook() {
  return {
    reply:
      'Just tell me what you need and when, like “Room for 4 at 2pm tomorrow” or “Book a laptop for 2 hours”. I’ll show you what’s free, you tap the one you want, and it’s booked. Rooms are up to 3 hours, desks and laptops up to 4 (laptops same day only), between 08:00 and 22:00, up to 7 days ahead.',
    cards: [],
  }
}

function desks(t, now) {
  const slot = slotFrom(t, now, 'desk', 120)
  if (slot.error) return { reply: slot.error, cards: [] }
  const zone = t.match(/\b(silent|quiet|group)\b/)?.[1]
  const power = /plug|power|socket|charg/.test(t)
  const options = db.findAvailable('desk', slot.start, slot.end)
    .filter((r) => (!zone || r.zone === zone) && (!power || r.features.includes('power')))
  if (!options.length) return { reply: `No matching desks free ${when(slot)}. Try another time?`, cards: [] }

  // Everything needed is there → book straight away
  if (/\b(book|reserve|grab|hold)\b/.test(t) && parseClock(t)) {
    const b = db.createBooking(options[0].id, slot.start, slot.end)
    const note = peakNote(slot.start)
    return {
      reply: [`Done! ${options[0].name} on floor ${options[0].floor} is yours ${when(slot)}.`, note].filter(Boolean).join(' '),
      cards: [{ type: 'booking', data: db.toBookingData(b) }],
    }
  }
  return { reply: `${options.length} desks free ${when(slot)}. Here are a few.`, cards: [availability('desk', slot, options.slice(0, 4))] }
}

function laptops(t, now) {
  const slot = slotFrom(t, now, 'laptop', 180)
  if (slot.error) return { reply: slot.error, cards: [] }
  const os = /\bmac/.test(t) ? 'mac' : /windows|dell|pc\b/.test(t) ? 'windows' : null
  const total = db.resources.filter((r) => r.type === 'laptop').length
  const options = db.findAvailable('laptop', slot.start, slot.end).filter((r) => !os || r.features.includes(os))
  if (!options.length) return { reply: `All laptops are out ${when(slot)}. Try a bit later?`, cards: [] }
  if (options.length === 1) {
    const l = options[0]
    return { reply: `Only one laptop left ${when(slot)}: ${l.name}, from the ${l.pickup.toLowerCase()}. Want it?`, cards: [availability('laptop', slot, options)] }
  }
  // Say how many are free and where each kind is collected
  const byPickup = {}
  for (const l of options) byPickup[l.pickup] = (byPickup[l.pickup] ?? 0) + 1
  const where = Object.entries(byPickup)
    .map(([pickup, n]) => `${n} at the ${pickup.toLowerCase()}`)
    .join(' and ')
  return {
    reply: `${options.length} of ${total} laptops are free ${when(slot)}: ${where}. Tap one to book it.`,
    cards: [availability('laptop', slot, options.slice(0, 4))],
  }
}

// ---------- all in one ----------

// "I'm looking for the machine learning book, book me a room and a laptop"
// Books everything straight away and says where it all is.
function allInOne(t, now) {
  const wantsRoom = /\brooms?\b|\bpod\b/.test(t)
  const wantsLaptop = /\blaptops?\b/.test(t)
  const q = bookQuery(t)
  const asksToBook = /\bbook (?:me )?(?:a |an |the )?(?:study |group )?(?:room|laptop|pod)/.test(t)
  if (!asksToBook || [wantsRoom, wantsLaptop, Boolean(q)].filter(Boolean).length < 2) return null

  const lines = []
  const cards = []

  if (q) {
    const found = searchBooks(q)
    const results = found.cards[0]?.data.results ?? []
    const b = results.find((x) => x.copies_available) ?? results[0]
    if (!b) lines.push(`I couldn't find a book for “${q}”.`)
    else if (b.copies_available) lines.push(`${b.title} is on floor ${b.floor} in ${b.section}, shelf ${b.shelf}.`)
    else lines.push(`${b.title} is taken out right now, due back ${shortDate(new Date(b.due_back))}.`)
    if (b) cards.push({ type: 'books', data: { results: [b] } })
  }

  if (wantsRoom) {
    const slot = slotFrom(t, now, 'room', 120)
    const people = partySize(t)
    const room = slot.error ? null : freeRooms(slot, people)[0]
    if (slot.error) lines.push(slot.error)
    else if (!room) lines.push(`No rooms for ${people} are free ${when(slot)}.`)
    else {
      const b = db.createBooking(room.id, slot.start, slot.end)
      lines.push(`I've booked ${room.name} on floor ${room.floor} for you ${when(slot)}${people === 1 ? ", since it's just you" : ` for ${people} people`}.`)
      cards.push({ type: 'booking', data: db.toBookingData(b) })
    }
  }

  if (wantsLaptop) {
    const slot = slotFrom(t, now, 'laptop', 180)
    const os = /\bmac/.test(t) ? 'mac' : /windows|dell|pc\b/.test(t) ? 'windows' : null
    const laptop = slot.error ? null : db.findAvailable('laptop', slot.start, slot.end).find((r) => !os || r.features.includes(os))
    if (slot.error) lines.push(slot.error)
    else if (!laptop) lines.push(`All laptops are out ${when(slot)}.`)
    else {
      const b = db.createBooking(laptop.id, slot.start, slot.end)
      lines.push(`And ${laptop.name} is yours ${when(slot)}. Pick it up from the ${laptop.pickup.toLowerCase()}.`)
      cards.push({ type: 'booking', data: db.toBookingData(b) })
    }
  }

  return { reply: `Okay, that's all done! ${lines.join(' ')}`, cards }
}

function bookNamed([, name, day, from, to], now) {
  const r = db.findResourceByName(name)
  if (!r) return { reply: `I couldn't find “${name}”.`, cards: [] }
  const date = parseDay(day, now).date
  const [fh, fm] = from.split(':').map(Number)
  const [th, tm] = to.split(':').map(Number)
  const start = at(date, fh, fm)
  const end = at(date, th, tm)
  if (!db.isFree(r.id, start, end)) {
    const next = db.nextFreeStart(r.id, start, (end - start) / 60000)
    return { reply: `${r.name} is taken then.${next ? ` Next free slot is ${hhmm(next)}.` : ''}`, cards: [] }
  }
  const b = db.createBooking(r.id, start, end)
  const slot = { start, end }
  return {
    reply: [`Done! ${r.name} is yours ${when(slot)}.`, peakNote(start)].filter(Boolean).join(' '),
    cards: [{ type: 'booking', data: db.toBookingData(b) }],
  }
}

function cancel(prefix) {
  const b = db.cancelBooking(prefix)
  if (!b) return { reply: "I couldn't find that booking. It may already be cancelled.", cards: [] }
  const r = db.getResource(b.resource_id)
  return { reply: `Cancelled. ${r.name} is free again.`, cards: [{ type: 'cancelled', data: { booking_id: b.id, resource_name: r.name } }] }
}

function myBookings(now) {
  const list = db.myBookings(now).map(db.toBookingData)
  return {
    reply: list.length ? `You have ${list.length} upcoming booking${list.length > 1 ? 's' : ''}.` : "You don't have any upcoming bookings.",
    cards: [{ type: 'my_bookings', data: { bookings: list } }],
  }
}

// ---------- books ----------

function bookQuery(t) {
  const title = db.books.find((b) => t.includes(b.title.toLowerCase()))
  if (title) return title.title
  // Look at each part of the message on its own, so "find X and book a room" still finds X
  for (const part of t.split(/[.!?;,]|\band (?:i |also |then )/)) {
    if (RESOURCE_WORDS.test(part)) continue
    const m = part
      .trim()
      .match(/(?:do you have|have you got|got any|find me|looking for|search for|where is|where's|books? (?:on|about|by))\s+(?:a |an |any |the |this |that )?(?:books? )?(?:on |about |by |called )?(.+?)[?.!]*$/)
    if (m) return m[1].replace(/\s+(?:books?|textbooks?)$/, '').trim()
  }
  return null
}

function searchBooks(q) {
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  const results = db.books.filter((b) => {
    const hay = `${b.title} ${b.author} ${b.subject}`.toLowerCase()
    return hay.includes(q.toLowerCase()) || (words.length && words.every((w) => hay.includes(w)))
  })
  if (!results.length) return { reply: `I couldn't find anything for “${q}”.`, cards: [] }
  const first = results[0]
  const onShelf = results.filter((b) => b.copies_available).length
  const reply =
    results.length === 1
      ? first.copies_available
        ? `Yes! ${first.title} is on floor ${first.floor} in ${first.section}, shelf ${first.shelf}. ${first.copies_available} of ${first.copies_total} copies are in.`
        : `${first.title} is taken out right now (all ${first.copies_total} copies). The next one is due back ${shortDate(new Date(first.due_back))}.`
      : `Found ${results.length} books, ${onShelf} on the shelf right now. Here's where they are.`
  return { reply, cards: [{ type: 'books', data: { results: results.slice(0, 5) } }] }
}
