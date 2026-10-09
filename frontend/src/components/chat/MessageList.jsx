import { useEffect, useRef } from 'react'
import Card from '../cards/Card.jsx'

export default function MessageList({ messages, loading, onSend, bookings }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="messages">
      {messages.map((m, i) => (
        <div key={i} className={`msg msg-${m.role}`}>
          <div className="bubble">{m.content}</div>
          {m.cards?.map((card, j) => (
            <Card key={j} card={card} onSend={onSend} bookings={bookings} />
          ))}
        </div>
      ))}
      {loading && (
        <div className="msg msg-assistant">
          <div className="bubble typing"><span /><span /><span /></div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}
