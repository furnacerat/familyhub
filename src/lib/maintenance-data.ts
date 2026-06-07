import type { MaintenanceCategory, MaintenanceTask } from "@/lib/maintenance-utils";

export const maintenanceToday = "2026-06-06";

export const maintenancePeople = ["Family", "Jordan", "Taylor", "Avery", "Mia"];

export const maintenanceCategories: MaintenanceCategory[] = [
  "home",
  "vehicle",
  "safety",
  "appliance",
  "yard",
  "other",
];

export const initialMaintenanceTasks: MaintenanceTask[] = [
  {
    id: "house-furnace-filter",
    title: "Furnace filter",
    category: "home",
    appliesTo: "House",
    assignedTo: "Jordan",
    cadenceValue: 3,
    cadenceUnit: "months",
    lastCompletedDate: "2026-03-13",
    nextDueDate: "2026-06-13",
    notes: "Check filter size before buying replacements.",
    completedHistory: [
      {
        id: "house-furnace-filter-2026-03-13",
        completedAt: "2026-03-13",
      },
    ],
  },
  {
    id: "family-van-oil-change",
    title: "Oil change",
    category: "vehicle",
    appliesTo: "Family van",
    assignedTo: "Taylor",
    cadenceValue: 5000,
    cadenceUnit: "miles",
    lastCompletedDate: "2026-02-22",
    lastCompletedMileage: 151230,
    currentMileage: 156430,
    nextDueMileage: 156230,
    notes: "Use full synthetic.",
    completedHistory: [
      {
        id: "family-van-oil-change-2026-02-22",
        completedAt: "2026-02-22",
        mileage: 151230,
      },
    ],
  },
  {
    id: "house-smoke-detectors",
    title: "Smoke detector test",
    category: "safety",
    appliesTo: "Whole house",
    assignedTo: "Family",
    cadenceValue: 1,
    cadenceUnit: "months",
    lastCompletedDate: "2026-05-08",
    nextDueDate: "2026-06-08",
    completedHistory: [
      {
        id: "house-smoke-detectors-2026-05-08",
        completedAt: "2026-05-08",
      },
    ],
  },
  {
    id: "fridge-water-filter",
    title: "Water filter",
    category: "appliance",
    appliesTo: "Fridge",
    assignedTo: "Jordan",
    cadenceValue: 6,
    cadenceUnit: "months",
    lastCompletedDate: "2026-04-01",
    nextDueDate: "2026-10-01",
    completedHistory: [
      {
        id: "fridge-water-filter-2026-04-01",
        completedAt: "2026-04-01",
      },
    ],
  },
];
