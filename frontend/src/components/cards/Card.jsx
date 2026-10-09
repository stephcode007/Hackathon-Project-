import Icon from '../Icon'

export default function Card({ icon, title, right, children, className = '' }) {
  return (
    <div className={`animate-card-in rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
            {icon && <Icon name={icon} size={14} />}
            {title}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}
