// HTTP handler for the chat Edge Function: CORS, input checks, then Sude's agent loop.
import { runAgent } from "./agent.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }

  const { student_id = "demo-student-001", messages } = body ?? {};
  const valid = Array.isArray(messages) && messages.length > 0 &&
    messages.every((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string");
  if (!valid) {
    return json({ error: "messages must be a non-empty array of { role: 'user' | 'assistant', content: string }" }, 400);
  }

  try {
    const { reply, cards } = await runAgent(messages, student_id);
    return json({ reply, cards });
  } catch (err) {
    console.error("chat failed", err);
    return json({ reply: "Sorry, something went wrong on my side. Please try again.", cards: [] }, 500);
  }
});
