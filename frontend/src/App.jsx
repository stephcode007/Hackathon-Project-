import { useState } from 'react'
import ChatWindow from './components/chat/ChatWindow.jsx'
import Profile from './pages/Profile.jsx'

function App() {
  const [page, setPage] = useState('chat')
  // Lives here so bookings made in chat show on Profile, and the chat
  // history survives switching tabs.
  const [bookings, setBookings] = useState([])
  const [messages, setMessages] = useState([])

  const cancel = booking =>
    setBookings(bs => bs.map(b => (b.booking_id === booking.booking_id ? { ...b, status: 'cancelled' } : b)))

  return (
    <div className="app">
      <header className="header">
        <div className="logo">🔖 Bookmark</div>
        <nav className="tabs">
          <button className={page === 'chat' ? 'tab active' : 'tab'} onClick={() => setPage('chat')}>Chat</button>
          <button className={page === 'profile' ? 'tab active' : 'tab'} onClick={() => setPage('profile')}>Profile</button>
        </nav>
      </header>
      <main className="main">
        {page === 'chat'
          ? <ChatWindow messages={messages} setMessages={setMessages} bookings={bookings} setBookings={setBookings} />
          : <Profile bookings={bookings} onCancel={cancel} />}
      </main>
    </div>
  )
}

export default App
