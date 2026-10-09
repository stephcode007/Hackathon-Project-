import { mockReply } from '../mocks/responses'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const STUDENT_ID = 'demo-student-001'

// Live: every message goes to the real `chat` Edge Function (books, reservations, rooms, desks,
// laptops, my bookings). Without a frontend/.env, or with ?api=mock in the URL, it's all mock.
export const LIVE =
  Boolean(SUPABASE_URL && SUPABASE_KEY) && new URLSearchParams(window.location.search).get('api') !== 'mock'

// Calls one of our Supabase Edge Functions (chat, bookings)
export async function callFunction(name, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ student_id: STUDENT_ID, ...body }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `${name} function returned ${res.status}`)
  return data
}

export async function sendMessage(messages) {
  if (LIVE) {
    try {
      return await callFunction('chat', { messages })
    } catch (err) {
      // Keep the demo alive if the backend is down: answer from the mock instead
      console.warn('Backend failed, answering from mock data', err)
    }
  }
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 500))
  return mockReply(messages)
}
