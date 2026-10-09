import { useState } from 'react'
import Features from '../../components/cards/Features'
import { demoNow, hhmm } from '../../lib/time'
import { createBooking, myBookings, resources, statusAt } from '../../mocks/db'
import { ConfirmBar, List, PageHeader, Section } from './shared'
import { quickSlot } from './slot'

// Laptops grouped by where you collect them. Request one, and the help desk approves it.
export default function Laptops({ onBack, onBooked }) {
  const [asking, setAsking] = useState(null)
  const now = demoNow()
  const mine = myBookings(now)
  const laptops = resources
    .filter((r) => r.type === 'laptop')
    .map((r) => ({ r, status: statusAt(r.id, now), my: mine.find((b) => b.resource_id === r.id) }))
  const free = laptops.filter((x) => x.status.free && !x.my).length
  const places = [...new Set(laptops.map((x) => x.r.pickup))]

  const statusText = ({ status, my }) => {
    if (my) return my.approval === 'requested' ? 'Requested · waiting for approval' : `Approved · yours from ${hhmm(my.starts_at)}`
    return status.free ? 'Available' : `On loan until ${hhmm(status.until)}`
  }

  return (
    <>
      <PageHeader title="Laptops" onBack={onBack} />
      <p className="-mt-2 mb-3 px-1 text-sm text-muted">
        {free} of {laptops.length} available · same-day loans, up to 4 hours
      </p>
      {places.map((place) => {
        const here = laptops.filter((x) => x.r.pickup === place)
        return (
          <Section key={place} title={`${place} · ${here.filter((x) => x.status.free && !x.my).length} available`}>
            <List>
              {here.map((x) => {
                const { r, status, my } = x
                const slot = status.free && !my ? quickSlot(now, 180, status.until) : null
                return (
                  <li key={r.id} className="py-3">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${my ? 'bg-accent' : status.free ? 'bg-quiet' : 'bg-stone-300'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{r.name}</div>
                        <div className="mt-0.5 text-xs text-muted">
                          <Features features={r.features} />
                        </div>
                        <div className={`text-xs font-semibold ${my ? 'text-accent' : status.free ? 'text-quiet' : 'text-muted'}`}>{statusText(x)}</div>
                      </div>
                      {slot && asking !== r.id && (
                        <button
                          onClick={() => setAsking(r.id)}
                          className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95"
                        >
                          Request
                        </button>
                      )}
                    </div>
                    {slot && asking === r.id && (
                      <ConfirmBar
                        text={`Request ${r.name} for today ${hhmm(slot.start)}–${hhmm(slot.end)}?`}
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
          </Section>
        )
      })}
    </>
  )
}
