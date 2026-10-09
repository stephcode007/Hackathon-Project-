import Icon from '../Icon'

import { TABS } from './tabs'

export default function BottomNav({ tab, onChange }) {
  return (
    <nav className="shrink-0 border-t border-line bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-3">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${active ? 'text-accent' : 'text-muted hover:text-ink'}`}
            >
              <span className={`grid h-8 w-14 place-items-center rounded-full transition ${active ? 'bg-accent-soft' : ''}`}>
                <Icon name={t.icon} size={20} strokeWidth={active ? 2.2 : 1.8} />
              </span>
              {t.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
