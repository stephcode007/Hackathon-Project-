// The agent loop. Owner: Sude.
// TOOLS (tools.ts) and toCards (cards.ts) are Jason's. Contract:
//   TOOLS[name](input, studentId) -> Promise<object>   (returns { error: "..." } on failure)
//   toCards(name, output)         -> card[]            (cards are built from tool output, not Claude's text)
import Anthropic from "npm:@anthropic-ai/sdk";
import { buildSystemPrompt } from "./prompt.ts";
import { TOOL_SCHEMAS } from "./toolSchemas.ts";
import { TOOLS } from "./tools.ts";
import { toCards } from "./cards.ts";

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

const MAX_STEPS = 8;

export async function runAgent(
  history: { role: "user" | "assistant"; content: string }[],
  studentId: string,
) {
  // Don't mutate the caller's array: tool turns live only inside this request.
  const messages: any[] = [...history];
  const cards: unknown[] = [];

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await anthropic.messages.create({
      model: Deno.env.get("CLAUDE_MODEL") ?? "claude-sonnet-5-5",
      max_tokens: 1024,
      system: buildSystemPrompt(), // fresh date/time/timezone on every request
      tools: TOOL_SCHEMAS as any,
      messages,
    });

    if (res.stop_reason !== "tool_use") {
      const reply = res.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n")
        .trim();
      return { reply: reply || "Sorry, I didn't catch that. Could you rephrase?", cards };
    }

    messages.push({ role: "assistant", content: res.content });

    const results = [];
    for (const call of res.content.filter((b: any) => b.type === "tool_use") as any[]) {
      let output: any;
      try {
        const tool = (TOOLS as Record<string, (input: unknown, studentId: string) => Promise<any>>)[call.name];
        output = tool
          ? await tool(call.input, studentId)
          : { error: `Unknown tool: ${call.name}` };
      } catch (err) {
        console.error(`Tool ${call.name} failed:`, err);
        output = { error: "Something went wrong on our side. Please try again in a moment." };
      }

      if (!output?.error) cards.push(...toCards(call.name, output));

      results.push({
        type: "tool_result",
        tool_use_id: call.id,
        content: JSON.stringify(output),
        is_error: Boolean(output?.error),
      });
    }
    messages.push({ role: "user", content: results });
  }

  return { reply: "Sorry, that took too many steps. Could you rephrase?", cards };
}
