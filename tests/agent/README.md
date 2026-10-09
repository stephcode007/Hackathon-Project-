# Agent test harness (Sude)

Runs 32 scenarios from `docs/test-prompts.md` against the real Claude API, using the real
`prompt.ts`, `toolSchemas.ts` and `agent.ts` but **mock** `tools.ts` / `cards.ts` (in `mock/`,
in-memory, enforcing the README rules). No Supabase or Deno needed; Node 22.6+ only.

```bash
cd tests/agent
npm install
ANTHROPIC_API_KEY=sk-ant-api03-... npm test            # all scenarios
ANTHROPIC_API_KEY=sk-ant-api03-... npm test -- "" 3b   # only scenarios whose id starts with "3b"
```

(The second argument is the scenario id prefix; the first is an optional path to the chat folder.)

It prints, per scenario, the tool calls (with `!!` on tool errors), the card types and Claude's reply.
Read the output by eye: the pass criteria are in `docs/test-prompts.md`. Never put the key in a file.
When Jason's real `tools.ts` exists, the mocks can be dropped and the harness pointed at a local Supabase.
