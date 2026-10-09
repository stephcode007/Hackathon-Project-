import { useId } from 'react'

// The Bookmark full stop: a little blueberry with its five-point crown.
// Sized in em so it scales with the text it sits next to.
export default function Blueberry({ size = '1em', className = '' }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-skin`} cx="38%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#9aa4ff" />
          <stop offset="45%" stopColor="#5a64d8" />
          <stop offset="100%" stopColor="#262b78" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="17" r="14" fill={`url(#${id}-skin)`} />
      {/* the crown */}
      <path
        d="M16 5.2l1.4 3 3.2-.7-1.6 2.9 2.4 2.1-3.2.5L16 16l-2.2-3 -3.2-.5 2.4-2.1-1.6-2.9 3.2.7z"
        fill="#1c1f5c"
        opacity="0.85"
        transform="translate(0 1) scale(1 0.8) translate(0 1.5)"
      />
      {/* soft bloom highlight */}
      <ellipse cx="10.5" cy="12.5" rx="3.2" ry="2" fill="#fff" opacity="0.28" transform="rotate(-30 10.5 12.5)" />
    </svg>
  )
}

// "Bookmark" with the blueberry as its full stop
export function Wordmark({ className = '' }) {
  return (
    <span className={`inline-flex items-baseline font-display font-semibold tracking-tight ${className}`}>
      Bookmark
      <Blueberry size="0.42em" className="ml-[0.06em] translate-y-[0.02em] self-baseline" />
    </span>
  )
}
