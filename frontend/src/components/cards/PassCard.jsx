import QrPass from '../pass/QrPass'
import Card from './Card'

export default function PassCard({ data }) {
  return (
    <Card icon="qr" title="Library pass">
      <div className="flex items-center gap-4">
        <QrPass value={data.qr_value} size={112} />
        <div>
          <div className="font-display text-lg font-semibold">{data.student_name}</div>
          <p className="mt-1 text-xs text-muted">Hold this up to the gate scanner. Turn your brightness up.</p>
        </div>
      </div>
    </Card>
  )
}
