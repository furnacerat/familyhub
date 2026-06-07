import { describe, expect, it } from "vitest";

import {
  createCalendarEventId,
  filterCalendarEvents,
  formatEventTime,
  getEventsForDate,
  getWeekDays,
  sortCalendarEvents,
  type CalendarEvent,
} from "@/lib/calendar-utils";

const events: CalendarEvent[] = [
  {
    id: "later",
    title: "Later",
    date: "2026-06-07",
    startTime: "17:00",
    person: "Avery",
    category: "sports",
  },
  {
    id: "first",
    title: "First",
    date: "2026-06-06",
    startTime: "08:00",
    person: "Mia",
    category: "school",
  },
  {
    id: "second",
    title: "Second",
    date: "2026-06-06",
    startTime: "09:00",
    person: "Mia",
    category: "appointment",
  },
];

describe("calendar utilities", () => {
  it("sorts events by date and start time", () => {
    expect(sortCalendarEvents(events).map((event) => event.id)).toEqual([
      "first",
      "second",
      "later",
    ]);
  });

  it("filters by person and category", () => {
    const filtered = filterCalendarEvents(events, {
      person: "Mia",
      category: "appointment",
    });

    expect(filtered.map((event) => event.id)).toEqual(["second"]);
  });

  it("returns events for one date", () => {
    expect(getEventsForDate(events, "2026-06-06")).toHaveLength(2);
  });

  it("builds a seven-day week from a start date", () => {
    const week = getWeekDays("2026-06-06");

    expect(week).toHaveLength(7);
    expect(week[0]).toMatchObject({ date: "2026-06-06", dayNumber: 6 });
    expect(week[6]).toMatchObject({ date: "2026-06-12", dayNumber: 12 });
  });

  it("formats start and end times", () => {
    expect(
      formatEventTime({
        ...events[0],
        startTime: "16:30",
        endTime: "17:45",
      }),
    ).toBe("4:30 PM - 5:45 PM");
  });

  it("creates stable event ids", () => {
    expect(
      createCalendarEventId({
        title: "Dentist Appointment",
        date: "2026-06-09",
        startTime: "15:15",
      }),
    ).toBe("2026-06-09-15-15-dentist-appointment");
  });
});
