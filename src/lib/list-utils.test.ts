import { describe, expect, it } from "vitest";

import {
  createListItemId,
  filterListItems,
  getListStats,
  groupItemsByList,
  removeListItem,
  toggleListItem,
  type HouseholdListItem,
} from "@/lib/list-utils";

const items: HouseholdListItem[] = [
  {
    id: "milk",
    name: "Milk",
    list: "groceries",
    addedBy: "Mia",
    checked: false,
    quantity: "1 gallon",
    createdAt: "2026-06-06T09:00:00",
  },
  {
    id: "batteries",
    name: "AA batteries",
    list: "hardware",
    addedBy: "Taylor",
    checked: false,
    notes: "For remotes",
    createdAt: "2026-06-06T10:00:00",
  },
  {
    id: "dog-food",
    name: "Dog food",
    list: "other",
    addedBy: "Avery",
    checked: true,
    createdAt: "2026-06-06T11:00:00",
  },
];

describe("list utilities", () => {
  it("creates stable item ids", () => {
    expect(
      createListItemId({
        name: "AA Batteries",
        list: "hardware",
        createdAt: "2026-06-06T10:00:00",
      }),
    ).toBe("hardware-2026-06-06t10-00-00-aa-batteries");
  });

  it("filters by list and status", () => {
    const filtered = filterListItems(items, {
      list: "hardware",
      status: "open",
      search: "",
    });

    expect(filtered.map((item) => item.id)).toEqual(["batteries"]);
  });

  it("searches name, quantity, and notes", () => {
    expect(
      filterListItems(items, {
        list: "all",
        status: "all",
        search: "gallon",
      }).map((item) => item.id),
    ).toEqual(["milk"]);

    expect(
      filterListItems(items, {
        list: "all",
        status: "all",
        search: "remote",
      }).map((item) => item.id),
    ).toEqual(["batteries"]);
  });

  it("toggles item completion", () => {
    const toggled = toggleListItem(items, "milk");

    expect(toggled.find((item) => item.id === "milk")?.checked).toBe(true);
  });

  it("removes items by id", () => {
    expect(removeListItem(items, "milk").map((item) => item.id)).toEqual([
      "batteries",
      "dog-food",
    ]);
  });

  it("counts open and completed items", () => {
    expect(getListStats(items)).toEqual({
      total: 3,
      open: 2,
      done: 1,
    });
  });

  it("groups items by list", () => {
    const groups = groupItemsByList(items);

    expect(groups.groceries?.map((item) => item.id)).toEqual(["milk"]);
    expect(groups.hardware?.map((item) => item.id)).toEqual(["batteries"]);
  });
});
