import { useState } from 'react'
import BottomNav from './components/nav/BottomNav'
import Sidebar from './components/nav/Sidebar'
import TopBar from './components/nav/TopBar'
import ProfilePage from './pages/ProfilePage'
import { sendMessage } from './lib/api'
import ChatPage from './pages/ChatPage'
import PassPage from './pages/PassPage'
import BookingsPage from './pages/BookingsPage'

function App() {
  const [tab, setTab] = useState('chat')
  // Chat history lives here so it survives switching tabs
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)

  async function send(text) {
    const history = [...messages, { role: 'user', content: text }]
    setMessages(history)
    setSending(true)
    try {
      // only plain text goes to the backend, as in the API contract
      const { reply, cards } = await sendMessage(history.map(({ role, content }) => ({ role, content })))
      setMessages((m) => [...m, { role: 'assistant', content: reply, cards }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Something went wrong. Try again?', cards: [] }])
    } finally {
      setSending(false)
    }
  }

  return (
    // Phone: a single column with tabs at the bottom.
    // Website (lg and up): sidebar | page | bookings panel next to the chat.
    <div className="mx-auto flex h-[100dvh] max-w-[440px] flex-col overflow-hidden bg-paper sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-[32px] sm:border sm:border-line sm:shadow-2xl lg:my-0 lg:h-[100dvh] lg:max-w-none lg:flex-row lg:rounded-none lg:border-0 lg:shadow-none">
      <Sidebar tab={tab} onChange={setTab} />
      <TopBar onProfile={() => setTab('profile')} profileActive={tab === 'profile'} />
      <main className="min-h-0 min-w-0 flex-1">
        {tab === 'chat' && <ChatPage messages={messages} sending={sending} onSend={send} />}
        {tab !== 'chat' && (
          <div className="mx-auto h-full max-w-xl">
            {tab === 'pass' && <PassPage />}
            {tab === 'bookings' && <BookingsPage />}
            {tab === 'profile' && <ProfilePage onBack={() => setTab('chat')} />}
          </div>
        )}
      </main>
      {tab === 'chat' && (
        <aside className="hidden w-[380px] shrink-0 border-l border-line bg-[#efece5] lg:block">
          <BookingsPage />
        </aside>
      )}
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}

export default App
