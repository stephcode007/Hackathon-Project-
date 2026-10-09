import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'

// The browser's built-in speech recognition (Chrome, Edge, Safari). No API key needed.
const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const recognition = useRef(null)

  useEffect(() => () => recognition.current?.abort(), [])

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }

  // Tap the mic and talk: the words appear in the box as you speak,
  // and the message sends by itself when you stop
  function toggleMic() {
    if (listening) {
      recognition.current?.stop()
      return
    }
    const r = new SpeechRecognition()
    r.lang = 'en-GB'
    r.interimResults = true
    let said = ''
    r.onresult = (e) => {
      said = Array.from(e.results, (res) => res[0].transcript).join('')
      setText(said)
    }
    r.onend = () => {
      setListening(false)
      if (said.trim() && !disabled) {
        onSend(said.trim())
        setText('')
      }
    }
    r.onerror = () => setListening(false)
    recognition.current = r
    setText('')
    setListening(true)
    r.start()
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-t border-line bg-paper px-3 py-2.5">
      {SpeechRecognition && (
        <button
          type="button"
          onClick={toggleMic}
          disabled={disabled}
          aria-label={listening ? 'Stop listening' : 'Speak your message'}
          aria-pressed={listening}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition active:scale-95 disabled:opacity-40 ${
            listening ? 'animate-pulse bg-very-busy text-white' : 'bg-accent-soft text-accent hover:bg-accent hover:text-white'
          }`}
        >
          <Icon name="mic" size={18} />
        </button>
      )}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={listening ? 'Listening…' : 'Ask Marked anything…'}
        className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        aria-label="Send"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-white transition active:scale-95 disabled:opacity-40"
      >
        <Icon name="send" size={18} />
      </button>
    </form>
  )
}
