import { Wordmark } from '../brand/Logo'
import Icon from '../Icon'
import ProfileButton from './ProfileButton'

// Phone header shared by every tab: ☰ (chat history) + logo on the left, profile on
// the right. It blends into the page and sits outside the scrolling area, so it
// stays put while the page scrolls. On the website the sidebar does this instead.
export default function TopBar({ onMenu, onProfile, profileActive }) {
  return (
    <header className="flex shrink-0 items-center justify-between bg-paper px-3 pt-3 pb-2 lg:hidden">
      <div className="flex items-center gap-1.5">
        <button onClick={onMenu} aria-label="Chat history" className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-white active:scale-95">
          <Icon name="menu" size={21} />
        </button>
        <Wordmark className="text-xl" />
      </div>
      <ProfileButton onClick={onProfile} active={profileActive} />
    </header>
  )
}
