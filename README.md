# Stacks 📚

**Your library, by chat.** An AI assistant that lets students book study rooms, find books, borrow laptops and reserve desks just by asking. It also tells you how busy the library is and when the quiet times are, and it carries your library pass so you can scan in without leaving the app.

> "Stacks" is a working name. Swap it once the branding is final.

---

## The problem

Studying in the library means juggling several systems: a room-booking website, the catalogue, the laptop-loan desk, and a separate student app (or a screenshot in your camera roll) just to get through the gate. There's also no way to know whether the library is packed until you've already walked there.

> 📊 **Jack:** replace this with real numbers from a quick survey of 10+ students, e.g. "X of Y students have arrived at the library and found no free seats."

## The solution

One app with one chat box. A student can type:

> "How busy is the library right now?"
> "When's it usually quiet on Thursdays?"
> "Book me a desk with a plug at 4 tomorrow, and find me *Clean Code*."

Stacks answers with live data and books things for you. The answers come back as cards in the chat: a busyness meter, a popular-times chart, a booking confirmation. When you get to the library, you tap **Library pass** and scan your QR code at the gate.

Every scan in and out is counted. That count is what powers "how busy is it?", and over time it builds up the library's peak times.

### Design decision: no dashboard

Stacks is an assistant, not a dashboard. Busyness and peak times aren't on a permanent screen. You ask, and the answer appears as a card in the chat. This keeps the app simple and lets the AI combine information. For example, if you try to book a desk at 2pm, it can point out that 2pm is peak time and offer 4pm instead.

The one thing that is always on screen is the **Library pass** button, because at the gate you need your QR code instantly, not after typing a message.

---

## Demo flow (what the judges see)

1. **"How busy is the library right now?"** → busyness card: 🟡 Moderate, 318 of 600 seats taken
2. **"When's it usually quiet on Thursdays?"** → popular-times chart card: peak 12:00–15:00, quietest before 10:00 and after 18:00
3. **"I need a room for 4 at 2pm tomorrow"** → the agent notes that 2pm is peak, then shows an availability card. Tap **Book** → booking card
4. **"Do you have *Clean Code*?"** → book card with cover, floor, shelf and copies available
5. **Scan-in moment:** tap **Library pass** on a phone and hold it up to the "gate" laptop → "Welcome, Alex ✓ 319 people inside"
6. **Wow moment:** click **Simulate rush** on the gate (+150 students), then ask **"Is it busy now?"** → 🔴 Very busy. "Want me to hold a desk for you, or try after 6pm?"

Jack: trim this to fit the time limit. Steps 1, 3, 5 and 6 are the essentials.

---

## Features

| Priority | Feature | Owner |
|---|---|---|
| MVP | Chat with the agent | Stephen |
| MVP | Find and book rooms, desks and laptops | Jason (tools) + Sude (agent) |
| MVP | Search books: shelf location + copies available | Jason + Sude |
| MVP | Booking cards with a cancel button, plus "my bookings" | Chid + Jason |
| ⭐ Headline | **"How busy is it?"**: live headcount from scan-ins, answered in chat | Jason (data) + Sude (tool) + Chid (card) |
| ⭐ Headline | **Peak times**: learned from scan history and shown as a popular-times chart card | Jason + Sude + Chid |
| ⭐ Headline | **Peak-aware booking**: the agent warns if you're booking at a busy time and suggests a quieter slot | Sude |
| ⭐ Headline | **Library pass**: your QR code one tap away in the app | Stephen |
| ⭐ Headline | **Gate page**: webcam QR scanner standing in for the library gate in the demo, with a "Simulate rush" button | Stephen |
| Stretch | Voice input (browser speech recognition, no API key needed) | Stephen |
| Stretch | Rotating QR codes, so a screenshot of the pass stops working | Jason |
| Stretch | Live availability map (Supabase Realtime) | Chid |
| Stretch | Reserve a book that's currently out | Jason |
| Stretch | "Add to calendar" button (.ics download) | Chid |

