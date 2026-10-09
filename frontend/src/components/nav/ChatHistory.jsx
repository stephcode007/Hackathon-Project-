import Icon from '../Icon'

const ago = (t) => {
  const mins = Math.round((Date.now() - t) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  return hours < 24 ? `${hours} h ago` : new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Past chats, newest first, plus a "New chat" button.
// Used in the phone's ☰ drawer and in the website sidebar.
export default function ChatHistory({ chats, currentId, onSelect, onNew }) {
  const list = [...chats].sort((a, b) => b.updated - a.updated)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <button
        onClick={onNew}
        className="mb-3 flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent active:scale-[0.99]"
      >
        <Icon name="plus" size={16} /> New chat
      </button>
      <div className="mb-1.5 px-3 text-[11px] font-semibold tracking-wide text-muted uppercase">Chat history</div>
      {list.length === 0 ? (
        <p className="px-3 text-xs text-muted">Your chats will show up here.</p>
      ) : (
        <ul className="no-scrollbar -mx-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1">
          {list.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                aria-current={c.id === currentId ? 'true' : undefined}
                className={`w-full rounded-xl px-3 py-2 text-left transition ${c.id === currentId ? 'bg-accent-soft text-accent' : 'hover:bg-white'}`}
              >
                <span className="block truncate text-sm font-medium">{c.title}</span>
                <span className="block text-[11px] text-muted">{ago(c.updated)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
