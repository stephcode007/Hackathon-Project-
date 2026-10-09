import { useId } from 'react'

// The Bookmark mark: a little blue bookmark ribbon.
// Sized in em so it scales with the text it sits next to.
export default function BookmarkMark({ size = '1em', className = '' }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7b85ea" />
          <stop offset="100%" stopColor="#3a43b0" />
        </linearGradient>
      </defs>
      <path d="M6 1.5h12a1.5 1.5 0 0 1 1.5 1.5v19.2a.6.6 0 0 1-.95.49L12 17.6l-6.55 5.09a.6.6 0 0 1-.95-.49V3A1.5 1.5 0 0 1 6 1.5Z" fill={`url(#${id}-fill)`} />
      {/* soft highlight down the left edge */}
      <path d="M7 3.5v14" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

// "Bookmark" with the bookmark as its full stop
export function Wordmark({ className = '' }) {
  return (
    <span className={`inline-flex items-baseline font-display font-semibold tracking-tight ${className}`}>
      Bookmark
      <BookmarkMark size="0.42em" className="ml-[0.06em] self-baseline" />
    </span>
  )
}