---

## How it works

```
  STUDENT APP (phone)                   LIBRARY GATE (demo: laptop webcam)
  chat · cards · library pass ── QR ──► /gate page scans the code
            │                                       │
            │ invoke("chat")                        │ invoke("scan")
            ▼                                       ▼
  Edge Function "chat"                  Edge Function "scan"
  agent loop + tools ◄──► Claude API    opens / closes a visit
            │                                       │
            └───────────────────┬───────────────────┘
                                ▼
                        Supabase Postgres
          resources · bookings · books · library_visits
```

### The chat

1. The frontend sends the conversation to the `chat` Edge Function.
2. The function sends it to Claude along with the system prompt and the tool definitions.
3. Claude replies with either text (done) or a `tool_use` request, e.g. `get_busyness({})` or `find_rooms({ date, start_time, duration_minutes, capacity })`.
4. The function runs that tool against Postgres and sends the result back to Claude as a `tool_result`. This repeats until Claude replies with text.
5. The function returns `{ reply, cards }`. **Cards are built from the tool results, not from Claude's text**, so the numbers on a card are always what's in the database.

### The pass and the gate

- The app shows a QR code that encodes the student's pass ID (`stacks:demo-student-001` for the demo).
- The gate scans it and calls the `scan` Edge Function. If the student has no open visit, it opens one (**scan in**). If they already have one, it closes it (**scan out**). It's the same code both ways.
- In real life, the library's existing gate reader would call `scan`. For the demo, the gate is a page in our own app running on a laptop with a webcam.

**Why Edge Functions and not calling Claude from React?** The Anthropic API key must never be in the frontend: anyone could open dev tools and copy it. It lives only in Supabase secrets.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | fast to scaffold, easy to make look good |
| QR code (pass) | `qrcode.react` | draws the student's QR code |
| QR scanner (gate) | `html5-qrcode` | reads QR codes from the laptop webcam |
| Charts | plain Tailwind `div` bars | the popular-times chart is ~15 bars; no chart library needed |
| Animation | Framer Motion (optional) | cards sliding in = instant polish |
| Database | Supabase Postgres | tables + SQL editor, no server to run |
| Backend logic | Supabase Edge Functions (Deno) | hosts the agent and the scan endpoint, keeps the API key secret |
| AI | Claude API, model `claude-sonnet-5-5` | strong at tool use; switch to `claude-haiku-5-5` if replies feel slow |
| Hosting | Vercel (frontend), Supabase (everything else) | free tier, deploys straight from GitHub |
| Project management | Notion | task board, demo script, judging checklist |

Edge Function files end in `.ts`, but you can write plain JavaScript inside them. Deno doesn't need a build step.

The gate page lives in the same React app, opened with `?mode=gate` (e.g. `https://stacks.vercel.app/?mode=gate`). `App.jsx` checks the query string, so no router and no Vercel rewrite rules are needed.

---

## Data model

All mock data. We are **not** connecting to the real library system. Use the real names of your library's rooms and floors in the seed data so it feels authentic to the judges.

```sql
create extension if not exists btree_gist;

-- Rooms, desks and laptops share one table
create table resources (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('room', 'desk', 'laptop')),
  name       text not null,          -- "Group Room 2.04", "Desk Q-17", "MacBook Air #3"
  floor      int,
  zone       text,                   -- 'silent' | 'quiet' | 'group'
  capacity   int,                    -- rooms only
  features   text[] default '{}',    -- {'whiteboard','screen','power','mac','windows'}
  is_active  boolean default true
);

create table bookings (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id),
  student_id  text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      text not null default 'active' check (status in ('active', 'cancelled')),
  created_at  timestamptz default now(),
  check (ends_at > starts_at),
  -- the database itself refuses double bookings
  exclude using gist (resource_id with =, tstzrange(starts_at, ends_at) with &&)
    where (status = 'active')
);

create table books (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  author           text,
  isbn             text,
  subject          text,
  floor            int,
  shelf            text,             -- e.g. "QA76.76 .M37"
  copies_total     int default 1,
  copies_available int default 1
);

-- One row per visit. Scanning in opens a visit, scanning the same QR again closes it.
create table library_visits (
  id          uuid primary key default gen_random_uuid(),
  student_id  text not null,
  entered_at  timestamptz not null default now(),
  left_at     timestamptz            -- null = still inside
);
create index on library_visits (entered_at);
-- a student can only have one open visit at a time
create unique index one_open_visit on library_visits (student_id) where left_at is null;
```

