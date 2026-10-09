import Blueberry from '../components/brand/Blueberry'
import MessageInput from '../components/chat/MessageInput'
import MessageList from '../components/chat/MessageList'
import { STUDENT } from '../mocks/db'

export default function ChatPage({ messages, sending, onSend }) {
  return (
    <div className="flex h-full flex-col">
      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto h-full w-full max-w-3xl">
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center">
              <h1 className="flex items-center gap-3 font-display text-[28px] leading-tight font-semibold lg:text-4xl">
                <Blueberry size="1.1em" />
                Hi {STUDENT.name}
              </h1>
              <p className="mt-2 text-sm text-muted lg:text-base">What can I help you with today?</p>
            </div>
          ) : (
            <MessageList messages={messages} sending={sending} onAction={onSend} />
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <MessageInput onSend={onSend} disabled={sending} />
      </div>
    </div>
  )
}
