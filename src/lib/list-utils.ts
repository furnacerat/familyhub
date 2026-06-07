export type HouseholdListType =
  | "groceries"
  | "hardware"
  | "school"
  | "packing"
  | "pharmacy"
  | "other";

export type HouseholdListItem = {
  id: string;
  name: string;
  list: HouseholdListType;
  addedBy: string;
  checked: boolean;
  quantity?: string;
  notes?: string;
  createdAt: string;
};

export type ListStatusFilter = "all" | "open" | "done";

export type ListFilters = {
  list: HouseholdListType | "all";
  status: ListStatusFilter;
  search: string;
};

export function createListItemId(
  item: Pick<HouseholdListItem, "name" | "list" | "createdAt">,
) {
  return `${item.list}-${item.createdAt}-${item.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function sortListItems(items: HouseholdListItem[]) {
  return [...items].sort((a, b) => {
    if (a.checked !== b.checked) {
      return a.checked ? 1 : -1;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function filterListItems(
  items: HouseholdListItem[],
  filters: ListFilters,
) {
  const query = filters.search.trim().toLowerCase();

  return sortListItems(items).filter((item) => {
    const listMatches = filters.list === "all" || item.list === filters.list;
    const statusMatches =
      filters.status === "all" ||
      (filters.status === "open" && !item.checked) ||
      (filters.status === "done" && item.checked);
    const searchMatches =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query) ||
      item.quantity?.toLowerCase().includes(query);

    return listMatches && statusMatches && searchMatches;
  });
}

export function toggleListItem(
  items: HouseholdListItem[],
  itemId: string,
): HouseholdListItem[] {
  return items.map((item) =>
    item.id === itemId ? { ...item, checked: !item.checked } : item,
  );
}

export function removeListItem(
  items: HouseholdListItem[],
  itemId: string,
): HouseholdListItem[] {
  return items.filter((item) => item.id !== itemId);
}

export function getListStats(items: HouseholdListItem[]) {
  const open = items.filter((item) => !item.checked).length;
  const done = items.length - open;

  return {
    total: items.length,
    open,
    done,
  };
}

export function groupItemsByList(items: HouseholdListItem[]) {
  return items.reduce(
    (groups, item) => {
      const group = groups[item.list] ?? [];
      group.push(item);
      groups[item.list] = group;
      return groups;
    },
    {} as Partial<Record<HouseholdListType, HouseholdListItem[]>>,
  );
}

export function getListLabel(list: HouseholdListType) {
  const labels: Record<HouseholdListType, string> = {
    groceries: "Groceries",
    hardware: "Hardware",
    school: "School",
    packing: "Packing",
    pharmacy: "Pharmacy",
    other: "Other",
  };

  return labels[list];
}
