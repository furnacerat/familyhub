"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Landmark, Plus } from "lucide-react";

import { createBill, createPaycheck } from "@/app/data-actions";
import { AllocationCard, BudgetCompanion } from "@/components/dashboard-sections";
import { PageHeader } from "@/components/page-header";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  createAllocationPlan,
  formatMoney,
  type Bill,
  type BillCategory,
  type BillPriority,
  type BudgetReserve,
  type Paycheck,
} from "@/lib/budget-engine";
import { getLocalIsoDate } from "@/lib/date-utils";
import { useHouseholdRealtime } from "@/hooks/use-household-realtime";

type BudgetWorkspaceProps = {
  householdId: string;
  initialPaychecks: Paycheck[];
  initialBills: Bill[];
  reserves: BudgetReserve[];
};

const realtimeTables = [
  "budget_paychecks",
  "budget_bills",
  "budget_reserves",
];

export function BudgetWorkspace({
  householdId,
  initialPaychecks,
  initialBills,
  reserves,
}: BudgetWorkspaceProps) {
  const router = useRouter();
  const paychecks = initialPaychecks;
  const bills = initialBills;
  const [paycheckOpen, setPaycheckOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  useHouseholdRealtime(householdId, realtimeTables);

  const plan = paychecks[0]
    ? createAllocationPlan({
        paycheck: paychecks[0],
        upcomingPaychecks: paychecks,
        bills,
        reserves,
        settings: { minimumBufferCents: 10_000, today: getLocalIsoDate() },
      })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Adult-only budget"
        title="Manual bills and paychecks first."
        description="A protected, explainable plan for household income and obligations."
        action="Add paycheck"
        onAction={() => setPaycheckOpen(true)}
      />
      {plan ? (
        <BudgetCompanion plan={plan} />
      ) : (
        <Card className="border-white/80 bg-white/84 shadow-sm">
          <CardHeader>
            <CardTitle>Add the next paycheck</CardTitle>
            <CardDescription>
              The allocation plan appears after income is entered.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      <section className="grid gap-4 xl:grid-cols-2">
        <MoneyList
          title="Upcoming paychecks"
          description="Income"
          onAdd={() => setPaycheckOpen(true)}
        >
          {paychecks.map((check) => (
            <MoneyRow
              key={check.id}
              icon={Banknote}
              tone="emerald"
              title={check.earner}
              detail={formatDate(check.payDate)}
              amount={formatMoney(check.amountCents)}
              badge={check.status}
            />
          ))}
        </MoneyList>
        <MoneyList
          title="Manual bill catalog"
          description="Bills"
          onAdd={() => setBillOpen(true)}
        >
          {bills.map((bill) => (
            <MoneyRow
              key={bill.id}
              icon={Landmark}
              tone="sky"
              title={bill.name}
              detail={`${formatCategory(bill.category)} - due ${formatDate(bill.dueDate)}`}
              amount={formatMoney(bill.amountCents)}
              badge={bill.paid ? "Paid" : bill.priority}
            />
          ))}
        </MoneyList>
      </section>
      {plan ? <AllocationCard plan={plan} /> : null}
      <PaycheckDialog
        open={paycheckOpen}
        onOpenChange={setPaycheckOpen}
        onSaved={() => router.refresh()}
      />
      <BillDialog
        open={billOpen}
        onOpenChange={setBillOpen}
        onSaved={() => router.refresh()}
      />
    </>
  );
}

function MoneyList({
  title,
  description,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardDescription>{description}</CardDescription>
          <CardTitle>{title}</CardTitle>
        </div>
        <Button size="icon" variant="outline" onClick={onAdd}>
          <Plus className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function MoneyRow({
  icon: Icon,
  tone,
  title,
  detail,
  amount,
  badge,
}: {
  icon: typeof Banknote;
  tone: "emerald" | "sky";
  title: string;
  detail: string;
  amount: string;
  badge: string;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[1fr_auto]">
      <div className="flex gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-lg ${
            tone === "emerald"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-sky-50 text-sky-700"
          }`}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
      </div>
      <div className="sm:text-right">
        <p className="text-lg font-semibold">{amount}</p>
        <Badge variant="secondary">{badge}</Badge>
      </div>
    </div>
  );
}

function PaycheckDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await createPaycheck({
      earner: String(data.get("earner") ?? "").trim(),
      amountCents: dollarsToCents(String(data.get("amount") ?? "")),
      payDate: String(data.get("payDate") ?? ""),
    });
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle>Add paycheck</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <Field id="earner" label="Earner" name="earner" />
            <Field id="paycheck-amount" label="Amount" name="amount" inputMode="decimal" />
            <Field id="pay-date" label="Pay date" name="payDate" type="date" />
          </div>
          <DialogFooter><Button type="submit">Save paycheck</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BillDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [category, setCategory] = useState<BillCategory>("utilities");
  const [priority, setPriority] = useState<BillPriority>("normal");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await createBill({
      name: String(data.get("name") ?? "").trim(),
      amountCents: dollarsToCents(String(data.get("amount") ?? "")),
      dueDate: String(data.get("dueDate") ?? ""),
      category,
      priority,
    });
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle>Add bill</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <Field id="bill-name" label="Name" name="name" />
            <Field id="bill-amount" label="Amount" name="amount" inputMode="decimal" />
            <Field id="due-date" label="Due date" name="dueDate" type="date" />
            <Choice
              label="Category"
              value={category}
              options={["housing", "utilities", "insurance", "debt", "food", "transportation", "childcare", "household", "other"]}
              onChange={(value) => setCategory(value as BillCategory)}
            />
            <Choice
              label="Priority"
              value={priority}
              options={["critical", "high", "normal", "low"]}
              onChange={(value) => setPriority(value as BillPriority)}
            />
          </div>
          <DialogFooter><Button type="submit">Save bill</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  ...props
}: React.ComponentProps<typeof Input> & { id: string; label: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} required {...props} />
    </div>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {formatCategory(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatCategory(category: string) {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function dollarsToCents(value: string) {
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
}