**Book covers for free:** `https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg`

**Seed size:** ~12 rooms, ~40 desks, ~15 laptops, ~60 books, a handful of existing bookings, and **4 weeks of fake visit history** (see below).

**Security:** turn on Row Level Security with a read-only `select` policy for the anon role on `resources`, `bookings` and `books`. `library_visits` gets no public policy at all. All writes go through the Edge Functions using the service-role key.

### How busyness is worked out

| Question | How |
|---|---|
| How many people are inside right now? | Count visits where `left_at` is null. Visits still open at closing time are closed automatically. |
| How full is that? | People inside ÷ capacity. Capacity is a constant in `tools.ts`; set it to your library's real seat count (600 in the examples). |
| Is that busy? | Under 40% 🟢 Quiet · 40–70% 🟡 Moderate · 70–90% 🟠 Busy · 90%+ 🔴 Very busy |
| How busy is it usually at this time? | The average number of people inside for that weekday and hour over the last 4 weeks. Precompute it into a `typical_busyness` materialized view (`weekday, hour, avg_people`) and refresh it after seeding. It's too slow to recalculate on every chat message. |
| When are the peak times? | The busiest hours for a weekday in `typical_busyness` are the peak; the emptiest open hours are the quiet times. |

**Fake history:** generate about 1,500 visits per weekday for the past 4 weeks with a SQL `generate_series` script. Make weekdays busiest from 11:00 to 15:00, Fridays and weekends quieter, and evenings emptier. Use fake student IDs like `seed-0001`. Without this history there's nothing to learn peak times from.

### Library rules (enforced in the tools, and told to Claude)

- Open 08:00–22:00
- Rooms max 3 hours, desks max 4 hours, laptops max 4 hours and same-day only
- Bookings in 30-minute steps, up to 7 days ahead, never in the past

### Demo user

No login. Everyone is `demo-student-001` ("Alex"). Auth is a time sink that judges won't score.

---

## Agent tools

| Tool | What it does | Inputs |
|---|---|---|
| `get_busyness` | How busy the library is right now (live headcount), or how busy it usually is at a given day and time | `date?`, `time?` (none = right now) |
| `get_peak_times` | Hour-by-hour typical busyness for a day, with the peak and quietest hours | `day?` (default today) |
| `show_library_pass` | Shows the student's QR pass inside the chat | none |
| `search_books` | Finds books by title, author or subject | `query` |
| `find_rooms` | Lists rooms free for a time slot | `date`, `start_time`, `duration_minutes`, `capacity?`, `features?` |
| `book_room` | Books a room | `room_id`, `starts_at`, `ends_at` |
| `find_desks` | Lists free desks | `date`, `start_time`, `duration_minutes`, `zone?`, `needs_power?` |
| `book_desk` | Books a desk | `desk_id`, `starts_at`, `ends_at` |
| `find_laptops` | Lists laptops available to borrow | `date`, `start_time`, `duration_minutes`, `os?` |
| `book_laptop` | Loans a laptop | `laptop_id`, `starts_at`, `ends_at` |
| `get_my_bookings` | The student's upcoming bookings | none |
| `cancel_booking` | Cancels a booking | `booking_id` |

Under the hood, the three `find_*` tools share one `findAvailable(type, …)` helper and the three `book_*` tools share one `createBooking(resourceId, …)` helper. Separate tool names just make it clearer for Claude.

