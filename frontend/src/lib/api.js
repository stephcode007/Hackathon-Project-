import { mockReply } from '../mocks/responses'

// Prototype: answers come from the local mock "backend".
// Later: const { data } = await supabase.functions.invoke('chat', { body: { student_id, messages } })
export async function sendMessage(messages) {
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 500))
  return mockReply(messages)
}
