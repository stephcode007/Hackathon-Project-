import { useState } from 'react'
import Icon from '../components/Icon'
import BusynessMeter from '../components/cards/BusynessMeter'
import Features from '../components/cards/Features'
import LevelBadge from '../components/cards/LevelBadge'
import { LEVELS } from '../lib/levels'
import { CLOSE_HOUR, addMinutes, at, demoNow, hhmm, nextSlot, relativeDay } from '../lib/time'
import { liveBusyness, myBookings, resources, statusAt, toBookingData } from '../mocks/db'

const TYPES = [
  { id: 'room', label: 'Rooms' },
  { id: 'desk', label: 'Desks' },
  { id: 'laptop', label: 'Laptops' },
]
const DEFAULT_MINUTES = { room: 120, desk: 120, laptop: 180 }
const ZONE_LABEL = { group: 'Group study', silent: 'Silent', quiet: 'Quiet' }

// The slot a "Book" tap asks for: next half hour, up to 2–3h, cut short by the next booking
function bookSlot(r, status, now) {
  const start = nextSlot(now)
  let end = addMinutes(start, DEFAULT_MINUTES[r.type])
  if (status.until < end) end = status.until
  if (end > at(now, CLOSE_HOUR)) end = at(now, CLOSE_HOUR)
  return end - start >= 30 * 60000 ? { start, end } : null
}

function StatusPill({ status }) {
  if (status.mine) return <span className="text-xs font-semibold text-accent">Yours until {hhmm(status.until)}</span>
  return status.free ? (
    <span className="text-xs font-semibold text-quiet">Free until {hhmm(status.until)}</span>
  ) : (
    <span className="text-xs font-semibold text-muted">Taken until {hhmm(status.until)}</span>
  )
}

function BookButton({ r, status, now, onAsk }) {
  const slot = status.free ? bookSlot(r, status, now) : null
  return (
    <button
      disabled={!slot}
      onClick={() => onAsk(`Book ${r.name} today from ${hhmm(slot.start)} to ${hhmm(slot.end)}`)}
      className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95 disabled:bg-stone-200 disabled:text-muted"
    >
      Book
    </button>
  )
}

function ResourceList({ items, now, onAsk }) {
  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-white px-4">
      {items.map(({ r, status }) => (
        <li key={r.id} className="flex items-center gap-3 py-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: status.free ? LEVELS.quiet.color : '#d6d3cc' }} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{r.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
              <span>Floor {r.floor}</span>
              <Features features={r.features} capacity={r.capacity} />
            </div>
            <StatusPill status={status} />
          </div>
          <BookButton r={r} status={status} now={now} onAsk={onAsk} />
        </li>
      ))}
    </ul>
  )
}

