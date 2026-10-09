import Icon from '../Icon'

// The usual round "account" button: a person silhouette in a circle
export default function ProfileButton({ onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      aria-label="Profile"
      className={`grid h-9 w-9 place-items-center rounded-full transition active:scale-95 ${
        active ? 'bg-accent text-white' : 'bg-accent-soft text-accent hover:bg-accent hover:text-white'
      }`}
    >
      <Icon name="user" size={19} />
    </button>
  )
}
