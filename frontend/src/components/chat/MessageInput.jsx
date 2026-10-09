import { useState } from 'react'

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('')

  const submit = e => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }

  return (
    <form className="input-bar" onSubmit={submit}>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Ask Bookmark anything…"
        aria-label="Message"
        autoFocus
      />
      <button className="btn" type="submit" disabled={disabled || !text.trim()}>Send</button>
    </form>
  )
}
