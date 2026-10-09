import { useEffect, useState } from 'react'
import Icon from './components/Icon'
import BottomNav from './components/nav/BottomNav'
import Sidebar from './components/nav/Sidebar'
import TopBar from './components/nav/TopBar'
import ProfilePage from './pages/ProfilePage'
import { sendMessage } from './lib/api'
import ChatPage from './pages/ChatPage'
import BookingsPage from './pages/BookingsPage'
import { onLaptopApproved } from './mocks/db'

function App() {
  const [tab, setTab] = useState('chat')
  // Chat history lives here so it survives switching tabs
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)

  // When the help desk approves a laptop request: say so in the chat, and pop up
  // a short notice wherever the student is
  useEffect(
    () =>
      onLaptopApproved((b) => {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: `Request approved! ${b.resource_name} is ready for you. Collect it from the ${b.pickup.toLowerCase()}.`,
            cards: [{ type: 'booking', data: b }],
          },
        ])
        setToast(`Request approved: ${b.resource_name}`)
        setTimeout(() => setToast(null), 6000)
      }),
    [],
  )

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
    // Website (lg and up): sidebar | page.
    <div className="relative mx-auto flex h-[100dvh] max-w-[440px] flex-col overflow-hidden bg-paper sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-[32px] sm:border sm:border-line sm:shadow-2xl lg:my-0 lg:h-[100dvh] lg:max-w-none lg:flex-row lg:rounded-none lg:border-0 lg:shadow-none">
      {toast && (
        <div role="status" className="animate-card-in absolute top-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-lg lg:top-5">
          <Icon name="check" size={16} strokeWidth={2.4} className="text-quiet" /> {toast}
        </div>
      )}
      <Sidebar tab={tab} onChange={setTab} />
      <TopBar onProfile={() => setTab('profile')} profileActive={tab === 'profile'} />
      <main className="min-h-0 min-w-0 flex-1">
        {tab === 'chat' && <ChatPage messages={messages} sending={sending} onSend={send} />}
        {tab !== 'chat' && (
          <div className="mx-auto h-full max-w-xl">
            {tab === 'bookings' && <BookingsPage />}
            {tab === 'profile' && <ProfilePage onBack={() => setTab('chat')} />}
          </div>
        )}
      </main>
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}

export default App
