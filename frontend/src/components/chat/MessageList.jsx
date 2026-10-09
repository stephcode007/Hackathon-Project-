import { useEffect, useRef } from 'react'
import { visibleCards } from '../../lib/cards'
import ChatCard from '../cards/ChatCard'

function Typing() {
  return (
    <div className="flex w-fit gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}

export default function MessageList({ messages, sending, onAction }) {
  const end = useRef(null)
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, sending])

  return (
    <div className="space-y-4 px-4 py-4">
      {messages.map((m, i) =>
        m.role === 'user' ? (
          <div key={i} className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-white">
            {m.content}
          </div>
        ) : (
          <div key={i} className="space-y-2.5">
            {m.content && (
              <div className="w-fit max-w-[88%] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm shadow-sm">{m.content}</div>
            )}
            {visibleCards(m.cards).map((c, j) => (
              <ChatCard key={j} card={c} onAction={onAction} />
            ))}
          </div>
        ),
      )}
      {sending && <Typing />}
      <div ref={end} />
    </div>
  )
}
