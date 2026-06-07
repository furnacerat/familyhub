import {
  AlertCircle,
  ArrowRight,
  CalendarPlus,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Plus,
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
import { Progress } from "@/components/ui/progress";
import {
  formatMoney,
  getAllocationSummary,
  type AllocationItem,
} from "@/lib/budget-engine";
import { sampleAllocationPlan } from "@/lib/budget-sample-data";
import {
  buildSteps,
  householdStats,
  kidsMoney,
  maintenanceTasks,
  reminders,
  shoppingItems,
  todaysSchedule,
} from "@/lib/family-data";

export function HomeDashboard() {
  return (
    <>
      <HeroPanel />
      <OverviewGrid />
      <BudgetCompanion />
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <KidsMoneySummary />
        <HomeMaintenanceSummary />
      </div>
      <BuildRoadmap />
    </>
  );
}

export function HeroPanel() {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden border-white/80 bg-white/84 shadow-sm backdrop-blur">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-md">
              Saturday, Jun 6
            </Badge>
            <Badge className="rounded-md bg-emerald-600 text-white">
              Calm day
            </Badge>
          </div>
          <CardTitle className="text-3xl leading-tight sm:text-4xl">
            Your household at a glance.
          </CardTitle>
          <CardDescription className="max-w-2xl text-base">
            Calendar, errands, reminders, maintenance, and private money tools
            in one mobile-first workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {householdStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border/70 bg-background/70 p-3"
            >
              <stat.icon className="mb-3 size-5 text-sky-700" />
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.helper}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-white/80 bg-slate-950 text-white shadow-sm">
        <CardHeader>
          <CardDescription className="text-slate-300">
            Next best action
          </CardDescription>
          <CardTitle className="text-2xl">Pay Electric first</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-300">
            It is due before the next paycheck and has late fee risk. The
            current plan keeps groceries, gas, and core bills protected.
          </p>
          <Button className="mt-5 w-full bg-white text-slate-950 hover:bg-slate-100">
            Review plan
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

export function OverviewGrid() {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardDescription>Shared calendar</CardDescription>
            <CardTitle>Today</CardTitle>
          </div>
          <Button size="icon" variant="outline" aria-label="Add calendar event">
            <CalendarPlus className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysSchedule.slice(0, 3).map((event) => (
            <div
              key={event.title}
              className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/70 p-3"
            >
              <span className={`size-2 rounded-full ${event.color}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {event.time} - {event.person}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardDescription>Shopping list</CardDescription>
            <CardTitle>House needs</CardTitle>
          </div>
          <Button size="icon" variant="outline" aria-label="Add shopping item">
            <Plus className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {shoppingItems.slice(0, 4).map((item) => (
            <label
              key={item.name}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/70 bg-background/70 p-3"
            >
              <Checkbox checked={item.checked} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.name}</span>
                <span className="text-sm text-muted-foreground">
                  {item.area}
                </span>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
        <CardHeader>
          <CardDescription>Reminders</CardDescription>
          <CardTitle>Needs attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reminders.slice(0, 3).map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/70 p-3"
            >
              <Clock3 className="size-4 text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.due} - {item.owner}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

export function BudgetCompanion() {
  const plan = sampleAllocationPlan;
  const summary = getAllocationSummary(plan);
  const cashFlow = [
    {
      label: "Income",
      value: plan.startingCents,
      color: "bg-emerald-500",
    },
    {
      label: "Allocated",
      value: plan.allocatedCents,
      color: "bg-sky-500",
    },
    {
      label: "Buffer",
      value: plan.bufferCents,
      color: "bg-amber-500",
    },
    {
      label: "Flexible",
      value: plan.flexibleCents,
      color: "bg-rose-500",
    },
  ];
  const total = cashFlow.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-slate-900 bg-slate-950 text-white shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardDescription className="text-slate-300">
                Adult budget companion
              </CardDescription>
              <CardTitle className="text-3xl">
                {formatMoney(plan.startingCents)}
              </CardTitle>
            </div>
            <Badge className="rounded-md bg-sky-500 text-white">
              {formatDate(plan.paycheck.payDate)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-sm text-slate-300">Covered</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatMoney(plan.allocatedCents)}
              </p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-sm text-slate-300">Flexible</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatMoney(plan.flexibleCents)}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-white/10 p-3 text-sm text-slate-300">
            {summary.hasShortfall
              ? `${summary.partialItems + summary.unfundedItems} items need another plan.`
              : `${summary.fundedBills} bills are covered before the next paycheck.`}
          </div>
          <div className="space-y-3">
            {cashFlow.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{item.label}</span>
                  <span>{formatMoney(item.value)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full ${item.color}`}
                    style={{
                      width: `${Math.max((item.value / total) * 100, 8)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AllocationCard />
    </section>
  );
}

export function AllocationCard() {
  const plan = sampleAllocationPlan;

  return (
    <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardDescription>Recommended allocation</CardDescription>
          <CardTitle>What this check should cover</CardTitle>
        </div>
        <Button variant="outline">
          Adjust
          <CircleDollarSign className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {plan.items.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[1fr_auto]"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{item.name}</p>
                <Badge
                  variant={getAllocationBadgeVariant(item)}
                  className="rounded-md"
                >
                  {item.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.reason}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-lg font-semibold">
                {formatMoney(item.allocatedCents)}
              </p>
              <p className="text-sm text-muted-foreground">
                {item.dueDate ? formatDate(item.dueDate) : formatMoney(item.requestedCents)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getAllocationBadgeVariant(item: AllocationItem) {
  if (item.status === "unfunded" || item.status === "partial") {
    return "destructive";
  }

  if (item.status === "held") {
    return "outline";
  }

  return "secondary";
}

export function KidsMoneySummary() {
  return (
    <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
      <CardHeader>
        <CardDescription>Kids money</CardDescription>
        <CardTitle>Goals and balances</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {kidsMoney.map((kid) => {
          const percent = Math.round((kid.saved / kid.target) * 100);

          return (
            <div
              key={kid.name}
              className="rounded-lg border border-border/70 bg-background/70 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{kid.name}</p>
                  <p className="text-sm text-muted-foreground">{kid.goal}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{kid.balance}</p>
                  <p className="text-xs text-muted-foreground">wallet</p>
                </div>
              </div>
              <Progress value={percent} className="mt-4" />
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>
                  ${kid.saved} of ${kid.target}
                </span>
                <span className="text-muted-foreground">{kid.next}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function HomeMaintenanceSummary() {
  return (
    <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
      <CardHeader>
        <CardDescription>Home maintenance</CardDescription>
        <CardTitle>Due soon</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {maintenanceTasks.map((task) => (
          <div
            key={task.title}
            className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/70 p-3"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <task.icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{task.title}</p>
                {task.due.includes("Overdue") ? (
                  <Badge className="rounded-md bg-rose-600 text-white">
                    <AlertCircle className="size-3" />
                    Overdue
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {task.appliesTo} - {task.cadence}
              </p>
            </div>
            <p className="text-right text-sm font-medium">{task.due}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function BuildRoadmap() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {buildSteps.map((step) => (
        <Card
          key={step.title}
          className="border-white/80 bg-white/76 shadow-sm backdrop-blur"
        >
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <step.icon className="size-5" />
            </div>
            <CardTitle className="text-lg">{step.title}</CardTitle>
            <CardDescription>{step.detail}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}
