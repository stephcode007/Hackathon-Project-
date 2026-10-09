import { Wordmark } from '../brand/Logo'
import ProfileButton from './ProfileButton'

// Phone header shared by every tab. It blends into the page (no border) and
// sits outside the scrolling area, so it stays put while the page scrolls.
// On the website the sidebar has the logo and profile instead.
export default function TopBar({ onProfile, profileActive }) {
  return (
    <header className="flex shrink-0 items-center justify-between bg-paper px-4 pt-3 pb-2 lg:hidden">
      <Wordmark className="text-xl" />
      <ProfileButton onClick={onProfile} active={profileActive} />
    </header>
  )
}
