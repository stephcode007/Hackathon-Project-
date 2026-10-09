import * as db from '../mocks/db'
import { LIVE, callFunction } from './api'
import { demoNow } from './time'

// Everything Alex has booked: study spaces and laptops, plus reserved books, and how busy the
// library is right now (null if that couldn't be worked out).
// Live: from the `bookings` Edge Function (same database as the chat). Otherwise: the mock.
export async function loadMyBookings() {
  if (!LIVE) {
    const now = demoNow()
    return {
      bookings: db.myBookings(now).map(db.toBookingData),
      reservations: db.myBookHolds(),
      busyness: db.liveBusyness(now),
    }
  }
  return callFunction('bookings', { action: 'list' })
}

export async function cancelSpace(bookingId) {
  if (!LIVE) return db.cancelBooking(bookingId)
  return callFunction('bookings', { action: 'cancel_booking', id: bookingId })
}

export async function cancelBook(holdId) {
  if (!LIVE) return db.cancelBookHold(holdId)
  return callFunction('bookings', { action: 'cancel_reservation', id: holdId })
}
