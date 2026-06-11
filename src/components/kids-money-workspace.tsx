"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ClipboardCheck,
  Coins,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addSavingsToGoal,
  formatKidMoney,
  getGoalProgress,
  getKidStats,
  type KidProfile,
  type KidTransactionType,
} from "@/lib/kids-money-utils";
import {
  addKidMoney,
  approveKidChore,
  createKidResponsibility,
  createKidGoal,
  requestKidChore,
  returnKidChore,
  saveToKidGoal,
} from "@/app/data-actions";
import { useHouseholdRealtime } from "@/hooks/use-household-realtime";

type KidsMoneyWorkspaceProps = {
  householdId: string;
  initialKids: KidProfile[];
  canManage: boolean;
  viewMode: "parent" | "child";
};

type MoneyFormState = {
  type: KidTransactionType;
  amount: string;
  label: string;
};

type GoalFormState = {
  name: string;
  target: string;
};

type ResponsibilityFormState = {
  title: string;
  type: "family" | "paid-job";
  recurrence: "once" | "daily" | "weekly" | "monthly";
  reward: string;
  dueDate: string;
  dueTime: string;
};

const emptyMoneyForm: MoneyFormState = {
  type: "deposit",
  amount: "",
  label: "",
};

const emptyGoalForm: GoalFormState = {
  name: "",
  target: "",
};

const emptyResponsibilityForm: ResponsibilityFormState = {
  title: "",
  type: "family",
  recurrence: "weekly",
  reward: "",
  dueDate: "",
  dueTime: "",
};

const realtimeTables = [
  "kid_profiles",
  "kid_goals",
  "kid_chores",
  "kid_transactions",
];

