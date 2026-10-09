import { student, loans } from '../mocks/data.js'
import { BookingRow, BookCover } from '../components/cards/Card.jsx'

const fmtDue = iso => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

export default function Profile({ bookings, onCancel }) {
  const upcoming = bookings.filter(b => b.status === 'active')

  return (
    <div className="profile">
      <section className="card profile-head">
        <div className="avatar">{student.name[0]}</div>
        <div>
          <h2>{student.name}</h2>
          <div className="muted">{student.course} · Year {student.year}</div>
          <div className="muted">Student ID {student.id}</div>
        </div>
      </section>

      <h3>My bookings</h3>
      <section className="card">
        {upcoming.length
          ? upcoming.map(b => <BookingRow key={b.booking_id} booking={b} onCancel={onCancel} />)
          : <p className="muted empty">No bookings yet. Ask Bookmark to book a room, desk or laptop.</p>}
      </section>

      <h3>Borrowed books</h3>
      <section className="card">
        {loans.map(l => (
          <div key={l.book_id} className="book-row">
            <BookCover isbn={l.isbn} title={l.title} />
            <div>
              <strong>{l.title}</strong>
              <div className="muted">{l.author}</div>
              <span className="pill pill-grey">Due {fmtDue(l.due)}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
