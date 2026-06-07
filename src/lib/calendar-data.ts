import type { CalendarEvent } from "@/lib/calendar-utils";

export const calendarPeople = ["Family", "Jordan", "Taylor", "Avery", "Mia"];

export const calendarCategories = [
  "school",
  "sports",
  "appointment",
  "meal",
  "errand",
  "family",
  "work",
  "other",
] as const;

export const initialCalendarEvents: CalendarEvent[] = [
  {
    id: "school-dropoff-2026-06-06",
    title: "School drop-off",
    date: "2026-06-06",
    startTime: "07:45",
    person: "Family",
    location: "Elementary entrance",
    category: "school",
  },
  {
    id: "practice-2026-06-06",
    title: "Practice",
    date: "2026-06-06",
    startTime: "16:30",
    endTime: "17:45",
    person: "Avery",
    location: "Field 3",
    category: "sports",
  },
  {
    id: "dinner-prep-2026-06-06",
    title: "Dinner prep",
    date: "2026-06-06",
    startTime: "18:15",
    person: "Jordan",
    location: "Home",
    category: "meal",
  },
  {
    id: "grocery-pickup-2026-06-07",
    title: "Grocery pickup",
    date: "2026-06-07",
    startTime: "10:00",
    person: "Taylor",
    location: "Market",
    category: "errand",
  },
  {
    id: "dentist-2026-06-09",
    title: "Dentist appointment",
    date: "2026-06-09",
    startTime: "15:15",
    endTime: "16:00",
    person: "Mia",
    location: "Main Street Dental",
    category: "appointment",
    requiresAdultApproval: true,
  },
];
