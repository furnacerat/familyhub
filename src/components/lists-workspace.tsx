"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Filter,
  ListChecks,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createListItem,
  deleteListItem,
  setListItemChecked,
} from "@/app/data-actions";
import { householdLists } from "@/lib/list-data";
import {
  filterListItems,
  getListLabel,
  getListStats,
  groupItemsByList,
  removeListItem,
  toggleListItem,
  type HouseholdListItem,
  type HouseholdListType,
  type ListStatusFilter,
} from "@/lib/list-utils";
import { useHouseholdRealtime } from "@/hooks/use-household-realtime";
import { cn } from "@/lib/utils";

type ListsWorkspaceProps = {
  householdId: string;
  initialItems: HouseholdListItem[];
  people: string[];
};

type ListFormState = {
  name: string;
  list: HouseholdListType;
  addedBy: string;
  quantity: string;
  notes: string;
};

const emptyForm: ListFormState = {
  name: "",
  list: "groceries",
  addedBy: "Family",
  quantity: "",
  notes: "",
};

const realtimeTables = ["household_lists", "list_items"];

export function ListsWorkspace({
  householdId,
  initialItems,
  people,
}: ListsWorkspaceProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [activeList, setActiveList] = useState<HouseholdListType | "all">("all");
  const [status, setStatus] = useState<ListStatusFilter>("open");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ListFormState>(emptyForm);

  const visibleItems = filterListItems(items, {
    list: activeList,
    status,
    search,
  });
  const stats = getListStats(items);
  const grouped = useMemo(() => groupItemsByList(items), [items]);

  useHouseholdRealtime(householdId, realtimeTables);

  function updateForm<K extends keyof ListFormState>(
    key: K,
    value: ListFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      return;
    }

    await createListItem({
      name,
      list: form.list,
      addedBy: form.addedBy,
      quantity: form.quantity.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    setActiveList(form.list);
    setStatus("open");
    setForm({ ...emptyForm, list: form.list, addedBy: form.addedBy });
    setDialogOpen(false);
    router.refresh();
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-lg border border-white/80 bg-white/84 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-3 rounded-md">
            Shared lists
          </Badge>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Household needs without the group-text scramble.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Add items, split them by list type, check things off, and keep
            errands easy for the whole family to scan.
          </p>
        </div>
        <AddItemDialog
          form={form}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={submitItem}
          onUpdate={updateForm}
          people={people}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-4">
          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <ShoppingCart className="size-5" />
              </div>
              <CardDescription>Family list status</CardDescription>
              <CardTitle>{stats.open} items left</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              <StatTile label="Total" value={stats.total} />
              <StatTile label="Open" value={stats.open} />
              <StatTile label="Done" value={stats.done} />
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Filter className="size-5" />
              </div>
              <CardDescription>Filters</CardDescription>
              <CardTitle>Find what matters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search list items"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Select
                  value={activeList}
                  onValueChange={(value) =>
                    setActiveList(value as HouseholdListType | "all")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All lists</SelectItem>
                    {householdLists.map((list) => (
                      <SelectItem key={list} value={list}>
                        {getListLabel(list)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as ListStatusFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open items</SelectItem>
                    <SelectItem value="done">Completed</SelectItem>
                    <SelectItem value="all">Everything</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <CardDescription>List types</CardDescription>
              <CardTitle>Quick switch</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveList("all")}
                className={cn(
                  "rounded-lg border border-border/70 bg-background/70 p-3 text-left text-sm font-medium transition hover:bg-muted",
                  activeList === "all" && "border-primary bg-secondary",
                )}
              >
                All lists
              </button>
              {householdLists.map((list) => (
                <button
                  key={list}
                  type="button"
                  onClick={() => setActiveList(list)}
                  className={cn(
                    "rounded-lg border border-border/70 bg-background/70 p-3 text-left text-sm font-medium transition hover:bg-muted",
                    activeList === list && "border-primary bg-secondary",
                  )}
                >
                  <span>{getListLabel(list)}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {grouped[list]?.filter((item) => !item.checked).length ?? 0}{" "}
                    open
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>{visibleItems.length} visible items</CardDescription>
              <CardTitle>Family lists</CardTitle>
            </div>
            <Button size="icon" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleItems.length ? (
              visibleItems.map((item) => (
                <ListItemRow
                  key={item.id}
                  item={item}
                  onRemove={async () => {
                    setItems((current) => removeListItem(current, item.id));
                    await deleteListItem(item.id);
                    router.refresh();
                  }}
                  onToggle={async () => {
                    setItems((current) => toggleListItem(current, item.id));
                    await setListItemChecked(item.id, !item.checked);
                    router.refresh();
                  }}
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-background/60 p-6 text-center">
                <ListChecks className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 font-medium">No items match this view.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add something new or clear the filters.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function AddItemDialog({
  form,
  open,
  onOpenChange,
  onSubmit,
  onUpdate,
  people,
}: {
  form: ListFormState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onUpdate: <K extends keyof ListFormState>(
    key: K,
    value: ListFormState[K],
  ) => void;
  people: string[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add list item</DialogTitle>
            <DialogDescription>
              Items are shared with your household and update across devices.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="item-name">Item</Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={(event) => onUpdate("name", event.target.value)}
                placeholder="Milk, batteries, permission slip"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>List</Label>
                <Select
                  value={form.list}
                  onValueChange={(value) =>
                    onUpdate("list", value as HouseholdListType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {householdLists.map((list) => (
                      <SelectItem key={list} value={list}>
                        {getListLabel(list)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Added by</Label>
                <Select
                  value={form.addedBy}
                  onValueChange={(value) => onUpdate("addedBy", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((person) => (
                      <SelectItem key={person} value={person}>
                        {person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-quantity">Quantity</Label>
              <Input
                id="item-quantity"
                value={form.quantity}
                onChange={(event) => onUpdate("quantity", event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-notes">Notes</Label>
              <Textarea
                id="item-notes"
                value={form.notes}
                onChange={(event) => onUpdate("notes", event.target.value)}
                placeholder="Brand, size, store, or anything helpful"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ListItemRow({
  item,
  onRemove,
  onToggle,
}: {
  item: HouseholdListItem;
  onRemove: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[auto_1fr_auto]">
      <Checkbox
        checked={item.checked}
        onCheckedChange={onToggle}
        aria-label={`Mark ${item.name} ${item.checked ? "open" : "done"}`}
        className="mt-1"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "font-medium",
              item.checked && "text-muted-foreground line-through",
            )}
          >
            {item.name}
          </p>
          <Badge variant="secondary" className="rounded-md">
            {getListLabel(item.list)}
          </Badge>
          {item.checked ? (
            <Badge variant="outline" className="rounded-md">
              <CheckCircle2 className="size-3" />
              Done
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Added by {item.addedBy}
          {item.quantity ? ` - ${item.quantity}` : ""}
        </p>
        {item.notes ? (
          <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
        ) : null}
      </div>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Remove ${item.name}`}
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
