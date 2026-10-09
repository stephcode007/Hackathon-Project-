import { mockChat } from '../mocks/agent.js'

// Sends the chat history and returns { reply, cards, bookings }.
// For now this uses the mock agent. Once the `chat` Edge Function is deployed,
// swap the body for:
//   const { data, error } = await supabase.functions.invoke('chat', {
//     body: { student_id: 'demo-student-001', messages },
//   })
// and fetch bookings with get_my_bookings instead of passing them in.
export async function sendMessage(messages, bookings) {
  await new Promise(r => setTimeout(r, 500 + Math.random() * 400)) // feel like a real network call
  return mockChat(messages, bookings)
}
