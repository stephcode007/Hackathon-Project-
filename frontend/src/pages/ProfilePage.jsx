import { useState } from 'react'
import Icon from '../components/Icon'
import { STUDENT } from '../mocks/db'

function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted uppercase">{title}</h2>
      <div className="divide-y divide-line rounded-2xl border border-line bg-white px-4">{children}</div>
    </section>
  )
}

function Row({ icon, label, value, children }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon name={icon} size={17} className="shrink-0 text-muted" />
      <div className="min-w-0 flex-1 text-sm">{label}</div>
      {value && <div className="truncate text-sm text-muted">{value}</div>}
      {children}
    </div>
  )
}

function Toggle({ on, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-accent' : 'bg-stone-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export default function ProfilePage({ onBack }) {
  const [settings, setSettings] = useState({ reminders: true, busyAlerts: false, dueDates: true })
  const set = (key) => (value) => setSettings((s) => ({ ...s, [key]: value }))

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pt-4 pb-6">
      {onBack && (
        <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <Icon name="back" size={17} /> Back
        </button>
      )}
      <h1 className="mb-4 px-1 font-display text-2xl font-semibold">Profile</h1>

      <div className="mb-5 flex items-center gap-4 rounded-2xl border border-line bg-white p-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon name="user" size={30} />
        </div>
        <div className="min-w-0">
          <div className="font-display text-xl font-semibold">{STUDENT.fullName}</div>
          <div className="truncate text-sm text-muted">{STUDENT.email}</div>
        </div>
      </div>

      <Section title="Login details">
        <Row icon="user" label="Student ID" value={STUDENT.id} />
        <Row icon="qr" label="Student no." value={STUDENT.number} />
        <Row icon="book" label="Course" value={`${STUDENT.course} · Year ${STUDENT.year}`} />
        <Row icon="lock" label="Password" value="••••••••" />
      </Section>

      <Section title="Settings">
        <Row icon="bell" label="Booking reminders">
          <Toggle label="Booking reminders" on={settings.reminders} onChange={set('reminders')} />
        </Row>
        <Row icon="calendar" label="Book due-date reminders">
          <Toggle label="Book due-date reminders" on={settings.dueDates} onChange={set('dueDates')} />
        </Row>
        <Row icon="activity" label="Tell me when it's quiet">
          <Toggle label="Tell me when it's quiet" on={settings.busyAlerts} onChange={set('busyAlerts')} />
        </Row>
      </Section>

      <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-very-busy/30 bg-white py-3 text-sm font-semibold text-very-busy transition hover:bg-very-busy/5 active:scale-[0.99]">
        <Icon name="logout" size={17} /> Sign out
      </button>
    </div>
  )
}
