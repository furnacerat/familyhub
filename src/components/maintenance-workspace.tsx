"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  CheckCircle2,
  Filter,
  Home,
  Plus,
  Search,
  ShieldCheck,
  Wrench,
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
import {
  completeMaintenance,
  createMaintenanceTask as persistMaintenanceTask,
} from "@/app/data-actions";
import { maintenanceCategories } from "@/lib/maintenance-data";
import {
  completeMaintenanceTask,
  filterMaintenanceTasks,
  formatMaintenanceDate,
  formatMileage,
  getCategoryLabel,
  getMaintenanceStats,
  getMaintenanceStatus,
  getUniqueMaintenanceAssignees,
  type MaintenanceCadenceUnit,
  type MaintenanceCategory,
  type MaintenanceStatus,
  type MaintenanceStatusFilter,
  type MaintenanceTask,
} from "@/lib/maintenance-utils";
import { useHouseholdRealtime } from "@/hooks/use-household-realtime";

type MaintenanceWorkspaceProps = {
  householdId: string;
  initialTasks: MaintenanceTask[];
  people: string[];
  today: string;
  canEdit: boolean;
};

type TaskFormState = {
  title: string;
  category: MaintenanceCategory;
  appliesTo: string;
  assignedTo: string;
  cadenceValue: string;
  cadenceUnit: MaintenanceCadenceUnit;
  nextDueDate: string;
  currentMileage: string;
  nextDueMileage: string;
  notes: string;
};

const realtimeTables = ["maintenance_tasks", "maintenance_completions"];

function getEmptyTaskForm(today: string): TaskFormState {
  return {
    title: "",
    category: "home",
    appliesTo: "",
    assignedTo: "Family",
    cadenceValue: "1",
    cadenceUnit: "months",
    nextDueDate: today,
    currentMileage: "",
    nextDueMileage: "",
    notes: "",
  };
}

