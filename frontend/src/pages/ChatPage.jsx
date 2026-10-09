import Icon from '../components/Icon'
import MessageInput from '../components/chat/MessageInput'
import MessageList from '../components/chat/MessageList'
import SuggestionChips from '../components/chat/SuggestionChips'
import { STUDENT } from '../mocks/db'

export default function ChatPage({ messages, sending, onSend }) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-2.5 border-b border-line px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-white">
          <Icon name="book" size={18} />
        </div>
        <div>
          <div className="font-display text-lg leading-none font-semibold">Stacks</div>
          <div className="mt-0.5 text-[11px] text-muted">Your library, by chat</div>
        </div>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
              <Icon name="sparkle" size={26} />
            </div>
            <h1 className="font-display text-2xl font-semibold">Hi {STUDENT.name} 👋</h1>
            <p className="mt-1 mb-6 max-w-[260px] text-sm text-muted">
              Book rooms, find books, borrow laptops, or check how busy it is. Just ask.
            </p>
            <SuggestionChips onPick={onSend} />
          </div>
        ) : (
          <MessageList messages={messages} sending={sending} onAction={onSend} />
        )}
      </div>

      <MessageInput onSend={onSend} disabled={sending} />
    </div>
  )
}
