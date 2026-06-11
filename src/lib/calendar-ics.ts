import type { CalendarEvent } from "@/lib/calendar-utils";

export function createIcsCalendar(
  householdName: string,
  events: CalendarEvent[],
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Family Hub//Family Calendar//EN",
    `X-WR-CALNAME:${escapeIcs(householdName)}`,
    "CALSCALE:GREGORIAN",
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@family-hub`,
      `DTSTAMP:${toUtcStamp(new Date())}`,
      `DTSTART:${toLocalStamp(event.date, event.startTime)}`,
      `DTEND:${toLocalStamp(event.date, event.endTime ?? event.startTime)}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `DESCRIPTION:${escapeIcs([event.person, event.notes].filter(Boolean).join(" - "))}`,
      event.location ? `LOCATION:${escapeIcs(event.location)}` : "",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

export function parseIcsEvents(source: string): Omit<CalendarEvent, "id">[] {
  const unfolded = source.replace(/\r?\n[ \t]/g, "");
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];

  return blocks.flatMap((block) => {
    const fields = new Map<string, string>();
    for (const line of block.split(/\r?\n/)) {
      const separator = line.indexOf(":");
      if (separator < 0) continue;
      const rawKey = line.slice(0, separator).split(";")[0];
      fields.set(rawKey, line.slice(separator + 1));
    }

    const title = fields.get("SUMMARY");
    const start = parseIcsDate(fields.get("DTSTART"));
    if (!title || !start) return [];
    const end = parseIcsDate(fields.get("DTEND"));

    return [
      {
        title: unescapeIcs(title),
        date: start.date,
        startTime: start.time,
        endTime: end?.time,
        person: "Family",
        location: fields.get("LOCATION")
          ? unescapeIcs(fields.get("LOCATION")!)
          : undefined,
        category: "other" as const,
        notes: fields.get("DESCRIPTION")
          ? unescapeIcs(fields.get("DESCRIPTION")!)
          : "Imported from external calendar",
      },
    ];
  });
}

function parseIcsDate(value?: string) {
  if (!value) return null;
  const normalized = value.replace(/Z$/, "");
  const date = normalized.slice(0, 8);
  if (!/^\d{8}$/.test(date)) return null;
  const time = normalized.slice(9, 13);
  return {
    date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
    time: /^\d{4}$/.test(time)
      ? `${time.slice(0, 2)}:${time.slice(2, 4)}`
      : "09:00",
  };
}

function toLocalStamp(date: string, time: string) {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
}

function toUtcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function unescapeIcs(value: string) {
  return value
    .replaceAll("\\n", "\n")
    .replaceAll("\\,", ",")
    .replaceAll("\\;", ";")
    .replaceAll("\\\\", "\\");
}