export function MaintenanceWorkspace({
  householdId,
  initialTasks,
  people,
  today,
  canEdit,
}: MaintenanceWorkspaceProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [category, setCategory] = useState<MaintenanceCategory | "all">("all");
  const [status, setStatus] = useState<MaintenanceStatusFilter>("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [search, setSearch] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const [completeTask, setCompleteTask] = useState<MaintenanceTask | null>(null);
  const [completionMileage, setCompletionMileage] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [form, setForm] = useState(() => getEmptyTaskForm(today));

  const visibleTasks = filterMaintenanceTasks(
    tasks,
    { category, status, assignedTo, search },
    today,
  );
  const stats = getMaintenanceStats(tasks, today);
  const assignees = useMemo(
    () =>
      Array.from(
        new Set([...people, ...getUniqueMaintenanceAssignees(tasks)]),
      ).sort(),
    [people, tasks],
  );
  const nextTask = visibleTasks[0];

  useHouseholdRealtime(householdId, realtimeTables);

  function updateForm<K extends keyof TaskFormState>(
    key: K,
    value: TaskFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    const appliesTo = form.appliesTo.trim();
    const cadenceValue = Number(form.cadenceValue);

    if (!title || !appliesTo || !Number.isFinite(cadenceValue) || cadenceValue <= 0) {
      return;
    }

    const taskInput = {
      title,
      category: form.category,
      appliesTo,
      assignedTo: form.assignedTo,
      cadenceValue,
      cadenceUnit: form.cadenceUnit,
      nextDueDate: form.cadenceUnit === "miles" ? undefined : form.nextDueDate,
      currentMileage: parseOptionalNumber(form.currentMileage),
      nextDueMileage:
        form.cadenceUnit === "miles"
          ? parseOptionalNumber(form.nextDueMileage)
          : undefined,
      notes: form.notes.trim() || undefined,
    };

    await persistMaintenanceTask(taskInput);
    setCategory(taskInput.category);
    setForm({
      ...getEmptyTaskForm(today),
      category: taskInput.category,
      assignedTo: taskInput.assignedTo,
    });
    setTaskOpen(false);
    router.refresh();
  }

  async function submitCompletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!completeTask) {
      return;
    }

    const mileage = parseOptionalNumber(completionMileage);
    setTasks((current) =>
      completeMaintenanceTask(current, completeTask.id, today, mileage, completionNote),
    );
    await completeMaintenance({
      taskId: completeTask.id,
      completedAt: today,
      mileage,
      note: completionNote,
      cadenceValue: completeTask.cadenceValue,
      cadenceUnit: completeTask.cadenceUnit,
    });
    setCompleteTask(null);
    setCompletionMileage("");
    setCompletionNote("");
    router.refresh();
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-lg border border-white/80 bg-white/84 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-3 rounded-md">
            Home maintenance
          </Badge>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Oil changes, filters, and household upkeep.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Track recurring home and vehicle tasks by date or mileage, assign
            ownership, and keep a completion history.
          </p>
        </div>
        {canEdit ? (
          <AddTaskDialog
            form={form}
            open={taskOpen}
            onOpenChange={setTaskOpen}
            onSubmit={submitTask}
            onUpdate={updateForm}
            people={people}
          />
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-4">
          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Wrench className="size-5" />
              </div>
              <CardDescription>Maintenance status</CardDescription>
              <CardTitle>{stats.overdue + stats.dueSoon} need attention</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <StatTile label="Overdue" value={stats.overdue} />
              <StatTile label="Due soon" value={stats.dueSoon} />
              <StatTile label="Upcoming" value={stats.upcoming} />
              <StatTile label="Total" value={stats.total} />
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Filter className="size-5" />
              </div>
              <CardDescription>Filters</CardDescription>
              <CardTitle>Find the right task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search maintenance"
                />
              </div>
              <Select
                value={category}
                onValueChange={(value) =>
                  setCategory(value as MaintenanceCategory | "all")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {maintenanceCategories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {getCategoryLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as MaintenanceStatusFilter)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="due-soon">Due soon</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Anyone</SelectItem>
                  {assignees.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-slate-950 text-white shadow-sm">
            <CardHeader>
              <CardDescription className="text-slate-300">
                Next maintenance action
              </CardDescription>
              <CardTitle>{nextTask?.title ?? "Nothing found"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              {nextTask ? (
                <>
                  <p>{nextTask.appliesTo}</p>
                  <p>{getStatusLabel(getMaintenanceStatus(nextTask, today))}</p>
                  <p>
                    {nextTask.cadenceUnit === "miles"
                      ? `Due at ${formatMileage(nextTask.nextDueMileage)}`
                      : `Due ${formatMaintenanceDate(nextTask.nextDueDate)}`}
                  </p>
                </>
              ) : (
                <p>Adjust filters or add a new maintenance task.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>{visibleTasks.length} visible tasks</CardDescription>
              <CardTitle>Maintenance tracker</CardTitle>
            </div>
            {canEdit ? (
              <Button size="icon" variant="outline" onClick={() => setTaskOpen(true)}>
                <Plus className="size-4" />
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleTasks.map((task) => (
              <MaintenanceRow
                key={task.id}
                task={task}
                status={getMaintenanceStatus(task, today)}
                onComplete={canEdit ? () => {
                  setCompleteTask(task);
                  setCompletionMileage(
                    typeof task.currentMileage === "number"
                      ? String(task.currentMileage)
                      : "",
                  );
                } : undefined}
              />
            ))}
          </CardContent>
        </Card>
      </section>

      <CompleteTaskDialog
        task={completeTask}
        mileage={completionMileage}
        note={completionNote}
        onMileageChange={setCompletionMileage}
        onNoteChange={setCompletionNote}
        onOpenChange={(open) => {
          if (!open) {
            setCompleteTask(null);
          }
        }}
        onSubmit={submitCompletion}
      />
    </>
  );
}

function AddTaskDialog({
  form,
  open,
  onOpenChange,
  onSubmit,
  onUpdate,
  people,
}: {
  form: TaskFormState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onUpdate: <K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) => void;
  people: string[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add maintenance task</DialogTitle>
            <DialogDescription>
              Tasks are shared with your household and update across devices.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Task</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(event) => onUpdate("title", event.target.value)}
                placeholder="Oil change, furnace filter, detector test"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="task-applies">Applies to</Label>
                <Input
                  id="task-applies"
                  value={form.appliesTo}
                  onChange={(event) => onUpdate("appliesTo", event.target.value)}
                  placeholder="House, Family van, Fridge"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Assigned to</Label>
                <Select
                  value={form.assignedTo}
                  onValueChange={(value) => onUpdate("assignedTo", value)}
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
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    onUpdate("category", value as MaintenanceCategory)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceCategories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {getCategoryLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cadence-value">Every</Label>
                <Input
                  id="cadence-value"
                  inputMode="numeric"
                  value={form.cadenceValue}
                  onChange={(event) => onUpdate("cadenceValue", event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Unit</Label>
                <Select
                  value={form.cadenceUnit}
                  onValueChange={(value) =>
                    onUpdate("cadenceUnit", value as MaintenanceCadenceUnit)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="miles">Miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.cadenceUnit === "miles" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="current-mileage">Current mileage</Label>
                  <Input
                    id="current-mileage"
                    inputMode="numeric"
                    value={form.currentMileage}
                    onChange={(event) =>
                      onUpdate("currentMileage", event.target.value)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="next-mileage">Next due mileage</Label>
                  <Input
                    id="next-mileage"
                    inputMode="numeric"
                    value={form.nextDueMileage}
                    onChange={(event) =>
                      onUpdate("nextDueMileage", event.target.value)
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="next-due">Next due date</Label>
                <Input
                  id="next-due"
                  type="date"
                  value={form.nextDueDate}
                  onChange={(event) => onUpdate("nextDueDate", event.target.value)}
                  required
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="task-notes">Notes</Label>
              <Textarea
                id="task-notes"
                value={form.notes}
                onChange={(event) => onUpdate("notes", event.target.value)}
                placeholder="Parts, sizes, preferred shop, or anything useful"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CompleteTaskDialog({
  task,
  mileage,
  note,
  onMileageChange,
  onNoteChange,
  onOpenChange,
  onSubmit,
}: {
  task: MaintenanceTask | null;
  mileage: string;
  note: string;
  onMileageChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  return (
    <Dialog open={Boolean(task)} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Mark complete</DialogTitle>
            <DialogDescription>
              {task ? `Complete ${task.title} for ${task.appliesTo}.` : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {task?.cadenceUnit === "miles" ? (
              <div className="grid gap-2">
                <Label htmlFor="completion-mileage">Mileage</Label>
                <Input
                  id="completion-mileage"
                  inputMode="numeric"
                  value={mileage}
                  onChange={(event) => onMileageChange(event.target.value)}
                />
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="completion-note">Note</Label>
              <Textarea
                id="completion-note"
                value={note}
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="Optional completion note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Mark complete</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MaintenanceRow({
  task,
  status,
  onComplete,
}: {
  task: MaintenanceTask;
  status: MaintenanceStatus;
  onComplete?: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[1fr_auto]">
      <div className="flex gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
          {renderCategoryIcon(task.category)}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{task.title}</p>
            <Badge variant={getStatusVariant(status)}>{getStatusLabel(status)}</Badge>
            <Badge variant="secondary">{getCategoryLabel(task.category)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {task.appliesTo} - assigned to {task.assignedTo}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {task.cadenceUnit === "miles"
              ? `Current ${formatMileage(task.currentMileage)} - due ${formatMileage(
                  task.nextDueMileage,
                )}`
              : `Last done ${formatMaintenanceDate(
                  task.lastCompletedDate,
                )} - due ${formatMaintenanceDate(task.nextDueDate)}`}
          </p>
          {task.notes ? (
            <p className="mt-1 text-sm text-muted-foreground">{task.notes}</p>
          ) : null}
          {task.completedHistory[0] ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Last history entry: {formatMaintenanceDate(task.completedHistory[0].completedAt)}
            </p>
          ) : null}
        </div>
      </div>
      {onComplete ? (
        <Button variant="outline" onClick={onComplete}>
          <CheckCircle2 className="size-4" />
          Done
        </Button>
      ) : null}
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

function renderCategoryIcon(category: MaintenanceCategory) {
  if (category === "vehicle") {
    return <Car className="size-5" />;
  }

  if (category === "safety") {
    return <ShieldCheck className="size-5" />;
  }

  if (category === "home") {
    return <Home className="size-5" />;
  }

  return <Wrench className="size-5" />;
}

function getStatusLabel(status: MaintenanceStatus) {
  const labels: Record<MaintenanceStatus, string> = {
    overdue: "Overdue",
    "due-soon": "Due soon",
    upcoming: "Upcoming",
    complete: "Complete",
  };

  return labels[status];
}

function getStatusVariant(status: MaintenanceStatus) {
  if (status === "overdue") {
    return "destructive";
  }

  if (status === "due-soon") {
    return "outline";
  }

  return "secondary";
}

function parseOptionalNumber(value: string) {
  const numeric = Number(value.replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}
