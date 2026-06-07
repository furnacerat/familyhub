export type ReminderPriority = "low" | "normal" | "high";
export type ReminderStatus = "open" | "done" | "needs-adult";
export type ReminderStatusFilter = "all" | "open" | "done" | "needs-adult";
export type ReminderDueFilter = "all" | "overdue" | "today" | "week";

export type Reminder = {
  id: string;
  title: string;
  dueDate: string;
  owner: string;
  status: ReminderStatus;
  priority: ReminderPriority;
  notes?: string;
  createdAt: string;
};

export type ReminderFilters = {
  status: ReminderStatusFilter;
  due: ReminderDueFilter;
  owner: string;
  search: string;
};

const priorityRank: Record<ReminderPriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

export function createReminderId(
  reminder: Pick<Reminder, "title" | "dueDate" | "createdAt">,
) {
  return `${reminder.dueDate}-${reminder.createdAt}-${reminder.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function sortReminders(reminders: Reminder[]) {
  return [...reminders].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") {
      return 1;
    }

    if (a.status !== "done" && b.status === "done") {
      return -1;
    }

    const dateCompare = toDayNumber(a.dueDate) - toDayNumber(b.dueDate);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    const priorityCompare = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityCompare !== 0) {
      return priorityCompare;
    }

    return a.title.localeCompare(b.title);
  });
}

export function filterReminders(
  reminders: Reminder[],
  filters: ReminderFilters,
  today: string,
) {
  const query = filters.search.trim().toLowerCase();

  return sortReminders(reminders).filter((reminder) => {
    const statusMatches =
      filters.status === "all" || reminder.status === filters.status;
    const ownerMatches =
      filters.owner === "all" || reminder.owner === filters.owner;
    const dueMatches = matchesDueFilter(reminder, filters.due, today);
    const searchMatches =
      !query ||
      reminder.title.toLowerCase().includes(query) ||
      reminder.notes?.toLowerCase().includes(query);

    return statusMatches && ownerMatches && dueMatches && searchMatches;
  });
}

export function completeReminder(reminders: Reminder[], reminderId: string) {
  return reminders.map((reminder) =>
    reminder.id === reminderId ? { ...reminder, status: "done" as const } : reminder,
  );
}

export function reopenReminder(reminders: Reminder[], reminderId: string) {
  return reminders.map((reminder) =>
    reminder.id === reminderId ? { ...reminder, status: "open" as const } : reminder,
  );
}

export function removeReminder(reminders: Reminder[], reminderId: string) {
  return reminders.filter((reminder) => reminder.id !== reminderId);
}

export function getReminderStats(reminders: Reminder[], today: string) {
  const open = reminders.filter((reminder) => reminder.status !== "done").length;
  const done = reminders.length - open;
  const overdue = reminders.filter(
    (reminder) => reminder.status !== "done" && toDayNumber(reminder.dueDate) < toDayNumber(today),
  ).length;
  const needsAdult = reminders.filter(
    (reminder) => reminder.status === "needs-adult",
  ).length;

  return {
    total: reminders.length,
    open,
    done,
    overdue,
    needsAdult,
  };
}

export function getUniqueReminderOwners(reminders: Reminder[]) {
  return Array.from(new Set(reminders.map((reminder) => reminder.owner))).sort(
    (a, b) => a.localeCompare(b),
  );
}

export function formatReminderDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDate(date));
}

export function getReminderStatusLabel(status: ReminderStatus) {
  const labels: Record<ReminderStatus, string> = {
    open: "Open",
    done: "Done",
    "needs-adult": "Needs adult",
  };

  return labels[status];
}

export function getReminderPriorityLabel(priority: ReminderPriority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function matchesDueFilter(
  reminder: Reminder,
  filter: ReminderDueFilter,
  today: string,
) {
  if (filter === "all") {
    return true;
  }

  const reminderDay = toDayNumber(reminder.dueDate);
  const todayDay = toDayNumber(today);

  if (filter === "overdue") {
    return reminder.status !== "done" && reminderDay < todayDay;
  }

  if (filter === "today") {
    return reminderDay === todayDay;
  }

  return reminderDay >= todayDay && reminderDay <= todayDay + 7;
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function toDayNumber(date: string) {
  return Math.floor(Date.parse(`${date}T00:00:00.000Z`) / 86_400_000);
}
