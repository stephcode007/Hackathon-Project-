import { useEffect, useRef, useState } from 'react'
import { Wordmark } from './components/brand/Logo'
import Icon from './components/Icon'
import BottomNav from './components/nav/BottomNav'
import ChatHistory from './components/nav/ChatHistory'
import Sidebar from './components/nav/Sidebar'
import TopBar from './components/nav/TopBar'
import ProfilePage from './pages/ProfilePage'
import { sendMessage } from './lib/api'
import ChatPage from './pages/ChatPage'
import BookingsPage from './pages/BookingsPage'
import { onLaptopApproved } from './mocks/db'

let chatSeq = 0
const newChatId = () => `chat-${Date.now()}-${chatSeq++}`

function App() {
  const [tab, setTab] = useState('chat')
  // Every chat this session: { id, title, messages, updated }. Like the bookings,
  // it all resets on reload (it's mock data).
  const [chats, setChats] = useState([])
  const [currentId, setCurrentId] = useState(null) // null = a fresh, empty chat
  // the approval listener below is set up once, so it reads the open chat from a ref
  const currentRef = useRef(null)
  useEffect(() => {
    currentRef.current = currentId
  }, [currentId])
  const [menuOpen, setMenuOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)

  const messages = chats.find((c) => c.id === currentId)?.messages ?? []
  const addTo = (id, msg) =>
    setChats((cs) => cs.map((c) => (c.id === id ? { ...c, messages: [...c.messages, msg], updated: Date.now() } : c)))

  // When the help desk approves a laptop request: say so in the chat that's open
  // (or the latest one), and pop up a short notice wherever the student is
  useEffect(
    () =>
      onLaptopApproved((b) => {
        const msg = {
          role: 'assistant',
          content: `Request approved! ${b.resource_name} is ready for you. Collect it from the ${b.pickup.toLowerCase()}.`,
          cards: [{ type: 'booking', data: b }],
        }
        setChats((cs) => {
          if (!cs.length) return cs
          const id = currentRef.current ?? [...cs].sort((a, b2) => b2.updated - a.updated)[0].id
          return cs.map((c) => (c.id === id ? { ...c, messages: [...c.messages, msg], updated: Date.now() } : c))
        })
        setToast(`Request approved: ${b.resource_name}`)
        setTimeout(() => setToast(null), 6000)
      }),
    [],
  )

  async function send(text) {
    const history = [...messages, { role: 'user', content: text }]
    let id = currentId
    if (!id) {
      // first message starts a new chat, named after what was asked
      id = newChatId()
      setChats((cs) => [...cs, { id, title: text.length > 42 ? `${text.slice(0, 40)}…` : text, messages: history, updated: Date.now() }])
      setCurrentId(id)
    } else {
      setChats((cs) => cs.map((c) => (c.id === id ? { ...c, messages: history, updated: Date.now() } : c)))
    }
    setSending(true)
    try {
      // only plain text goes to the backend, as in the API contract
      const { reply, cards } = await sendMessage(history.map(({ role, content }) => ({ role, content })))
      addTo(id, { role: 'assistant', content: reply, cards })
    } catch {
      addTo(id, { role: 'assistant', content: 'Something went wrong. Try again?', cards: [] })
    } finally {
      setSending(false)
    }
  }

  const history = {
    chats,
    currentId,
    onSelect: (id) => {
      setCurrentId(id)
      setTab('chat')
      setMenuOpen(false)
    },
    onNew: () => {
      setCurrentId(null)
      setTab('chat')
      setMenuOpen(false)
    },
  }

  return (
    // Phone: a single column with tabs at the bottom, chat history behind ☰.
    // Website (lg and up): sidebar (with chat history) | page.
    <div className="relative mx-auto flex h-[100dvh] max-w-[440px] flex-col overflow-hidden bg-paper sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-[32px] sm:border sm:border-line sm:shadow-2xl lg:my-0 lg:h-[100dvh] lg:max-w-none lg:flex-row lg:rounded-none lg:border-0 lg:shadow-none">
      {toast && (
        <div role="status" className="animate-card-in absolute top-16 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-lg lg:top-5">
          <Icon name="check" size={16} strokeWidth={2.4} className="text-quiet" /> {toast}
        </div>
      )}

      {menuOpen && (
        <div className="absolute inset-0 z-30 flex lg:hidden">
          <div className="animate-drawer-in flex w-[280px] flex-col bg-paper px-3 pt-3 pb-5 shadow-2xl">
            <div className="mb-4 flex items-center gap-1.5">
              <button onClick={() => setMenuOpen(false)} aria-label="Close chat history" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white">
                <Icon name="x" size={20} />
              </button>
              <Wordmark className="text-xl" />
            </div>
            <ChatHistory {...history} />
          </div>
          <button aria-label="Close chat history" onClick={() => setMenuOpen(false)} className="flex-1 bg-ink/30" />
        </div>
      )}

      <Sidebar tab={tab} onChange={setTab} history={history} />
      <TopBar onMenu={() => setMenuOpen(true)} onProfile={() => setTab('profile')} profileActive={tab === 'profile'} />
      <main className="min-h-0 min-w-0 flex-1">
        {tab === 'chat' && <ChatPage messages={messages} sending={sending} onSend={send} />}
        {tab !== 'chat' && (
          <div className="mx-auto h-full max-w-xl">
            {tab === 'bookings' && <BookingsPage onGoChat={() => setTab('chat')} />}
            {tab === 'profile' && <ProfilePage onBack={() => setTab('chat')} />}
          </div>
        )}
      </main>
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}

export default App
