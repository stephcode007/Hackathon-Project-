import { Wordmark } from '../brand/Blueberry'
import Icon from '../Icon'
import { STUDENT } from '../../mocks/db'
import { TABS } from './tabs'

// Website (wide screen) navigation: logo, tabs, and the profile at the bottom
export default function Sidebar({ tab, onChange }) {
  const item = (active) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-white hover:text-ink'
    }`

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-paper px-3 py-5 lg:flex">
      <Wordmark className="mb-8 px-3 text-2xl" />
      <nav className="space-y-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => onChange(t.id)} aria-current={tab === t.id ? 'page' : undefined} className={item(tab === t.id)}>
            <Icon name={t.icon} size={19} /> {t.label}
          </button>
        ))}
      </nav>
      <button onClick={() => onChange('profile')} className={`mt-auto ${item(tab === 'profile')}`}>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon name="user" size={17} />
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate text-ink">{STUDENT.fullName}</span>
          <span className="block text-xs font-normal text-muted">Profile & settings</span>
        </span>
      </button>
    </aside>
  )
}
