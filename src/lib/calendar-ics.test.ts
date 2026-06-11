import { describe, expect, it } from "vitest";

import { createIcsCalendar, parseIcsEvents } from "@/lib/calendar-ics";

describe("calendar ICS utilities", () => {
  it("exports a standard calendar event", () => {
    const result = createIcsCalendar("Family Hub", [
      {
        id: "practice",
        title: "Soccer practice",
        date: "2026-06-12",
        startTime: "16:30",
        endTime: "17:30",
        person: "Avery",
        location: "Field 3",
        category: "sports",
      },
    ]);

    expect(result).toContain("BEGIN:VCALENDAR");
    expect(result).toContain("SUMMARY:Soccer practice");
    expect(result).toContain("DTSTART:20260612T163000");
  });

  it("imports and unfolds ICS event fields", () => {
    const result = parseIcsEvents(
      [
        "BEGIN:VCALENDAR",
        "BEGIN:VEVENT",
        "DTSTART:20260612T163000",
        "DTEND:20260612T173000",
        "SUMMARY:Soccer",
        "DESCRIPTION:Bring water",
        " bottle",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
    );

    expect(result).toEqual([
      expect.objectContaining({
        title: "Soccer",
        date: "2026-06-12",
        startTime: "16:30",
        endTime: "17:30",
        notes: "Bring waterbottle",
      }),
    ]);
  });
});
