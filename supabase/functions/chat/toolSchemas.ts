// Tool definitions sent to Claude. Owner: Sude.
// The names and inputs here must match the tool table in the README and Jason's tools.ts.
// Hard limits (opening hours, 7-day window, no past bookings) are enforced in tools.ts;
// the descriptions repeat them so Claude doesn't propose impossible slots.

const DATE = {
  type: "string",
  description: "Date as YYYY-MM-DD in campus time.",
};

const START_TIME = {
  type: "string",
  description: "Start time as HH:MM (24h, campus time) on a :00 or :30 minute, e.g. '14:00'.",
};

const STARTS_AT = {
  type: "string",
  description:
    "Booking start as an ISO 8601 date-time with the campus UTC offset, e.g. '2026-10-10T16:00:00+01:00'. On a :00 or :30 minute.",
};

const ENDS_AT = {
  type: "string",
  description:
    "Booking end as an ISO 8601 date-time with the campus UTC offset. Must be after starts_at, in 30-minute steps.",
};

const duration = (max: number) => ({
  type: "integer",
  minimum: 30,
  maximum: max,
  multipleOf: 30,
  description: `Length of the booking in minutes (30-${max}, steps of 30).`,
});

export const TOOL_SCHEMAS = [
  {
    name: "get_busyness",
    description:
      "How busy the library is. With no inputs it returns the LIVE headcount right now (people inside, capacity, percent, level quiet/moderate/busy/very_busy) plus how busy it usually is at this time. With date and/or time it returns how busy the library is TYPICALLY at that moment. Use for 'how busy is it?', 'is it packed?', 'is it worth going in?'.",
    input_schema: {
      type: "object",
      properties: {
        date: { ...DATE, description: "Optional. Day to check (YYYY-MM-DD). Omit for today." },
        time: { type: "string", description: "Optional. Time as HH:MM (24h). Omit together with date for the live, right-now answer." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_peak_times",
    description:
      "Hour-by-hour typical busyness for one day, with the peak hours and the quietest hours. Use for 'when is it quiet?', 'what are the peak times on Thursday?', 'best time to go tomorrow?'. Also use it before booking to check whether the requested hour is a busy one.",
    input_schema: {
      type: "object",
      properties: {
        day: { ...DATE, description: "Optional. Day to analyse (YYYY-MM-DD). Omit for today." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "show_library_pass",
    description:
      "Show the student's library pass (QR code) in the chat. Use for 'show my pass', 'my QR code', 'how do I get in?'. No inputs.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "search_books",
    description:
      "Search the catalogue by title, author or subject. Returns matching books with cover, floor, shelf and copies available. Always use it for book questions; never invent books or shelf locations.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Title, author or subject, e.g. 'Clean Code' or 'machine learning'." },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "find_rooms",
    description:
      "List study rooms that are free for a time slot. Returns each room's resource_id, name, floor, capacity and features. Call this before book_room. Rules: open 08:00-22:00, 30-minute steps, max 3 hours, up to 7 days ahead, never in the past.",
    input_schema: {
      type: "object",
      properties: {
        date: DATE,
        start_time: START_TIME,
        duration_minutes: duration(180),
        capacity: { type: "integer", minimum: 1, description: "Optional. Minimum number of people the room must fit." },
        features: {
          type: "array",
          items: { type: "string", enum: ["whiteboard", "screen", "power"] },
          description: "Optional. Features the room must have.",
        },
      },
      required: ["date", "start_time", "duration_minutes"],
      additionalProperties: false,
    },
  },
  {
    name: "book_room",
    description:
      "Book a study room. Needs the room_id from a find_rooms result (a UUID); never make one up. Book exactly what the student asked for.",
    input_schema: {
      type: "object",
      properties: {
        room_id: { type: "string", description: "resource_id of the room, taken from find_rooms." },
        starts_at: STARTS_AT,
        ends_at: ENDS_AT,
      },
      required: ["room_id", "starts_at", "ends_at"],
      additionalProperties: false,
    },
  },
  {
    name: "find_desks",
    description:
      "List study desks that are free for a time slot. Returns each desk's resource_id, name, floor, zone and features. Call this before book_desk. Rules: open 08:00-22:00, 30-minute steps, max 4 hours, up to 7 days ahead, never in the past.",
    input_schema: {
      type: "object",
      properties: {
        date: DATE,
        start_time: START_TIME,
        duration_minutes: duration(240),
        zone: { type: "string", enum: ["silent", "quiet", "group"], description: "Optional. Noise zone." },
        needs_power: { type: "boolean", description: "Optional. true if the desk must have a power socket." },
      },
      required: ["date", "start_time", "duration_minutes"],
      additionalProperties: false,
    },
  },
  {
    name: "book_desk",
    description:
      "Book a study desk. Needs the desk_id from a find_desks result (a UUID); never make one up. Book exactly what the student asked for.",
    input_schema: {
      type: "object",
      properties: {
        desk_id: { type: "string", description: "resource_id of the desk, taken from find_desks." },
        starts_at: STARTS_AT,
        ends_at: ENDS_AT,
      },
      required: ["desk_id", "starts_at", "ends_at"],
      additionalProperties: false,
    },
  },
  {
    name: "find_laptops",
    description:
      "List laptops available to borrow for a time slot. Laptops are same-day only, max 4 hours. Returns each laptop's resource_id, name and features. Call this before book_laptop.",
    input_schema: {
      type: "object",
      properties: {
        date: { ...DATE, description: "Today's date (YYYY-MM-DD). Laptops cannot be booked for another day." },
        start_time: START_TIME,
        duration_minutes: duration(240),
        os: { type: "string", enum: ["mac", "windows"], description: "Optional. Operating system." },
      },
      required: ["date", "start_time", "duration_minutes"],
      additionalProperties: false,
    },
  },
  {
    name: "book_laptop",
    description:
      "Loan a laptop for today. Needs the laptop_id from a find_laptops result (a UUID); never make one up. Same-day only, max 4 hours.",
    input_schema: {
      type: "object",
      properties: {
        laptop_id: { type: "string", description: "resource_id of the laptop, taken from find_laptops." },
        starts_at: STARTS_AT,
        ends_at: ENDS_AT,
      },
      required: ["laptop_id", "starts_at", "ends_at"],
      additionalProperties: false,
    },
  },
  {
    name: "get_my_bookings",
    description:
      "The student's upcoming bookings (rooms, desks, laptops). Use for 'what have I booked?' and to look up a booking_id before cancelling. No inputs.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "cancel_booking",
    description:
      "Cancel one of the student's bookings. Needs a booking_id from get_my_bookings or a booking card; never make one up. If several bookings could match, ask which one.",
    input_schema: {
      type: "object",
      properties: {
        booking_id: { type: "string", description: "The booking's UUID." },
      },
      required: ["booking_id"],
      additionalProperties: false,
    },
  },
] as const;
