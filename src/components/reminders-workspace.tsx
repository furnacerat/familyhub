"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Clock3,
  Filter,
  Plus,
  RotateCcw,
  Search,
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
import { reminderPeople, reminderToday } from "@/lib/reminder-data";
import {
  completeReminder,
  createReminderId,
  filterReminders,
  formatReminderDate,
  getReminderPriorityLabel,
  getReminderStats,
  getReminderStatusLabel,
  getUniqueReminderOwners,
  removeReminder,
  reopenReminder,
  type Reminder,
  type ReminderDueFilter,
  type ReminderPriority,
  type ReminderStatus,
  type ReminderStatusFilter,
} from "@/lib/reminder-utils";

type RemindersWorkspaceProps = {
  initialReminders: Reminder[];
};

type ReminderFormState = {
  title: string;
  dueDate: string;
  owner: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  notes: string;
};

const emptyForm: ReminderFormState = {
  title: "",
  dueDate: reminderToday,
  owner: "Family",
  priority: "normal",
  status: "open",
  notes: "",
};

export function RemindersWorkspace({ initialReminders }: RemindersWorkspaceProps) {
  const [reminders, setReminders] = useState(initialReminders);
  const [status, setStatus] = useState<ReminderStatusFilter>("open");
  const [due, setDue] = useState<ReminderDueFilter>("all");
  const [owner, setOwner] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ReminderFormState>(emptyForm);

  const owners = useMemo(() => getUniqueReminderOwners(reminders), [reminders]);
  const stats = getReminderStats(reminders, reminderToday);
  const visibleReminders = filterReminders(
    reminders,
    { status, due, owner, search },
    reminderToday,
  );
  const nextReminder = visibleReminders[0];

  function updateForm<K extends keyof ReminderFormState>(
    key: K,
    value: ReminderFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submitReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      return;
    }

    const createdAt = new Date().toISOString();
    const reminder: Reminder = {
      id: createReminderId({ title, dueDate: form.dueDate, createdAt }),
      title,
      dueDate: form.dueDate,
      owner: form.owner,
      priority: form.priority,
      status: form.status,
      notes: form.notes.trim() || undefined,
      createdAt,
    };

    setReminders((current) => [reminder, ...current]);
    setStatus("open");
    setOwner(reminder.owner);
    setForm({ ...emptyForm, owner: reminder.owner });
    setDialogOpen(false);
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-lg border border-white/80 bg-white/84 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-3 rounded-md">
            Family reminders
          </Badge>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Small things stay visible.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Keep one-off reminders separate from recurring maintenance, assign
            them to a person, and mark them done when the house catches up.
          </p>
        </div>
        <AddReminderDialog
          form={form}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={submitReminder}
          onUpdate={updateForm}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-4">
          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <BellRing className="size-5" />
              </div>
              <CardDescription>Reminder status</CardDescription>
              <CardTitle>{stats.open} open reminders</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <StatTile label="Open" value={stats.open} />
              <StatTile label="Done" value={stats.done} />
              <StatTile label="Overdue" value={stats.overdue} />
              <StatTile label="Needs adult" value={stats.needsAdult} />
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Filter className="size-5" />
              </div>
              <CardDescription>Filters</CardDescription>
              <CardTitle>Focus reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search reminders"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Select value={owner} onValueChange={setOwner}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    {owners.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as ReminderStatusFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="needs-adult">Needs adult</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="all">Everything</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={due}
                  onValueChange={(value) => setDue(value as ReminderDueFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any due date</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Next 7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-slate-950 text-white shadow-sm">
            <CardHeader>
              <CardDescription className="text-slate-300">
                Next reminder
              </CardDescription>
              <CardTitle>{nextReminder?.title ?? "Nothing found"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              {nextReminder ? (
                <>
                  <p>{formatReminderDate(nextReminder.dueDate)}</p>
                  <p>{nextReminder.owner}</p>
                  <p>{getReminderPriorityLabel(nextReminder.priority)} priority</p>
                </>
              ) : (
                <p>Adjust filters or add a new reminder.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>{visibleReminders.length} visible reminders</CardDescription>
              <CardTitle>Family reminders</CardTitle>
            </div>
            <Button size="icon" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleReminders.length ? (
              visibleReminders.map((reminder) => (
                <ReminderRow
                  key={reminder.id}
                  reminder={reminder}
                  onComplete={() =>
                    setReminders((current) => completeReminder(current, reminder.id))
                  }
                  onReopen={() =>
                    setReminders((current) => reopenReminder(current, reminder.id))
                  }
                  onRemove={() =>
                    setReminders((current) => removeReminder(current, reminder.id))
                  }
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-background/60 p-6 text-center">
                <Clock3 className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 font-medium">No reminders match this view.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add one or loosen the filters.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function AddReminderDialog({
  form,
  open,
  onOpenChange,
  onSubmit,
  onUpdate,
}: {
  form: ReminderFormState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: <K extends keyof ReminderFormState>(
    key: K,
    value: ReminderFormState[K],
  ) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add reminder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add reminder</DialogTitle>
            <DialogDescription>
              Reminders added here stay in this browser session until database
              persistence is added.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reminder-title">Title</Label>
              <Input
                id="reminder-title"
                value={form.title}
                onChange={(event) => onUpdate("title", event.target.value)}
                placeholder="Call dentist, return books, sign form"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="reminder-date">Due date</Label>
                <Input
                  id="reminder-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => onUpdate("dueDate", event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Owner</Label>
                <Select
                  value={form.owner}
                  onValueChange={(value) => onUpdate("owner", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderPeople.map((person) => (
                      <SelectItem key={person} value={person}>
                        {person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value) =>
                    onUpdate("priority", value as ReminderPriority)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    onUpdate("status", value as ReminderStatus)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="needs-adult">Needs adult</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reminder-notes">Notes</Label>
              <Textarea
                id="reminder-notes"
                value={form.notes}
                onChange={(event) => onUpdate("notes", event.target.value)}
                placeholder="Anything useful for whoever handles it"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add reminder</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReminderRow({
  reminder,
  onComplete,
  onReopen,
  onRemove,
}: {
  reminder: Reminder;
  onComplete: () => void;
  onReopen: () => void;
  onRemove: () => void;
}) {
  const isDone = reminder.status === "done";

  return (
    <div className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className={isDone ? "font-medium text-muted-foreground line-through" : "font-medium"}>
            {reminder.title}
          </p>
          <Badge variant={getStatusBadgeVariant(reminder.status)} className="rounded-md">
            {getReminderStatusLabel(reminder.status)}
          </Badge>
          <Badge
            variant={reminder.priority === "high" ? "destructive" : "outline"}
            className="rounded-md"
          >
            {getReminderPriorityLabel(reminder.priority)}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatReminderDate(reminder.dueDate)} - {reminder.owner}
        </p>
        {reminder.notes ? (
          <p className="mt-1 text-sm text-muted-foreground">{reminder.notes}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-1 sm:justify-end">
        {isDone ? (
          <Button size="icon" variant="outline" aria-label="Reopen reminder" onClick={onReopen}>
            <RotateCcw className="size-4" />
          </Button>
        ) : (
          <Button size="icon" variant="outline" aria-label="Complete reminder" onClick={onComplete}>
            <CheckCircle2 className="size-4" />
          </Button>
        )}
        <Button size="icon" variant="ghost" aria-label="Delete reminder" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
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

function getStatusBadgeVariant(status: ReminderStatus) {
  if (status === "needs-adult") {
    return "destructive";
  }

  if (status === "done") {
    return "secondary";
  }

  return "outline";
}
