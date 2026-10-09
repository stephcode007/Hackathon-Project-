import { useState } from 'react'
import Icon from '../components/Icon'
import LevelBadge from '../components/cards/LevelBadge'
import QrPass from '../components/pass/QrPass'
import { STUDENT, liveBusyness } from '../mocks/db'
import { demoNow } from '../lib/time'

export default function PassPage() {
  const [mode, setMode] = useState('qr')
  const live = liveBusyness(demoNow())
  const initials = STUDENT.fullName.split(' ').map((w) => w[0]).join('')

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-5 pt-5 pb-8">
      <h1 className="font-display text-2xl font-semibold">Library pass</h1>
      <p className="mb-5 text-sm text-muted">Scan in and out at the gate.</p>

      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_-12px_rgba(29,42,38,0.35)]">
        <div className="relative bg-accent px-5 pt-5 pb-6 text-white">
          <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute top-8 -right-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between text-[11px] font-semibold tracking-[0.15em] uppercase opacity-80">
            <span>Bookmarked Library</span>
            <span>Student</span>
          </div>
          <div className="relative mt-4 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 font-display text-xl font-semibold">{initials}</div>
            <div>
              <div className="font-display text-xl leading-tight font-semibold">{STUDENT.fullName}</div>
              <div className="text-xs opacity-80">
                {STUDENT.course} · Year {STUDENT.year}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center px-5 pt-5 pb-6">
          <div className="mb-5 flex rounded-full bg-paper p-1 text-xs font-semibold">
            {['qr', 'barcode'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-4 py-1.5 transition ${mode === m ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
              >
                {m === 'qr' ? 'QR code' : 'Barcode'}
              </button>
            ))}
          </div>

          <div className="grid h-[220px] place-items-center">
            <QrPass value={STUDENT.qr} size={200} mode={mode} />
          </div>

          <div className="mt-4 grid w-full grid-cols-2 gap-3 border-t border-dashed border-line pt-4 text-xs">
            <div>
              <div className="text-muted">Student no.</div>
              <div className="font-mono font-semibold tracking-wide">{STUDENT.number}</div>
            </div>
            <div className="text-right">
              <div className="text-muted">Valid until</div>
              <div className="font-semibold">Jul 2027</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-moderate/10 px-4 py-3 text-xs text-ink">
        <Icon name="sun" size={16} className="shrink-0 text-moderate" />
        Turn your screen brightness up and hold the code flat to the scanner.
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3">
        <div className="text-xs">
          <div className="text-muted">Inside right now</div>
          <div className="text-sm font-semibold">
            {live.people} <span className="font-normal text-muted">/ {live.capacity}</span>
          </div>
        </div>
        <LevelBadge level={live.level} />
      </div>
    </div>
  )
}