// Desk floor map: one tile per desk, grouped by floor and zone
function DeskMap({ items, now, onAsk }) {
  const [selected, setSelected] = useState(null)
  const floors = [...new Set(items.map((i) => i.r.floor))]
  const sel = items.find((i) => i.r.id === selected)

  return (
    <div className="space-y-3">
      {floors.map((floor) => {
        const desks = items.filter((i) => i.r.floor === floor)
        return (
          <div key={floor} className="rounded-2xl border border-line bg-white p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <div className="text-sm font-semibold">
                Floor {floor} <span className="font-normal text-muted">· {ZONE_LABEL[desks[0].r.zone]}</span>
              </div>
              <div className="text-xs text-muted">
                {desks.filter((d) => d.status.free).length}/{desks.length} free
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {desks.map(({ r, status }) => {
                const isSel = r.id === selected
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(isSel ? null : r.id)}
                    title={r.name}
                    className={`relative grid aspect-square place-items-center rounded-lg text-[10px] font-semibold transition active:scale-95 ${
                      status.mine
                        ? 'bg-accent text-white'
                        : status.free
                          ? 'border border-quiet/40 bg-quiet/10 text-quiet'
                          : 'bg-stone-100 text-stone-400'
                    } ${isSel ? 'ring-2 ring-ink ring-offset-1' : ''}`}
                  >
                    {r.name.split('-')[1]}
                    {r.features.includes('power') && <Icon name="plug" size={8} className="absolute top-0.5 right-0.5 opacity-60" />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex justify-center gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-quiet/40 bg-quiet/10" /> Free</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-stone-200" /> Taken</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Yours</span>
        <span className="flex items-center gap-1.5"><Icon name="plug" size={11} /> Power</span>
      </div>

      {sel && (
        <div className="animate-card-in sticky bottom-2 flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-lg">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{sel.r.name}</div>
            <div className="text-xs text-muted">
              Floor {sel.r.floor} · {ZONE_LABEL[sel.r.zone]} {sel.r.features.includes('power') && '· Power'}
            </div>
            <StatusPill status={sel.status} />
          </div>
          <BookButton r={sel.r} status={sel.status} now={now} onAsk={onAsk} />
        </div>
      )}
    </div>
  )
}

export default function SpacesPage({ onAsk }) {
  const [type, setType] = useState('room')
  const [floor, setFloor] = useState('all')
  const now = demoNow()
  const live = liveBusyness(now)
  const mine = myBookings(now).map(toBookingData)

  const withStatus = resources.map((r) => ({ r, status: statusAt(r.id, now) }))
  const ofType = withStatus.filter((i) => i.r.type === type)
  const floors = [...new Set(ofType.map((i) => i.r.floor))]
  const shown = ofType
    .filter((i) => floor === 'all' || i.r.floor === floor)
    .sort((a, b) => (type === 'desk' ? 0 : Number(b.status.free) - Number(a.status.free)))

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pt-5 pb-6">
      <div className="mb-4 flex items-end justify-between px-1">
        <div>
          <h1 className="font-display text-2xl font-semibold">Spaces</h1>
          <p className="text-sm text-muted">Live availability · {hhmm(now)}</p>
        </div>
        <button onClick={() => onAsk("When's it usually quiet today?")} className="flex items-center gap-1 text-xs font-semibold text-accent">
          Quiet times <Icon name="arrow" size={13} />
        </button>
      </div>

      <div className="mb-4 rounded-2xl border border-line bg-white p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">Library occupancy</div>
            <div className="text-sm">
              <b className="text-base">{live.people}</b> <span className="text-muted">of {live.capacity} seats</span>
            </div>
          </div>
          <LevelBadge level={live.level} />
        </div>
        <BusynessMeter percent={live.percent} level={live.level} typicalPercent={Math.round((live.typical_now / live.capacity) * 100)} />
        <div className="mt-2 text-[11px] text-muted">Usually ~{live.typical_now} at this time</div>
      </div>

      {mine.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted uppercase">Your bookings</div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {mine.map((b) => (
              <div key={b.booking_id} className="min-w-[160px] rounded-2xl bg-accent p-3 text-white">
                <div className="text-sm font-semibold">{b.resource_name}</div>
                <div className="text-xs opacity-80">
                  {relativeDay(new Date(b.starts_at))} · {hhmm(new Date(b.starts_at))}–{hhmm(new Date(b.ends_at))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3 grid grid-cols-3 rounded-full bg-stone-200/60 p-1 text-xs font-semibold">
        {TYPES.map((t) => {
          const free = withStatus.filter((i) => i.r.type === t.id && i.status.free).length
          return (
            <button
              key={t.id}
              onClick={() => {
                setType(t.id)
                setFloor('all')
              }}
              className={`rounded-full py-2 transition ${type === t.id ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
            >
              {t.label} <span className={type === t.id ? 'text-quiet' : ''}>{free}</span>
            </button>
          )
        })}
      </div>

      {floors.length > 1 && (
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
          {['all', ...floors].map((f) => (
            <button
              key={f}
              onClick={() => setFloor(f)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                floor === f ? 'border-ink bg-ink text-white' : 'border-line bg-white text-muted'
              }`}
            >
              {f === 'all' ? 'All floors' : `Floor ${f}`}
            </button>
          ))}
        </div>
      )}

      {type === 'desk' ? (
        <DeskMap items={shown} now={now} onAsk={onAsk} />
      ) : (
        <ResourceList items={shown} now={now} onAsk={onAsk} />
      )}
      {type === 'laptop' && <p className="mt-3 px-1 text-xs text-muted">Same-day loans · collect from the floor 1 help desk.</p>}
    </div>
  )
}
