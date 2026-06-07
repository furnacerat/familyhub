import { describe, expect, it } from "vitest";

import {
  addCadence,
  completeMaintenanceTask,
  filterMaintenanceTasks,
  getMaintenanceStats,
  getMaintenanceStatus,
  type MaintenanceTask,
} from "@/lib/maintenance-utils";

const today = "2026-06-06";

const tasks: MaintenanceTask[] = [
  {
    id: "overdue-mileage",
    title: "Oil change",
    category: "vehicle",
    appliesTo: "Van",
    assignedTo: "Taylor",
    cadenceValue: 5000,
    cadenceUnit: "miles",
    currentMileage: 156000,
    nextDueMileage: 155500,
    completedHistory: [],
  },
  {
    id: "due-soon-date",
    title: "Filter",
    category: "home",
    appliesTo: "House",
    assignedTo: "Jordan",
    cadenceValue: 3,
    cadenceUnit: "months",
    nextDueDate: "2026-06-12",
    completedHistory: [],
  },
  {
    id: "upcoming",
    title: "Water filter",
    category: "appliance",
    appliesTo: "Fridge",
    assignedTo: "Jordan",
    cadenceValue: 6,
    cadenceUnit: "months",
    nextDueDate: "2026-10-01",
    completedHistory: [],
  },
];

describe("maintenance utilities", () => {
  it("detects mileage overdue tasks", () => {
    expect(getMaintenanceStatus(tasks[0], today)).toBe("overdue");
  });

  it("detects date due soon tasks", () => {
    expect(getMaintenanceStatus(tasks[1], today)).toBe("due-soon");
  });

  it("filters by category, status, assignee, and search", () => {
    const filtered = filterMaintenanceTasks(
      tasks,
      {
        category: "home",
        status: "due-soon",
        assignedTo: "Jordan",
        search: "filter",
      },
      today,
    );

    expect(filtered.map((task) => task.id)).toEqual(["due-soon-date"]);
  });

  it("calculates stats", () => {
    expect(getMaintenanceStats(tasks, today)).toEqual({
      total: 3,
      overdue: 1,
      dueSoon: 1,
      upcoming: 1,
    });
  });

  it("adds date cadence", () => {
    expect(addCadence("2026-06-06", 3, "months")).toBe("2026-09-06");
    expect(addCadence("2026-06-06", 2, "weeks")).toBe("2026-06-20");
  });

  it("completes date tasks and calculates next due date", () => {
    const updated = completeMaintenanceTask(tasks, "due-soon-date", "2026-06-10");
    const task = updated.find((item) => item.id === "due-soon-date");

    expect(task).toMatchObject({
      lastCompletedDate: "2026-06-10",
      nextDueDate: "2026-09-10",
    });
    expect(task?.completedHistory).toHaveLength(1);
  });

  it("completes mileage tasks and calculates next mileage", () => {
    const updated = completeMaintenanceTask(
      tasks,
      "overdue-mileage",
      "2026-06-10",
      156500,
    );
    const task = updated.find((item) => item.id === "overdue-mileage");

    expect(task).toMatchObject({
      currentMileage: 156500,
      nextDueMileage: 161500,
    });
  });
});
