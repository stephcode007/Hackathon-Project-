import { useEffect, useState } from 'react'
import { cancelBook, cancelSpace, loadMyBookings } from '../lib/bookings'
import BookingDetail from './bookings/BookingDetail'
import BookPreview from './bookings/BookPreview'
import MyBookings from './bookings/MyBookings'

// Bookings: just what you've booked. Tap one to see its details (and cancel it).
// Booking itself happens in Chat.
export default function BookingsPage({ onGoChat }) {
  const [open, setOpen] = useState(null) // { kind: 'booking' | 'book', id }
  const [mine, setMine] = useState(null) // { bookings, reservations }, null while loading
  const [failed, setFailed] = useState(false)

  // Reloads every time the Bookings tab is opened, so anything just booked in Chat shows up
  async function reload() {
    try {
      setMine(await loadMyBookings())
      setFailed(false)
    } catch (err) {
      console.warn('Could not load bookings', err)
      setFailed(true)
    }
  }
  useEffect(() => {
    reload()
  }, [])

  const back = () => setOpen(null)
  async function cancelAndBack(cancel, id) {
    try {
      await cancel(id)
    } catch (err) {
      console.warn('Cancel failed', err)
    }
    back()
    reload()
  }

  let page = null
  if (open?.kind === 'booking') {
    const b = mine?.bookings.find((x) => x.booking_id === open.id)
    if (b) {
      page = (
        <BookingDetail
          booking={b}
          onBack={back}
          onCancel={() => cancelAndBack(cancelSpace, b.booking_id)}
        />
      )
    }
  } else if (open?.kind === 'book') {
    const h = mine?.reservations.find((x) => x.hold_id === open.id)
    if (h) {
      page = (
        <BookPreview
          hold={h}
          onBack={back}
          onCancel={() => cancelAndBack(cancelBook, h.hold_id)}
        />
      )
    }
  }

  if (page) return <div className="no-scrollbar h-full overflow-y-auto px-4 pt-2 pb-6">{page}</div>

  const live = mine?.busyness
  const busy = live?.level === 'busy' || live?.level === 'very_busy'

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto px-4 pt-2 pb-6">
      <MyBookings
        spaces={mine?.bookings}
        books={mine?.reservations}
        failed={failed}
        onRetry={reload}
        onOpenBooking={(id) => setOpen({ kind: 'booking', id })}
        onOpenBook={(id) => setOpen({ kind: 'book', id })}
        onGoChat={onGoChat}
      />

      {/* Small and quiet at the bottom: green when there's room, red when it's busy */}
      {live && (
        <div className="mt-auto flex items-center justify-center gap-2 pt-6 text-xs text-muted">
          <span className={`h-2 w-2 rounded-full ${busy ? 'bg-very-busy' : 'bg-quiet'}`} />
          <span className={`font-semibold ${busy ? 'text-very-busy' : 'text-quiet'}`}>{busy ? 'Busy right now' : 'Not busy right now'}</span>
          <span>
            · {live.people} of {live.capacity} seats taken
          </span>
        </div>
      )}
    </div>
  )
}
