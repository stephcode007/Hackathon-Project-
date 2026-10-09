import Icon from '../../components/Icon'

// Title row for every page inside Bookings, with a way back
export function PageHeader({ title, onBack, backLabel = 'Bookings' }) {
  return (
    <div className="mb-4">
      {onBack && (
        <button onClick={onBack} className="mb-2 flex items-center gap-1.5 px-1 text-sm font-semibold text-muted hover:text-ink">
          <Icon name="back" size={17} /> {backLabel}
        </button>
      )}
      <h1 className="px-1 font-display text-2xl font-semibold">{title}</h1>
    </div>
  )
}

export function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted uppercase">{title}</h2>
      {children}
    </section>
  )
}

export const List = ({ children }) => <ul className="divide-y divide-line rounded-2xl border border-line bg-white px-4">{children}</ul>

// "Book" → "Book X today 17:00–19:00?" [Confirm] [Not now]
export function ConfirmBar({ text, onConfirm, onCancel }) {
  return (
    <div className="animate-card-in mt-2 flex items-center gap-2 rounded-xl bg-accent-soft p-2.5 pl-3">
      <div className="min-w-0 flex-1 text-xs font-semibold text-accent">{text}</div>
      <button onClick={onCancel} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink">
        Not now
      </button>
      <button onClick={onConfirm} className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white active:scale-95">
        Confirm
      </button>
    </div>
  )
}
