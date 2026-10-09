import { useState } from 'react'
import { sendMessage } from '../../lib/api.js'
import { student } from '../../mocks/data.js'
import MessageList from './MessageList.jsx'
import MessageInput from './MessageInput.jsx'
import SuggestionChips from './SuggestionChips.jsx'

const GREETING = {
  role: 'assistant',
  content: `Hi ${student.name}! I'm Bookmark. I can find books, book study rooms and desks, and lend you a laptop. What do you need?`,
}

export default function ChatWindow({ messages, setMessages, bookings, setBookings }) {
  const [loading, setLoading] = useState(false)
  const shown = messages.length ? messages : [GREETING]

  const send = async text => {
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setLoading(true)
    try {
      // only plain-text history goes to the agent (README: API contract)
      const history = next.map(({ role, content }) => ({ role, content }))
      const res = await sendMessage(history, bookings)
      setBookings(res.bookings)
      setMessages([...next, { role: 'assistant', content: res.reply, cards: res.cards }])
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat">
      <MessageList messages={shown} loading={loading} onSend={send} bookings={bookings} />
      {messages.length === 0 && <SuggestionChips onSend={send} />}
      <MessageInput onSend={send} disabled={loading} />
    </div>
  )
}
