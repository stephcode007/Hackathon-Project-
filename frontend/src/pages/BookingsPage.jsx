import { useState } from 'react'
import Icon from '../components/Icon'
import { demoNow } from '../lib/time'
import { books, cancelBookHold, cancelBooking, liveBusyness, myBookHolds, myBookings, resources, statusAt, toBookingData } from '../mocks/db'
import BookingDetail from './bookings/BookingDetail'
import BookPreview from './bookings/BookPreview'
import Books from './bookings/Books'
import Laptops from './bookings/Laptops'
import MyBookings from './bookings/MyBookings'
import { List } from './bookings/shared'
import StudySpaces from './bookings/StudySpaces'

function MenuRow({ icon, title, detail, onClick }) {
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center gap-3 py-3.5 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Icon name={icon} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="block text-xs text-muted">{detail}</span>
        </span>
        <Icon name="chevron" size={18} className="shrink-0 text-muted" />
      </button>
    </li>
  )
}

// The Bookings section: a home screen with My bookings, Study spaces and Laptops,
// and the pages behind them. `view` is which page is showing.
export default function BookingsPage() {
  const [view, setView] = useState({ page: 'home' })
  const go = (page, id) => setView({ page, id })
  const now = demoNow()

  const page = (() => {
    switch (view.page) {
      case 'mine':
        return (
          <MyBookings
            onBack={() => go('home')}
            onOpenBooking={(id) => go('booking', id)}
            onOpenBook={(id) => go('book', id)}
            onExplore={(p) => go(p)}
          />
        )
      case 'booking': {
        const b = myBookings(now).map(toBookingData).find((x) => x.booking_id === view.id)
        if (!b) return null
        return (
          <BookingDetail
            booking={b}
            onBack={() => go('mine')}
            onCancel={() => {
              cancelBooking(b.booking_id)
              go('mine')
            }}
          />
        )
      }
      case 'book': {
        const h = myBookHolds().find((x) => x.hold_id === view.id)
        if (!h) return null
        return (
          <BookPreview
            hold={h}
            onBack={() => go('mine')}
            onCancel={() => {
              cancelBookHold(h.hold_id)
              go('mine')
            }}
          />
        )
      }
      // After booking from a list, show the new booking straight away
      case 'spaces':
        return <StudySpaces onBack={() => go('home')} onBooked={(id) => go('booking', id)} />
      case 'laptops':
        return <Laptops onBack={() => go('home')} onBooked={(id) => go('booking', id)} />
      case 'books':
        return <Books onBack={() => go('home')} onReserved={(id) => go('book', id)} />
      default:
        return null
    }
  })()

  if (page) {
    return <div className="no-scrollbar h-full overflow-y-auto px-4 pt-2 pb-6">{page}</div>
  }

  const live = liveBusyness(now)
  const busy = live.level === 'busy' || live.level === 'very_busy'
  const count = myBookings(now).length + myBookHolds().length
  const freeOf = (type) => resources.filter((r) => r.type === type && statusAt(r.id, now).free).length
  const booksIn = books.filter((b) => b.copies_available > 0).length

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto px-4 pt-2 pb-6">
      <h1 className="mb-4 px-1 font-display text-2xl font-semibold">Bookings</h1>

      <List>
        <MenuRow icon="calendar" title="My bookings" detail={count ? `${count} active` : 'Nothing booked yet'} onClick={() => go('mine')} />
        <MenuRow icon="users" title="Study spaces" detail={`${freeOf('room')} free right now`} onClick={() => go('spaces')} />
        <MenuRow icon="book" title="Books" detail={`Search ${books.length} books · ${booksIn} on the shelf`} onClick={() => go('books')} />
        <MenuRow icon="laptop" title="Laptops" detail={`${freeOf('laptop')} available to request`} onClick={() => go('laptops')} />
      </List>

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
