export type CalendarEventCategory =
  | "school"
  | "sports"
  | "appointment"
  | "meal"
  | "errand"
  | "family"
  | "work"
  | "other";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  person: string;
  location?: string;
  category: CalendarEventCategory;
  notes?: string;
  requiresAdultApproval?: boolean;
};

export type CalendarFilters = {
  person: string;
  category: CalendarEventCategory | "all";
};

export function sortCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const dateCompare = toEventTime(a).getTime() - toEventTime(b).getTime();

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return a.title.localeCompare(b.title);
  });
}

export function filterCalendarEvents(
  events: CalendarEvent[],
  filters: CalendarFilters,
): CalendarEvent[] {
  return sortCalendarEvents(events).filter((event) => {
    const personMatches =
      filters.person === "all" || event.person === filters.person;
    const categoryMatches =
      filters.category === "all" || event.category === filters.category;

    return personMatches && categoryMatches;
  });
}

export function getEventsForDate(
  events: CalendarEvent[],
  date: string,
): CalendarEvent[] {
  return sortCalendarEvents(events).filter((event) => event.date === date);
}

export function getWeekDays(startDate: string, count = 7) {
  const start = parseDate(startDate);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const isoDate = toIsoDate(date);

    return {
      date: isoDate,
      dayLabel: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
        date,
      ),
      dateLabel: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(date),
      dayNumber: date.getDate(),
    };
  });
}

export function getUniquePeople(events: CalendarEvent[]): string[] {
  return Array.from(new Set(events.map((event) => event.person))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function formatEventTime(event: CalendarEvent): string {
  return event.endTime
    ? `${toDisplayTime(event.startTime)} - ${toDisplayTime(event.endTime)}`
    : toDisplayTime(event.startTime);
}

export function formatEventDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parseDate(date));
}

export function getCategoryLabel(category: CalendarEventCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function createCalendarEventId(event: Pick<CalendarEvent, "title" | "date" | "startTime">) {
  return `${event.date}-${event.startTime}-${event.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toEventTime(event: CalendarEvent): Date {
  return new Date(`${event.date}T${event.startTime}:00`);
}

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDisplayTime(time: string): string {
  const [hourValue, minute] = time.split(":").map(Number);
  const period = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;

  return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}
