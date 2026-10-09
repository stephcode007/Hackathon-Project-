import { useState } from 'react'
import Icon from '../Icon'

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-t border-line bg-paper px-3 py-2.5">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask Stacks anything…"
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
