import { mockReply } from '../mocks/responses'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const STUDENT_ID = 'demo-student-001'

// The backend only has the book tools so far (search_books, reserve_book, …).
// Book questions go to the real `chat` Edge Function; everything else stays on the
// local mock until those tools exist. Without a frontend/.env, it's all mock.
const RESOURCE_WORDS = /\b(rooms?|desks?|laptops?|macbook|pods?|seats?|busy|quiet|peak)\b/i
const BOOK_WORDS = /\b(books?|reserve|reservations?|author|isbn|novel|textbook|catalogue)\b|do you have|have you got|looking for/i

const isAboutBooks = (text) => BOOK_WORDS.test(text) && !RESOURCE_WORDS.test(text)

async function askBackend(messages) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ student_id: STUDENT_ID, messages }),
  })
  if (!res.ok) throw new Error(`chat function returned ${res.status}`)
  return res.json()
}

export async function sendMessage(messages) {
  const last = messages[messages.length - 1].content
  if (SUPABASE_URL && SUPABASE_KEY && isAboutBooks(last)) {
    try {
      return await askBackend(messages)
    } catch (err) {
      // Keep the demo alive if the backend is down: answer from the mock instead
      console.warn('Backend failed, answering from mock data', err)
    }
  }
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 500))
  return mockReply(messages)
}
