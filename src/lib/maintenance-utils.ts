export type MaintenanceCategory =
  | "home"
  | "vehicle"
  | "safety"
  | "appliance"
  | "yard"
  | "other";

export type MaintenanceCadenceUnit = "days" | "weeks" | "months" | "miles";
export type MaintenanceStatus = "overdue" | "due-soon" | "upcoming" | "complete";
export type MaintenanceStatusFilter = MaintenanceStatus | "all";

export type MaintenanceTask = {
  id: string;
  title: string;
  category: MaintenanceCategory;
  appliesTo: string;
  assignedTo: string;
  cadenceValue: number;
  cadenceUnit: MaintenanceCadenceUnit;
  lastCompletedDate?: string;
  nextDueDate?: string;
  lastCompletedMileage?: number;
  nextDueMileage?: number;
  currentMileage?: number;
  notes?: string;
  completedHistory: MaintenanceCompletion[];
};

export type MaintenanceCompletion = {
  id: string;
  completedAt: string;
  mileage?: number;
  note?: string;
};

export type MaintenanceFilters = {
  category: MaintenanceCategory | "all";
  status: MaintenanceStatusFilter;
  assignedTo: string;
  search: string;
};

export function createMaintenanceTaskId(title: string, appliesTo: string) {
  return `${appliesTo}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getMaintenanceStatus(
  task: MaintenanceTask,
  today: string,
): MaintenanceStatus {
  const dateStatus = getDateStatus(task, today);
  const mileageStatus = getMileageStatus(task);

  if (dateStatus === "overdue" || mileageStatus === "overdue") {
    return "overdue";
  }

  if (dateStatus === "due-soon" || mileageStatus === "due-soon") {
    return "due-soon";
  }

  return "upcoming";
}

export function sortMaintenanceTasks(
  tasks: MaintenanceTask[],
  today: string,
): MaintenanceTask[] {
  const rank: Record<MaintenanceStatus, number> = {
    overdue: 0,
    "due-soon": 1,
    upcoming: 2,
    complete: 3,
  };

  return [...tasks].sort((a, b) => {
    const statusCompare =
      rank[getMaintenanceStatus(a, today)] - rank[getMaintenanceStatus(b, today)];
    if (statusCompare !== 0) {
      return statusCompare;
    }

    return getNextDueSortValue(a) - getNextDueSortValue(b);
  });
}

export function filterMaintenanceTasks(
  tasks: MaintenanceTask[],
  filters: MaintenanceFilters,
  today: string,
) {
  const query = filters.search.trim().toLowerCase();

  return sortMaintenanceTasks(tasks, today).filter((task) => {
    const status = getMaintenanceStatus(task, today);
    const categoryMatches =
      filters.category === "all" || task.category === filters.category;
    const statusMatches = filters.status === "all" || status === filters.status;
    const assignedMatches =
      filters.assignedTo === "all" || task.assignedTo === filters.assignedTo;
    const searchMatches =
      !query ||
      task.title.toLowerCase().includes(query) ||
      task.appliesTo.toLowerCase().includes(query) ||
      task.notes?.toLowerCase().includes(query);

    return categoryMatches && statusMatches && assignedMatches && searchMatches;
  });
}

export function completeMaintenanceTask(
  tasks: MaintenanceTask[],
  taskId: string,
  completedAt: string,
  mileage?: number,
  note?: string,
) {
  return tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    const completion: MaintenanceCompletion = {
      id: `${taskId}-${completedAt}`,
      completedAt,
      mileage,
      note: note?.trim() || undefined,
    };
    const nextDueDate =
      task.cadenceUnit === "miles"
        ? task.nextDueDate
        : addCadence(completedAt, task.cadenceValue, task.cadenceUnit);
    const nextDueMileage =
      task.cadenceUnit === "miles" && mileage
        ? mileage + task.cadenceValue
        : task.nextDueMileage;

    return {
      ...task,
      lastCompletedDate: completedAt,
      lastCompletedMileage: mileage ?? task.lastCompletedMileage,
      currentMileage: mileage ?? task.currentMileage,
      nextDueDate,
      nextDueMileage,
      completedHistory: [completion, ...task.completedHistory],
    };
  });
}

export function addMaintenanceTask(tasks: MaintenanceTask[], task: MaintenanceTask) {
  return sortMaintenanceTasks([task, ...tasks], task.nextDueDate ?? "9999-12-31");
}

export function getMaintenanceStats(tasks: MaintenanceTask[], today: string) {
  const statuses = tasks.map((task) => getMaintenanceStatus(task, today));

  return {
    total: tasks.length,
    overdue: statuses.filter((status) => status === "overdue").length,
    dueSoon: statuses.filter((status) => status === "due-soon").length,
    upcoming: statuses.filter((status) => status === "upcoming").length,
  };
}

export function getUniqueMaintenanceAssignees(tasks: MaintenanceTask[]) {
  return Array.from(new Set(tasks.map((task) => task.assignedTo))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getCategoryLabel(category: MaintenanceCategory) {
  const labels: Record<MaintenanceCategory, string> = {
    home: "Home",
    vehicle: "Vehicle",
    safety: "Safety",
    appliance: "Appliance",
    yard: "Yard",
    other: "Other",
  };

  return labels[category];
}

export function formatMaintenanceDate(date?: string) {
  if (!date) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDate(date));
}

export function formatMileage(mileage?: number) {
  return typeof mileage === "number" ? `${mileage.toLocaleString()} mi` : "No mileage";
}

export function addCadence(
  date: string,
  value: number,
  unit: Exclude<MaintenanceCadenceUnit, "miles">,
) {
  const next = parseDate(date);

  if (unit === "days") {
    next.setDate(next.getDate() + value);
  }

  if (unit === "weeks") {
    next.setDate(next.getDate() + value * 7);
  }

  if (unit === "months") {
    next.setMonth(next.getMonth() + value);
  }

  return toIsoDate(next);
}

function getDateStatus(task: MaintenanceTask, today: string): MaintenanceStatus {
  if (!task.nextDueDate) {
    return "upcoming";
  }

  const dueDay = toDayNumber(task.nextDueDate);
  const todayDay = toDayNumber(today);

  if (dueDay < todayDay) {
    return "overdue";
  }

  if (dueDay <= todayDay + 14) {
    return "due-soon";
  }

  return "upcoming";
}

function getMileageStatus(task: MaintenanceTask): MaintenanceStatus {
  if (
    typeof task.currentMileage !== "number" ||
    typeof task.nextDueMileage !== "number"
  ) {
    return "upcoming";
  }

  const milesRemaining = task.nextDueMileage - task.currentMileage;

  if (milesRemaining <= 0) {
    return "overdue";
  }

  if (milesRemaining <= 500) {
    return "due-soon";
  }

  return "upcoming";
}

function getNextDueSortValue(task: MaintenanceTask) {
  const dateValue = task.nextDueDate ? toDayNumber(task.nextDueDate) : Infinity;
  const mileageValue =
    typeof task.currentMileage === "number" && typeof task.nextDueMileage === "number"
      ? task.nextDueMileage - task.currentMileage
      : Infinity;

  return Math.min(dateValue, mileageValue);
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDayNumber(date: string) {
  return Math.floor(Date.parse(`${date}T00:00:00.000Z`) / 86_400_000);
}
