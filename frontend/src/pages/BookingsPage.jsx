import { useState } from 'react'
import { demoNow } from '../lib/time'
import { cancelBookHold, cancelBooking, liveBusyness, myBookHolds, myBookings, toBookingData } from '../mocks/db'
import BookingDetail from './bookings/BookingDetail'
import BookPreview from './bookings/BookPreview'
import MyBookings from './bookings/MyBookings'

// Bookings: just what you've booked. Tap one to see its details (and cancel it).
// Booking itself happens in Chat.
export default function BookingsPage({ onGoChat }) {
  const [open, setOpen] = useState(null) // { kind: 'booking' | 'book', id }
  const now = demoNow()
  const back = () => setOpen(null)

  let page = null
  if (open?.kind === 'booking') {
    const b = myBookings(now).map(toBookingData).find((x) => x.booking_id === open.id)
    if (b) {
      page = (
        <BookingDetail
          booking={b}
          onBack={back}
          onCancel={() => {
            cancelBooking(b.booking_id)
            back()
          }}
        />
      )
    }
  } else if (open?.kind === 'book') {
    const h = myBookHolds().find((x) => x.hold_id === open.id)
    if (h) {
      page = (
        <BookPreview
          hold={h}
          onBack={back}
          onCancel={() => {
            cancelBookHold(h.hold_id)
            back()
          }}
        />
      )
    }
  }

  if (page) return <div className="no-scrollbar h-full overflow-y-auto px-4 pt-2 pb-6">{page}</div>

  const live = liveBusyness(now)
  const busy = live.level === 'busy' || live.level === 'very_busy'

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto px-4 pt-2 pb-6">
      <MyBookings
        onOpenBooking={(id) => setOpen({ kind: 'booking', id })}
        onOpenBook={(id) => setOpen({ kind: 'book', id })}
        onGoChat={onGoChat}
      />

      {/* Small and quiet at the bottom: green when there's room, red when it's busy */}
      <div className="mt-auto flex items-center justify-center gap-2 pt-6 text-xs text-muted">
        <span className={`h-2 w-2 rounded-full ${busy ? 'bg-very-busy' : 'bg-quiet'}`} />
        <span className={`font-semibold ${busy ? 'text-very-busy' : 'text-quiet'}`}>{busy ? 'Busy right now' : 'Not busy right now'}</span>
        <span>
          · {live.people} of {live.capacity} seats taken
        </span>
      </div>
    </div>
  )
}
