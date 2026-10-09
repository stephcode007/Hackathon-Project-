import { CLOSE_HOUR, addMinutes, at, nextSlot } from '../../lib/time'

// The slot a "Book" tap asks for: from the next half hour, cut short by the next booking or closing time
export function quickSlot(now, minutes, freeUntil) {
  const start = nextSlot(now)
  let end = addMinutes(start, minutes)
  if (freeUntil < end) end = freeUntil
  if (end > at(now, CLOSE_HOUR)) end = at(now, CLOSE_HOUR)
  return end - start >= 30 * 60000 ? { start, end } : null
}
