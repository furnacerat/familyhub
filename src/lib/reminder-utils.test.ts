import { describe, expect, it } from "vitest";

import {
  completeReminder,
  createReminderId,
  filterReminders,
  getReminderStats,
  reopenReminder,
  removeReminder,
  sortReminders,
  type Reminder,
} from "@/lib/reminder-utils";

const today = "2026-06-06";

const reminders: Reminder[] = [
  {
    id: "later",
    title: "Later",
    dueDate: "2026-06-07",
    owner: "Avery",
    status: "open",
    priority: "low",
    createdAt: "2026-06-05T09:00:00",
  },
  {
    id: "urgent",
    title: "Urgent",
    dueDate: "2026-06-06",
    owner: "Mia",
    status: "open",
    priority: "high",
    createdAt: "2026-06-05T10:00:00",
  },
  {
    id: "done",
    title: "Done",
    dueDate: "2026-06-05",
    owner: "Jordan",
    status: "done",
    priority: "high",
    createdAt: "2026-06-04T10:00:00",
  },
  {
    id: "adult",
    title: "Needs signature",
    dueDate: "2026-06-12",
    owner: "Taylor",
    status: "needs-adult",
    priority: "normal",
    notes: "Parent signature",
    createdAt: "2026-06-05T11:00:00",
  },
];

describe("reminder utilities", () => {
  it("creates stable reminder ids", () => {
    expect(
      createReminderId({
        title: "Call Dentist",
        dueDate: "2026-06-07",
        createdAt: "2026-06-05T18:00:00",
      }),
    ).toBe("2026-06-07-2026-06-05t18-00-00-call-dentist");
  });

  it("sorts open reminders before completed reminders", () => {
    expect(sortReminders(reminders).map((reminder) => reminder.id)).toEqual([
      "urgent",
      "later",
      "adult",
      "done",
    ]);
  });

  it("filters by owner, status, due window, and search", () => {
    const filtered = filterReminders(
      reminders,
      {
        owner: "Taylor",
        status: "needs-adult",
        due: "week",
        search: "signature",
      },
      today,
    );

    expect(filtered.map((reminder) => reminder.id)).toEqual(["adult"]);
  });

  it("finds overdue reminders", () => {
    const filtered = filterReminders(
      reminders.map((reminder) =>
        reminder.id === "done" ? { ...reminder, status: "open" } : reminder,
      ),
      {
        owner: "all",
        status: "all",
        due: "overdue",
        search: "",
      },
      today,
    );

    expect(filtered.map((reminder) => reminder.id)).toEqual(["done"]);
  });

  it("completes and reopens reminders", () => {
    const completed = completeReminder(reminders, "urgent");
    expect(completed.find((reminder) => reminder.id === "urgent")?.status).toBe(
      "done",
    );

    const reopened = reopenReminder(completed, "urgent");
    expect(reopened.find((reminder) => reminder.id === "urgent")?.status).toBe(
      "open",
    );
  });

  it("removes reminders", () => {
    expect(removeReminder(reminders, "urgent").map((reminder) => reminder.id)).toEqual([
      "later",
      "done",
      "adult",
    ]);
  });

  it("calculates reminder stats", () => {
    expect(getReminderStats(reminders, today)).toEqual({
      total: 4,
      open: 3,
      done: 1,
      overdue: 0,
      needsAdult: 1,
    });
  });
});
