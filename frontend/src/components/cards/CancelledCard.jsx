import Icon from '../Icon'

export default function CancelledCard({ data }) {
  return (
    <div className="animate-card-in flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm">
      <Icon name="x" size={16} className="text-very-busy" />
      <span>
        <b>{data.resource_name}</b> booking cancelled
      </span>
    </div>
  )
}
