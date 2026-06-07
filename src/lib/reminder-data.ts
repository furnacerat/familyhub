import type { Reminder } from "@/lib/reminder-utils";

export const reminderPeople = ["Family", "Jordan", "Taylor", "Avery", "Mia"];

export const reminderToday = "2026-06-06";

export const initialReminders: Reminder[] = [
  {
    id: "return-library-books",
    title: "Return library books",
    dueDate: "2026-06-06",
    owner: "Mia",
    status: "open",
    priority: "normal",
    createdAt: "2026-06-05T17:00:00",
  },
  {
    id: "call-dentist",
    title: "Call dentist",
    dueDate: "2026-06-07",
    owner: "Jordan",
    status: "open",
    priority: "high",
    createdAt: "2026-06-05T18:00:00",
  },
  {
    id: "permission-slip",
    title: "Permission slip",
    dueDate: "2026-06-12",
    owner: "Taylor",
    status: "needs-adult",
    priority: "high",
    notes: "Needs parent signature before Friday.",
    createdAt: "2026-06-05T19:00:00",
  },
  {
    id: "pack-practice-bag",
    title: "Pack practice bag",
    dueDate: "2026-06-06",
    owner: "Avery",
    status: "open",
    priority: "normal",
    createdAt: "2026-06-06T07:00:00",
  },
  {
    id: "return-movie",
    title: "Return movie rental",
    dueDate: "2026-06-04",
    owner: "Family",
    status: "open",
    priority: "low",
    createdAt: "2026-06-03T16:00:00",
  },
];
