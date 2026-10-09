import AvailabilityCard from './AvailabilityCard'
import BookingCard from './BookingCard'
import BooksCard from './BooksCard'
import BusynessCard from './BusynessCard'
import CancelledCard from './CancelledCard'
import MyBookingsCard from './MyBookingsCard'
import PassCard from './PassCard'
import PeakTimesCard from './PeakTimesCard'

// card.type (from the API contract) → component
const CARDS = {
  busyness: BusynessCard,
  peak_times: PeakTimesCard,
  library_pass: PassCard,
  availability: AvailabilityCard,
  booking: BookingCard,
  books: BooksCard,
  my_bookings: MyBookingsCard,
  cancelled: CancelledCard,
}

export default function ChatCard({ card, onAction }) {
  const Component = CARDS[card.type]
  return Component ? <Component data={card.data} onAction={onAction} /> : null
}
