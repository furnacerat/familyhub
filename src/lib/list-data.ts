import type { HouseholdListItem, HouseholdListType } from "@/lib/list-utils";

export const listPeople = ["Family", "Jordan", "Taylor", "Avery", "Mia"];

export const householdLists: HouseholdListType[] = [
  "groceries",
  "hardware",
  "school",
  "packing",
  "pharmacy",
  "other",
];

export const initialListItems: HouseholdListItem[] = [
  {
    id: "groceries-2026-06-06-09-00-milk",
    name: "Milk",
    list: "groceries",
    addedBy: "Mia",
    checked: false,
    quantity: "1 gallon",
    createdAt: "2026-06-06T09:00:00",
  },
  {
    id: "other-2026-06-06-09-10-laundry-detergent",
    name: "Laundry detergent",
    list: "other",
    addedBy: "Jordan",
    checked: false,
    createdAt: "2026-06-06T09:10:00",
  },
  {
    id: "other-2026-06-06-09-15-dog-food",
    name: "Dog food",
    list: "other",
    addedBy: "Avery",
    checked: true,
    quantity: "Large bag",
    createdAt: "2026-06-06T09:15:00",
  },
  {
    id: "hardware-2026-06-06-10-00-aa-batteries",
    name: "AA batteries",
    list: "hardware",
    addedBy: "Taylor",
    checked: false,
    quantity: "8 pack",
    createdAt: "2026-06-06T10:00:00",
  },
  {
    id: "groceries-2026-06-06-10-20-apples",
    name: "Apples",
    list: "groceries",
    addedBy: "Mia",
    checked: false,
    quantity: "6",
    createdAt: "2026-06-06T10:20:00",
  },
  {
    id: "hardware-2026-06-06-11-00-air-filter",
    name: "Air filter",
    list: "hardware",
    addedBy: "Jordan",
    checked: false,
    notes: "Check furnace size before buying",
    createdAt: "2026-06-06T11:00:00",
  },
];