When a tool fails (room already taken, outside opening hours), return a plain-English error such as `{ "error": "Room 2.04 is booked 14:00–15:00. Next free slot is 15:00." }` so Claude can explain it and suggest an alternative.

---

## API contract

What frontend and backend must agree on. **Don't change it without telling the team.**

### `chat`: request

```js
const { data, error } = await supabase.functions.invoke("chat", {
  body: {
    student_id: "demo-student-001",
    messages: [
      { role: "user", content: "How busy is it right now?" },
      { role: "assistant", content: "Moderate: 318 people in, about half full." },
      { role: "user", content: "Book me a desk at 4 then" }
    ]
  }
});
```

The frontend only sends plain-text history. Tool calls stay inside the function.

### `chat`: response

```json
{
  "reply": "Done! Desk Q-17 on floor 3 is yours tomorrow 16:00–18:00. 4pm is usually calm, good pick.",
  "cards": [
    {
      "type": "booking",
      "data": {
        "booking_id": "8f1c…",
        "resource_type": "desk",
        "resource_name": "Desk Q-17",
        "floor": 3,
        "zone": "quiet",
        "features": ["power"],
        "starts_at": "2026-10-10T16:00:00+01:00",
        "ends_at": "2026-10-10T18:00:00+01:00"
      }
    }
  ]
}
```

### Card types

| `type` | Comes from | `data` shape | Shows as |
|---|---|---|---|
| `busyness` | `get_busyness` | `{ is_live, people, capacity, percent, level, as_of, typical_now }` | a meter with a coloured level and "usually X at this time" |
| `peak_times` | `get_peak_times` | `{ day, now_hour, peak: "12:00–15:00", quietest: "08:00–10:00", hours: [{ hour, avg_people, level }] }` | a small popular-times bar chart with the current hour highlighted |
| `library_pass` | `show_library_pass` | `{ student_name, qr_value }` | the QR code (same component as the pass screen) |
| `availability` | `find_rooms` / `find_desks` / `find_laptops` | `{ resource_type, date, options: [{ resource_id, name, floor, capacity, features }] }` | a list with **Book** buttons that send a chat message like "Book Group Room 2.04 from 15:00 to 17:00" |
| `booking` | `book_*` | as in the example above | a confirmation with **Cancel** and **Add to calendar** buttons |
| `books` | `search_books` | `{ results: [{ book_id, title, author, isbn, floor, shelf, copies_available }] }` | covers with shelf location |
| `my_bookings` | `get_my_bookings` | `{ bookings: [ …same as booking data… ] }` | a list with a Cancel button on each |
| `cancelled` | `cancel_booking` | `{ booking_id, resource_name }` | a short confirmation |

Card buttons just send a new chat message, so no extra endpoints are needed.

### `scan` (used by the gate page only)

```js
// a real scan
await supabase.functions.invoke("scan", { body: { qr_value: "stacks:demo-student-001" } });
// → { "direction": "in", "student_name": "Alex", "people_inside": 319, "capacity": 600, "level": "moderate" }

// demo only: "Simulate rush" adds N fake students who are inside right now
await supabase.functions.invoke("scan", { body: { simulate: 150 } });
// → { "direction": "simulated", "people_inside": 469, "capacity": 600, "level": "busy" }
```

---

## The agent loop

Simplified version of `supabase/functions/chat/agent.ts`:

```js
import Anthropic from "npm:@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

export async function runAgent(messages, studentId) {
  const cards = [];

  for (let step = 0; step < 8; step++) {          // safety limit
    const res = await anthropic.messages.create({
      model: Deno.env.get("CLAUDE_MODEL") ?? "claude-sonnet-5-5",
      max_tokens: 1024,
      system: buildSystemPrompt(),                // includes today's date + library rules
      tools: TOOL_SCHEMAS,
      messages,
    });

    if (res.stop_reason !== "tool_use") {
      const reply = res.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      return { reply, cards };
    }

    messages.push({ role: "assistant", content: res.content });

    const results = [];
    for (const call of res.content.filter(b => b.type === "tool_use")) {
      const output = await TOOLS[call.name](call.input, studentId);   // Jason's tools.ts
      cards.push(...toCards(call.name, output));
      results.push({
        type: "tool_result",
        tool_use_id: call.id,
        content: JSON.stringify(output),
        is_error: Boolean(output.error),
      });
    }
    messages.push({ role: "user", content: results });
  }

  return { reply: "Sorry, that took too many steps. Could you rephrase?", cards };
}
```

### System prompt checklist (Sude)

- Who it is: a friendly, brief library assistant for students
- **Today's date, the current time and the campus timezone**, injected fresh on every request. Without this, "tomorrow at 2" breaks.
- The library rules above
- Always use tools to check availability and busyness; never guess or invent rooms, books, times or headcounts
- "How busy / is it packed / is it worth going in" → `get_busyness`. "When is it quiet / what are the peak times" → `get_peak_times`. "Show my pass / my QR" → `show_library_pass`.
- **Peak-aware booking:** when booking for a slot that's usually Busy or Very busy, book what was asked, then add one short line naming a quieter time
- If a request is missing something essential (time, number of people), ask one short question
- If everything needed is there, book straight away. Don't ask "are you sure?"
- Keep replies to 1–2 sentences, because the cards show the details
- The student's name is Alex

---

## Project structure

```
/
├── README.md
├── .env.example
├── .gitignore                     # must include .env
├── frontend/                      # Stephen + Chid
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx                # shows the chat, or the gate page when ?mode=gate
│       ├── components/
│       │   ├── chat/              # Stephen: ChatWindow, MessageList, MessageInput, SuggestionChips
│       │   ├── pass/              # Stephen: PassButton (always in the header), PassScreen, QrCode
│       │   └── cards/             # Chid: BusynessCard, PeakTimesCard, PassCard, BookingCard,
│       │                          #       AvailabilityCard, BooksCard, MyBookingsCard
│       ├── pages/
│       │   └── Gate.jsx           # Stephen: webcam scanner, welcome screen, Simulate rush button
│       ├── lib/
│       │   ├── supabase.js        # Supabase client
│       │   └── api.js             # sendMessage() → { reply, cards }, scan()
│       └── mocks/
│           └── responses.js       # fake responses so the UI can be built before the backend is ready
├── supabase/                      # Jason + Sude
│   ├── migrations/
│   │   └── 001_schema.sql         # Jason
│   ├── seed.sql                   # Jason: rooms, desks, laptops, books (from Jack's sheet)
│   ├── seed_visits.sql            # Jason: 4 weeks of fake visit history + typical_busyness view
│   └── functions/
│       ├── chat/
│       │   ├── index.ts           # Jason: HTTP handler, CORS, calls runAgent
│       │   ├── agent.ts           # Sude: the loop above
│       │   ├── prompt.ts          # Sude: system prompt
│       │   ├── toolSchemas.ts     # Sude: tool definitions for Claude
│       │   ├── tools.ts           # Jason: tool implementations (Postgres queries)
│       │   └── cards.ts           # Jason: toCards(toolName, output)
│       └── scan/
│           └── index.ts           # Jason: opens/closes visits, simulate rush
└── docs/
    ├── demo-script.md             # Jack
    └── test-prompts.md            # Sude
```

---

## Getting started

