"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
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
  addKidGoal,
  addKidTransaction,
  addSavingsToGoal,
  approveChore,
  formatKidMoney,
  getGoalProgress,
  getKidStats,
  requestChoreApproval,
  type KidProfile,
  type KidTransactionType,
} from "@/lib/kids-money-utils";

type KidsMoneyWorkspaceProps = {
  initialKids: KidProfile[];
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

const emptyMoneyForm: MoneyFormState = {
  type: "deposit",
  amount: "",
  label: "",
};

const emptyGoalForm: GoalFormState = {
  name: "",
  target: "",
};

export function KidsMoneyWorkspace({ initialKids }: KidsMoneyWorkspaceProps) {
  const [kids, setKids] = useState(initialKids);
  const [selectedKidId, setSelectedKidId] = useState(initialKids[0]?.id ?? "");
  const [moneyOpen, setMoneyOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [moneyForm, setMoneyForm] = useState(emptyMoneyForm);
  const [goalForm, setGoalForm] = useState(emptyGoalForm);

  const selectedKid = useMemo(
    () => kids.find((kid) => kid.id === selectedKidId) ?? kids[0],
    [kids, selectedKidId],
  );

  if (!selectedKid) {
    return null;
  }

  const stats = getKidStats(selectedKid);

  function submitMoney(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountCents = dollarsToCents(moneyForm.amount);
    const label = moneyForm.label.trim();

    if (!selectedKid || amountCents <= 0 || !label) {
      return;
    }

    setKids((current) =>
      addKidTransaction(current, selectedKid.id, {
        type: moneyForm.type,
        amountCents,
        label,
      }),
    );
    setMoneyForm(emptyMoneyForm);
    setMoneyOpen(false);
  }

  function submitGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetCents = dollarsToCents(goalForm.target);
    const name = goalForm.name.trim();

    if (!selectedKid || !name || targetCents <= 0) {
      return;
    }

    setKids((current) =>
      addKidGoal(current, selectedKid.id, {
        name,
        targetCents,
      }),
    );
    setGoalForm(emptyGoalForm);
    setGoalOpen(false);
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-lg border border-white/80 bg-white/84 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-3 rounded-md">
            Kid-friendly budgeting
          </Badge>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Money habits they can understand.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Track wallet money, savings goals, allowance, chores, and spending
            without exposing the adult household budget.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
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
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-4">
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
                      onClick={() =>
                        setKids((current) =>
                          addSavingsToGoal(
                            current,
                            selectedKid.id,
                            goal.id,
                            Math.min(500, selectedKid.walletCents),
                          ),
                        )
                      }
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
                      Earns {formatKidMoney(chore.rewardCents)}
                    </p>
                  </div>
                  {chore.status === "available" ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        setKids((current) =>
                          requestChoreApproval(current, selectedKid.id, chore.id),
                        )
                      }
                    >
                      Request
                    </Button>
                  ) : chore.status === "pending" ? (
                    <Button
                      onClick={() =>
                        setKids((current) =>
                          approveChore(current, selectedKid.id, chore.id),
                        )
                      }
                    >
                      Approve
                    </Button>
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
    </>
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
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
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
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
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
