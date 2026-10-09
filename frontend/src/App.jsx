import { useState } from 'react'
import BottomNav from './components/nav/BottomNav'
import { sendMessage } from './lib/api'
import ChatPage from './pages/ChatPage'
import PassPage from './pages/PassPage'
import SpacesPage from './pages/SpacesPage'

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

  // Buttons on the Spaces tab hand off to the assistant
  function ask(text) {
    setTab('chat')
    send(text)
  }

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[440px] flex-col overflow-hidden bg-paper sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-[32px] sm:border sm:border-line sm:shadow-2xl">
      <main className="min-h-0 flex-1">
        {tab === 'chat' && <ChatPage messages={messages} sending={sending} onSend={send} />}
        {tab === 'pass' && <PassPage />}
        {tab === 'spaces' && <SpacesPage onAsk={ask} />}
      </main>
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}

export default App