export function KidsMoneyWorkspace({
  householdId,
  initialKids,
  canManage,
  viewMode,
}: KidsMoneyWorkspaceProps) {
  const router = useRouter();
  const [kids, setKids] = useState(initialKids);
  const [selectedKidId, setSelectedKidId] = useState(initialKids[0]?.id ?? "");
  const [moneyOpen, setMoneyOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [responsibilityOpen, setResponsibilityOpen] = useState(false);
  const [completionChoreId, setCompletionChoreId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [moneyForm, setMoneyForm] = useState(emptyMoneyForm);
  const [goalForm, setGoalForm] = useState(emptyGoalForm);
  const [responsibilityForm, setResponsibilityForm] = useState(
    emptyResponsibilityForm,
  );

  const selectedKid = useMemo(
    () => kids.find((kid) => kid.id === selectedKidId) ?? kids[0],
    [kids, selectedKidId],
  );

  useHouseholdRealtime(householdId, realtimeTables);

  if (!selectedKid) {
    return (
      <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>No child profiles yet</CardTitle>
          <CardDescription>
            Add and link child profiles from household settings.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const stats = getKidStats(selectedKid);

  async function submitMoney(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountCents = dollarsToCents(moneyForm.amount);
    const label = moneyForm.label.trim();

    if (!selectedKid || amountCents <= 0 || !label) {
      return;
    }

    if (moneyForm.type !== "deposit" && moneyForm.type !== "spend") {
      return;
    }

    await addKidMoney({
      kidId: selectedKid.id,
      type: moneyForm.type,
      amountCents,
      label,
    });
    setMoneyForm(emptyMoneyForm);
    setMoneyOpen(false);
    router.refresh();
  }

  async function submitGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetCents = dollarsToCents(goalForm.target);
    const name = goalForm.name.trim();

    if (!selectedKid || !name || targetCents <= 0) {
      return;
    }

    await createKidGoal({ kidId: selectedKid.id, name, targetCents });
    setGoalForm(emptyGoalForm);
    setGoalOpen(false);
    router.refresh();
  }

  async function submitResponsibility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = responsibilityForm.title.trim();
    if (!title) return;

    await createKidResponsibility({
      kidId: selectedKid.id,
      title,
      responsibilityType: responsibilityForm.type,
      recurrence: responsibilityForm.recurrence,
      rewardCents:
        responsibilityForm.type === "paid-job"
          ? dollarsToCents(responsibilityForm.reward)
          : 0,
      dueDate: responsibilityForm.dueDate || undefined,
      dueTime: responsibilityForm.dueTime || undefined,
    });
    setResponsibilityForm(emptyResponsibilityForm);
    setResponsibilityOpen(false);
    router.refresh();
  }

  async function submitCompletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!completionChoreId) return;
    await requestKidChore(selectedKid.id, completionChoreId, completionNote);
    setCompletionChoreId(null);
    setCompletionNote("");
    router.refresh();
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-lg border border-white/80 bg-white/84 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-3 rounded-md">
            {viewMode === "child" ? "My money and responsibilities" : "Family members"}
          </Badge>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            {viewMode === "child"
              ? "Your goals, earnings, and next steps."
              : "Age-aware independence with parent oversight."}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            {viewMode === "child"
              ? "See only your own information, request approvals, and manage your goals."
              : "Support each child without exposing the adult household budget."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {canManage ? (
            <>
              <MoneyDialog
                form={moneyForm}
                open={moneyOpen}
                onOpenChange={setMoneyOpen}
                onSubmit={submitMoney}
                onUpdate={(key, value) =>
                  setMoneyForm((current) => ({ ...current, [key]: value }))
                }
              />
              <GoalDialog
                form={goalForm}
                open={goalOpen}
                onOpenChange={setGoalOpen}
                onSubmit={submitGoal}
                onUpdate={(key, value) =>
                  setGoalForm((current) => ({ ...current, [key]: value }))
                }
              />
              <ResponsibilityDialog
                form={responsibilityForm}
                open={responsibilityOpen}
                onOpenChange={setResponsibilityOpen}
                onSubmit={submitResponsibility}
                onUpdate={(key, value) =>
                  setResponsibilityForm((current) => ({
                    ...current,
                    [key]: value,
                  }))
                }
              />
            </>
          ) : (
            <GoalDialog
              form={goalForm}
              open={goalOpen}
              onOpenChange={setGoalOpen}
              onSubmit={submitGoal}
              onUpdate={(key, value) =>
                setGoalForm((current) => ({ ...current, [key]: value }))
              }
            />
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-4">
          {viewMode === "parent" ? (
          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <CardDescription>Child profile</CardDescription>
              <CardTitle>Choose a dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedKid.id} onValueChange={setSelectedKidId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kids.map((kid) => (
                    <SelectItem key={kid.id} value={kid.id}>
                      {kid.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                {kids.map((kid) => (
                  <button
                    key={kid.id}
                    type="button"
                    onClick={() => setSelectedKidId(kid.id)}
                    className={`rounded-lg border border-border/70 bg-background/70 p-3 text-left transition hover:bg-muted ${
                      selectedKid.id === kid.id ? "border-primary bg-secondary" : ""
                    }`}
                  >
                    <p className="font-medium">{kid.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatKidMoney(kid.walletCents)}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          ) : null}

          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <PiggyBank className="size-5" />
              </div>
              <CardDescription>{selectedKid.name}</CardDescription>
              <CardTitle>Money snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <StatTile label="Wallet" value={formatKidMoney(selectedKid.walletCents)} />
              <StatTile label="Saved" value={formatKidMoney(stats.totalGoalSavedCents)} />
              <StatTile label="Allowance" value={formatKidMoney(selectedKid.allowanceCents)} />
              <StatTile label="Pending chores" value={String(stats.pendingChores)} />
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-slate-950 text-white shadow-sm">
            <CardHeader>
              <Sparkles className="mb-2 size-8 text-emerald-300" />
              <CardDescription className="text-slate-300">
                Next money moment
              </CardDescription>
              <CardTitle>{selectedKid.allowanceDay} allowance</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-300">
              {selectedKid.name} gets {formatKidMoney(selectedKid.allowanceCents)}{" "}
              on {selectedKid.allowanceDay}. Parent approval is still required
              for chores and manual money changes.
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <CardDescription>Goals</CardDescription>
              <CardTitle>Savings progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedKid.goals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-lg border border-border/70 bg-background/70 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{goal.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatKidMoney(goal.savedCents)} of{" "}
                        {formatKidMoney(goal.targetCents)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedKid.walletCents <= 0}
                      onClick={async () => {
                        setKids((current) =>
                          addSavingsToGoal(
                            current,
                            selectedKid.id,
                            goal.id,
                            Math.min(500, selectedKid.walletCents),
                          ),
                        );
                        await saveToKidGoal({
                          kidId: selectedKid.id,
                          goalId: goal.id,
                          amountCents: Math.min(500, selectedKid.walletCents),
                        });
                        router.refresh();
                      }}
                    >
                      Save $5
                    </Button>
                  </div>
                  <Progress value={getGoalProgress(goal)} className="mt-4" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {getGoalProgress(goal)}% complete
                  </p>
                </div>
              ))}
              {!selectedKid.goals.length ? (
                <EmptyState icon={Target} text="No savings goals yet." />
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <CardDescription>Chores</CardDescription>
              <CardTitle>Earn and approve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedKid.chores.map((chore) => (
                <div
                  key={chore.id}
                  className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{chore.title}</p>
                      <Badge variant={chore.status === "pending" ? "destructive" : "secondary"}>
                        {chore.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {chore.responsibilityType === "paid-job"
                        ? `Paid job - earns ${formatKidMoney(chore.rewardCents)}`
                        : "Family responsibility"}
                      {" - "}
                      {chore.recurrence}
                    </p>
                    {chore.dueDate ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Due {formatKidDate(chore.dueDate)}
                        {chore.dueTime ? ` at ${formatKidTime(chore.dueTime)}` : ""}
                      </p>
                    ) : null}
                    {chore.proofNote ? (
                      <p className="mt-2 rounded-md bg-muted p-2 text-sm">
                        Completion note: {chore.proofNote}
                      </p>
                    ) : null}
                    {chore.streakCount > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {chore.streakCount} approved completions
                      </p>
                    ) : null}
                  </div>
                  {chore.status === "available" ? (
                    <Button
                      variant="outline"
                      onClick={() => setCompletionChoreId(chore.id)}
                    >
                      Mark done
                    </Button>
                  ) : chore.status === "pending" && canManage ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          await returnKidChore(selectedKid.id, chore.id);
                          router.refresh();
                        }}
                      >
                        Send back
                      </Button>
                      <Button
                        onClick={async () => {
                          await approveKidChore(selectedKid.id, chore.id);
                          router.refresh();
                        }}
                      >
                        Approve
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="h-fit">
                      <CheckCircle2 className="size-3" />
                      Paid
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <CardDescription>History</CardDescription>
              <CardTitle>Recent money activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedKid.transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 p-3"
                >
                  <div>
                    <p className="font-medium">{transaction.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.type}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatKidMoney(transaction.amountCents)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
      <CompletionDialog
        open={Boolean(completionChoreId)}
        note={completionNote}
        onNoteChange={setCompletionNote}
        onOpenChange={(open) => {
          if (!open) setCompletionChoreId(null);
        }}
        onSubmit={submitCompletion}
      />
    </>
  );
}

function ResponsibilityDialog({
  form,
  open,
  onOpenChange,
  onSubmit,
  onUpdate,
}: {
  form: ResponsibilityFormState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onUpdate: <K extends keyof ResponsibilityFormState>(
    key: K,
    value: ResponsibilityFormState[K],
  ) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ClipboardCheck className="size-4" />
          Responsibility
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add responsibility</DialogTitle>
            <DialogDescription>
              Family responsibilities are unpaid. Optional paid jobs earn money
              after adult approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="responsibility-title">Title</Label>
              <Input
                id="responsibility-title"
                value={form.title}
                onChange={(event) => onUpdate("title", event.target.value)}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    onUpdate("type", value as ResponsibilityFormState["type"])
                  }
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family responsibility</SelectItem>
                    <SelectItem value="paid-job">Paid job</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Repeats</Label>
                <Select
                  value={form.recurrence}
                  onValueChange={(value) =>
                    onUpdate(
                      "recurrence",
                      value as ResponsibilityFormState["recurrence"],
                    )
                  }
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.type === "paid-job" ? (
              <div className="grid gap-2">
                <Label htmlFor="responsibility-reward">Reward</Label>
                <Input
                  id="responsibility-reward"
                  inputMode="decimal"
                  value={form.reward}
                  onChange={(event) => onUpdate("reward", event.target.value)}
                />
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="responsibility-date">Next due date</Label>
                <Input
                  id="responsibility-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => onUpdate("dueDate", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="responsibility-time">Due time</Label>
                <Input
                  id="responsibility-time"
                  type="time"
                  value={form.dueTime}
                  onChange={(event) => onUpdate("dueTime", event.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter><Button type="submit">Add responsibility</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CompletionDialog({
  open,
  note,
  onNoteChange,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  note: string;
  onNoteChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Mark responsibility done</DialogTitle>
            <DialogDescription>
              Add a short note when context would help the adult reviewing it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="completion-note">Completion note</Label>
            <Input
              id="completion-note"
              className="mt-2"
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Optional"
            />
          </div>
          <DialogFooter><Button type="submit">Request approval</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MoneyDialog({
  form,
  open,
  onOpenChange,
  onSubmit,
  onUpdate,
}: {
  form: MoneyFormState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onUpdate: <K extends keyof MoneyFormState>(key: K, value: MoneyFormState[K]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Coins className="size-4" />
          Money
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add money activity</DialogTitle>
            <DialogDescription>
              Record a parent-approved deposit or spending entry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  onUpdate("type", value as KidTransactionType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="spend">Spend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="money-amount">Amount</Label>
              <Input
                id="money-amount"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => onUpdate("amount", event.target.value)}
                placeholder="5.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="money-label">Label</Label>
              <Input
                id="money-label"
                value={form.label}
                onChange={(event) => onUpdate("label", event.target.value)}
                placeholder="Allowance, birthday money, toy purchase"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save activity</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalDialog({
  form,
  open,
  onOpenChange,
  onSubmit,
  onUpdate,
}: {
  form: GoalFormState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onUpdate: <K extends keyof GoalFormState>(key: K, value: GoalFormState[K]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Goal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add savings goal</DialogTitle>
            <DialogDescription>
              Create a simple target that a child can save toward.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="goal-name">Goal name</Label>
              <Input
                id="goal-name"
                value={form.name}
                onChange={(event) => onUpdate("name", event.target.value)}
                placeholder="Book, toy, sports gear"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-target">Target amount</Label>
              <Input
                id="goal-target"
                inputMode="decimal"
                value={form.target}
                onChange={(event) => onUpdate("target", event.target.value)}
                placeholder="25.00"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add goal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Target; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background/60 p-6 text-center">
      <Icon className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-3 font-medium">{text}</p>
    </div>
  );
}

function dollarsToCents(value: string) {
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.round(numeric * 100);
}

function formatKidDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatKidTime(time: string) {
  const [hourValue, minute] = time.split(":").map(Number);
  const period = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}
