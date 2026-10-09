import { Availability, Cover } from '../../components/cards/BooksCard'
import Icon from '../../components/Icon'
import { shortDate } from '../../lib/time'
import { PageHeader } from './shared'

// A reserved book: what it is, where it lives, how to get it, with Cancel at the bottom
export default function BookPreview({ hold, onBack, onCancel }) {
  const { book: b } = hold
  const ready = hold.status === 'ready'

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="Book" onBack={onBack} />

      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="flex gap-4">
          <Cover isbn={b.isbn} title={b.title} className="h-[132px] w-[88px]" />
          <div className="min-w-0">
            <h2 className="font-display text-xl leading-tight font-semibold">{b.title}</h2>
            <div className="mt-1 text-sm text-muted">{b.author}</div>
            <div className="mt-1 text-xs text-muted">ISBN {b.isbn}</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-paper p-3">
          <div className="text-xs font-semibold tracking-wide text-muted uppercase">Where it is</div>
          <Availability book={b} />
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-xl bg-accent-soft p-3 text-accent">
          <Icon name={ready ? 'check' : 'clock'} size={18} className="mt-0.5 shrink-0" />
          <div className="text-sm">
            <div className="font-semibold">{ready ? 'Ready to collect' : "You're on the waiting list"}</div>
            <div className="text-xs">
              {ready
                ? `A copy is waiting on the ${hold.collect_from.toLowerCase()}. Collect it by ${shortDate(new Date(hold.collect_by))}.`
                : `A copy is due back ${shortDate(new Date(hold.available_from))}. It'll be held for you on the ${hold.collect_from.toLowerCase()}.`}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-xl bg-paper p-3">
          <Icon name="calendar" size={18} className="mt-0.5 shrink-0 text-muted" />
          <div className="text-sm">
            <div className="font-semibold">Due back {shortDate(new Date(hold.due))}</div>
            <div className="text-xs text-muted">3-week loan. When you're done, hand it back at the {hold.return_to.toLowerCase()}.</div>
          </div>
        </div>
      </div>

      <button
        onClick={() => onCancel(hold)}
        className="mt-auto w-full rounded-2xl border border-very-busy/30 bg-white py-3 text-sm font-semibold text-very-busy transition hover:bg-very-busy/5 active:scale-[0.99]"
      >
        Cancel reservation
      </button>
    </div>
  )
}
