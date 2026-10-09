import { useState } from 'react'
import Features from '../../components/cards/Features'
import { demoNow, hhmm } from '../../lib/time'
import { createBooking, resources, statusAt } from '../../mocks/db'
import { ConfirmBar, List, PageHeader } from './shared'
import { quickSlot } from './slot'

// Every room and study pod: free or booked right now, and book one in two taps
export default function StudySpaces({ onBack, onBooked }) {
  const [asking, setAsking] = useState(null)
  const now = demoNow()
  const rooms = resources
    .filter((r) => r.type === 'room')
    .map((r) => ({ r, status: statusAt(r.id, now) }))
    .sort((a, b) => Number(b.status.free) - Number(a.status.free))
  const free = rooms.filter((x) => x.status.free).length

  return (
    <>
      <PageHeader title="Study spaces" onBack={onBack} />
      <p className="-mt-2 mb-3 px-1 text-sm text-muted">
        {free} of {rooms.length} free right now
      </p>
      <List>
        {rooms.map(({ r, status }) => {
          const slot = status.free ? quickSlot(now, 120, status.until) : null
          return (
            <li key={r.id} className="py-3">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.free ? 'bg-quiet' : 'bg-stone-300'}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{r.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                    <span>Floor {r.floor}</span>
                    <Features features={r.features} capacity={r.capacity} />
                  </div>
                  <div className={`text-xs font-semibold ${status.mine ? 'text-accent' : status.free ? 'text-quiet' : 'text-muted'}`}>
                    {status.mine ? `Yours until ${hhmm(status.until)}` : status.free ? `Free until ${hhmm(status.until)}` : `Booked until ${hhmm(status.until)}`}
                  </div>
                </div>
                {slot && asking !== r.id && (
                  <button
                    onClick={() => setAsking(r.id)}
                    className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95"
                  >
                    Book
                  </button>
                )}
              </div>
              {slot && asking === r.id && (
                <ConfirmBar
                  text={`Book ${r.name} today ${hhmm(slot.start)}–${hhmm(slot.end)}?`}
                  onCancel={() => setAsking(null)}
                  onConfirm={() => {
                    const b = createBooking(r.id, slot.start, slot.end)
                    setAsking(null)
                    onBooked(b.id)
                  }}
                />
              )}
            </li>
          )
        })}
      </List>
    </>
  )
}
