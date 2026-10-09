const SUGGESTIONS = [
  'Do you have Clean Code?',
  'I need a room for 4 at 2pm tomorrow',
  'Book laptop 3 for 2 hours',
  'Show my bookings',
]

export default function SuggestionChips({ onSend }) {
  return (
    <div className="chips">
      {SUGGESTIONS.map(s => (
        <button key={s} className="chip" onClick={() => onSend(s)}>{s}</button>
      ))}
    </div>
  )
}
