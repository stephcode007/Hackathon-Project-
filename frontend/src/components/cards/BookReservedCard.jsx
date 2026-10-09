import { shortDate } from '../../lib/time'
import Icon from '../Icon'
import { Cover } from './BooksCard'
import Card from './Card'

// Confirmation after reserving a book: ready to collect, or on the waiting list
export default function BookReservedCard({ data }) {
  const ready = data.status === 'ready'
  return (
    <Card>
      <div className="flex gap-3">
        <Cover isbn={data.book.isbn} title={data.book.title} />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold tracking-wide text-muted uppercase">
            {ready ? 'Book reserved' : 'On the waiting list'}
          </div>
          <div className="font-display text-lg leading-tight font-semibold">{data.book.title}</div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <Icon name="pin" size={13} />
            {ready
              ? `Collect from the ${data.collect_from.toLowerCase()} by ${shortDate(new Date(data.collect_by))}`
              : `Due back ${shortDate(new Date(data.available_from))}, then held for you`}
          </div>
        </div>
      </div>
    </Card>
  )
}