### Prerequisites

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A Supabase project (free tier) and an Anthropic API key from the [Claude Console](https://platform.claude.com/)

### Frontend

```bash
cd frontend
npm install
npm install qrcode.react html5-qrcode
cp ../.env.example .env      # fill in the two VITE_ values
npm run dev
```

### Backend

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push                                       # creates the tables
# then run supabase/seed.sql and supabase/seed_visits.sql in the Supabase SQL editor
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set CLAUDE_MODEL=claude-sonnet-5-5
supabase functions deploy chat
supabase functions deploy scan
```

### Environment variables

| Where | Variable | Secret? |
|---|---|---|
| `frontend/.env` | `VITE_SUPABASE_URL` | no, safe in the browser |
| `frontend/.env` | `VITE_SUPABASE_ANON_KEY` | no, safe in the browser (RLS protects writes) |
| Supabase secrets | `ANTHROPIC_API_KEY` | **yes, never in the frontend or in git** |
| Supabase secrets | `CLAUDE_MODEL` | no |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available inside Edge Functions automatically.

---

## Team

| Person | Role | Owns |
|---|---|---|
| **Jason** | Backend | Supabase project, schema, seed data, 4-week visit history, `typical_busyness` view, tool implementations, `chat` handler, `scan` function |
| **Sude** | AI / agent | API key + spend limit, system prompt (including peak-aware booking), tool schemas, agent loop, test prompts |
| **Stephen** | Frontend: chat, pass + gate | App scaffold, chat UI, API hookup, mock mode, mobile layout, Library pass, gate page, Vercel deploy; voice (stretch) |
| **Chid** | Frontend: cards | Design look, all card components including the busyness meter and popular-times chart; live map (stretch) |
| **Jack** | Pitch lead | Notion board, judging criteria, student survey, mock data sheet, name/logo, demo script and choreography (phone + gate), slides, backup video, timekeeping |

## Milestones

| # | Milestone | Done when |
|---|---|---|
| M0 | Contract agreed | The API contract and card types above are signed off by everyone |
| M1 | Hello agent | The deployed `chat` function returns a real Claude reply (no tools yet) and it shows in the chat UI |
| M2 | First booking | "Book a room for 4 at 3pm" works end to end and shows a booking card |
| M3 | Scan in | The pass shows on a phone, the gate page scans it, and a visit appears in `library_visits` |
| M4 | How busy? | "How busy is it?" and "When's it quiet on Thursday?" answer with cards built from 4 weeks of seeded history |
| M5 | Full library | Books, desks, laptops, my bookings, cancel and peak-aware booking all work |
| M6 | Demo-ready | Deployed URL, resets tested, demo rehearsed 3+ times, backup video recorded |

**Feature freeze** a few hours before judging. After that: bug fixes and rehearsal only.

## Gotchas

- **CORS:** both Edge Functions must handle `OPTIONS` requests and return CORS headers, or the browser will block every call.
- **Timezones:** store everything as `timestamptz` and always pass Claude the current date, time and timezone. Supabase runs in UTC, so convert to the campus timezone before taking the hour for peak times, or the peaks will be an hour off.
- **Webcam needs HTTPS:** the gate scanner works on `localhost` and on the deployed Vercel URL, but not on a plain `http://` network address.
- **QR on a phone:** turn the screen brightness up, and avoid holding it in projector glare.
- **Stale visits:** students who never scan out would count as inside forever. Close any visit still open at closing time.
- **Never commit `.env`** or the API key. Set a monthly spend limit in the Claude Console.
- **Branches:** one branch per person, small PRs, keep `main` deployable at all times.

## Privacy (a pitch talking point)

Only headcounts are ever shown, never who is inside. Peak times come from anonymous totals. In production, the QR code would be a short-lived signed token that changes every 30 seconds, so a screenshot of someone else's pass wouldn't get you in.

## Demo-day checklist

- [ ] Re-run the resets right before presenting: clear today's demo scans and rush, reset bookings, keep the 4-week history
- [ ] Phone open on the deployed URL with the pass ready and brightness up
- [ ] Gate page open on a second laptop or screen, with camera permission already granted
- [ ] One test scan before going on stage
- [ ] Send one chat message a few minutes beforehand to warm up the function
- [ ] Phone hotspot ready in case the venue Wi-Fi dies
- [ ] Backup video open in another tab
- [ ] Exact demo prompts written down and rehearsed
