const SUGGESTIONS = [
  'How busy is the library right now?',
  "When's it usually quiet on Thursdays?",
  'I need a room for 4 at 2pm tomorrow',
  'Do you have Clean Code?',
  'Book me a desk with a plug at 4pm',
  'Show my bookings',
]

export default function SuggestionChips({ onPick }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className="rounded-full border border-line bg-white px-3.5 py-2 text-left text-[13px] transition hover:border-accent hover:text-accent active:scale-95"
        >
          {s}
        </button>
      ))}
    </div>
  )
}
