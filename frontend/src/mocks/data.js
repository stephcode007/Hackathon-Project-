// Mock data shaped like the Supabase tables in the README.
// Swap for real queries once Jason's backend is up.

export const student = {
  id: 'demo-student-001',
  name: 'Alex',
  course: 'BSc Computer Science',
  year: 2,
  email: 'alex@student.example.ac.uk',
}

export const books = [
  { book_id: 'b1', title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', subject: 'programming', floor: 3, shelf: 'QA76.76 .M37', copies_available: 2 },
  { book_id: 'b2', title: 'The Pragmatic Programmer', author: 'Andrew Hunt, David Thomas', isbn: '9780201616224', subject: 'programming', floor: 3, shelf: 'QA76.6 .H86', copies_available: 1 },
  { book_id: 'b3', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '9780262033848', subject: 'algorithms', floor: 3, shelf: 'QA76.6 .C66', copies_available: 0 },
  { book_id: 'b4', title: 'Design Patterns', author: 'Erich Gamma et al.', isbn: '9780201633610', subject: 'programming', floor: 3, shelf: 'QA76.64 .D47', copies_available: 1 },
  { book_id: 'b5', title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316097', subject: 'history', floor: 2, shelf: 'GN281 .H37', copies_available: 3 },
  { book_id: 'b6', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '9780374533557', subject: 'psychology', floor: 2, shelf: 'BF441 .K238', copies_available: 2 },
  { book_id: 'b7', title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', subject: 'physics', floor: 4, shelf: 'QB981 .H377', copies_available: 1 },
  { book_id: 'b8', title: 'The Selfish Gene', author: 'Richard Dawkins', isbn: '9780198788607', subject: 'biology', floor: 4, shelf: 'QH430 .D39', copies_available: 2 },
  { book_id: 'b9', title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '9780141439518', subject: 'literature', floor: 1, shelf: 'PR4034 .P7', copies_available: 4 },
  { book_id: 'b10', title: 'Freakonomics', author: 'Steven D. Levitt', isbn: '9780060731335', subject: 'economics', floor: 2, shelf: 'HB74 .P8 L48', copies_available: 0 },
]

export const rooms = [
  { resource_id: 'r1', name: 'Group Room 1.02', floor: 1, capacity: 4, features: ['whiteboard'] },
  { resource_id: 'r2', name: 'Group Room 1.05', floor: 1, capacity: 6, features: ['screen', 'whiteboard'] },
  { resource_id: 'r3', name: 'Group Room 2.04', floor: 2, capacity: 4, features: ['screen'] },
  { resource_id: 'r4', name: 'Group Room 2.07', floor: 2, capacity: 8, features: ['screen', 'whiteboard'] },
  { resource_id: 'r5', name: 'Study Pod 3.01', floor: 3, capacity: 2, features: ['power'] },
  { resource_id: 'r6', name: 'Seminar Room 4.10', floor: 4, capacity: 12, features: ['screen', 'whiteboard'] },
]

export const laptops = [1, 2, 3, 4, 5, 6].map(n => ({
  resource_id: `l${n}`,
  name: n <= 3 ? `MacBook Air #${n}` : `ThinkPad #${n}`,
  number: n,
  floor: 1,
  features: [n <= 3 ? 'mac' : 'windows'],
}))

export const desks = [
  { resource_id: 'd1', name: 'Desk Q-17', floor: 3, zone: 'quiet', features: ['power'] },
  { resource_id: 'd2', name: 'Desk S-04', floor: 4, zone: 'silent', features: ['power'] },
]

export const loans = [
  { book_id: 'b2', title: 'The Pragmatic Programmer', author: 'Andrew Hunt, David Thomas', isbn: '9780201616224', due: '2026-10-16' },
  { book_id: 'b6', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '9780374533557', due: '2026-10-23' },
]

export const coverUrl = isbn => `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
