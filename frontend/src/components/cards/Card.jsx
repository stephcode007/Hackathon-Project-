// One renderer for every card type in the README's "Card types" table.
// Chid can split these into BookingCard, BooksCard etc. later.
import { coverUrl } from '../../mocks/data.js'
import { bookMessage } from '../../mocks/agent.js'
import { fmtRange } from '../../lib/format.js'

const ICONS = { room: '🚪', desk: '🪑', laptop: '💻' }

export function BookingRow({ booking, onCancel }) {
  return (
    <div className="booking-row">
      <span className="booking-icon">{ICONS[booking.resource_type]}</span>
      <div className="booking-info">
        <strong>{booking.resource_name}</strong>
        <span className="muted">{fmtRange(booking.starts_at, booking.ends_at)} · Floor {booking.floor}</span>
      </div>
      {onCancel && booking.status === 'active' && (
        <button className="btn-ghost" onClick={() => onCancel(booking)}>Cancel</button>
      )}
      {booking.status === 'cancelled' && <span className="pill pill-grey">Cancelled</span>}
    </div>
  )
}

export function BookCover({ isbn, title }) {
  return (
    <img
      className="cover"
      src={coverUrl(isbn)}
      alt={`Cover of ${title}`}
      onError={e => { e.currentTarget.style.visibility = 'hidden' }}
    />
  )
}

export default function Card({ card, onSend, bookings }) {
  const { type, data } = card

  if (type === 'books') {
    return (
      <div className="card">
        {data.results.map(b => (
          <div key={b.book_id} className="book-row">
            <BookCover isbn={b.isbn} title={b.title} />
            <div>
              <strong>{b.title}</strong>
              <div className="muted">{b.author}</div>
              <div className="location">📍 Floor {b.floor} · Shelf {b.shelf}</div>
              <span className={`pill ${b.copies_available ? 'pill-green' : 'pill-red'}`}>
                {b.copies_available ? `${b.copies_available} available` : 'All copies out'}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'availability') {
    return (
      <div className="card">
        {data.options.map(o => (
          <div key={o.resource_id} className="option-row">
            <span className="booking-icon">{ICONS[data.resource_type]}</span>
            <div className="booking-info">
              <strong>{o.name}</strong>
              <span className="muted">
                Floor {o.floor}{o.capacity ? ` · Seats ${o.capacity}` : ''}{o.features?.length ? ` · ${o.features.join(', ')}` : ''}
              </span>
            </div>
            <button className="btn" onClick={() => onSend(bookMessage(o, data.resource_type, data.starts_at, data.ends_at))}>Book</button>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'booking') {
    // read the live status so the card shows "Cancelled" after a cancel
    const live = bookings.find(b => b.booking_id === data.booking_id) ?? data
    return (
      <div className="card card-confirm">
        <div className="card-title">✅ Booked · {data.booking_id}</div>
        <BookingRow booking={live} onCancel={b => onSend(`Cancel booking ${b.booking_id}`)} />
      </div>
    )
  }

  if (type === 'my_bookings') {
    return (
      <div className="card">
        {data.bookings.map(b => {
          const live = bookings.find(x => x.booking_id === b.booking_id) ?? b
          return <BookingRow key={b.booking_id} booking={live} onCancel={x => onSend(`Cancel booking ${x.booking_id}`)} />
        })}
      </div>
    )
  }

  if (type === 'cancelled') {
    return <div className="card card-muted">❌ {data.resource_name} cancelled</div>
  }

  return null
}
