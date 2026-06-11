import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  PiggyBank,
  ShoppingCart,
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
import { formatMoney, type Bill, type Paycheck } from "@/lib/budget-engine";
import { formatEventTime, type CalendarEvent } from "@/lib/calendar-utils";
import { formatKidMoney, type KidProfile } from "@/lib/kids-money-utils";
import type { HouseholdListItem } from "@/lib/list-utils";
import {
  getMaintenanceStatus,
  type MaintenanceTask,
} from "@/lib/maintenance-utils";
import type { Reminder } from "@/lib/reminder-utils";
import type { HouseholdProfile } from "@/lib/supabase/types";

type TodayDashboardProps = {
  profile: HouseholdProfile;
  today: string;
  events: CalendarEvent[];
  reminders: Reminder[];
  listItems: HouseholdListItem[];
  kids: KidProfile[];
  maintenance: MaintenanceTask[];
  budget?: {
    paychecks: Paycheck[];
    bills: Bill[];
  };
};

export function TodayDashboard(props: TodayDashboardProps) {
  return props.profile.role === "child" ? (
    <ChildToday {...props} />
  ) : (
    <AdultToday {...props} />
  );
}

function AdultToday({
  profile,
  today,
  events,
  reminders,
  listItems,
  kids,
  maintenance,
  budget,
}: TodayDashboardProps) {
  const todayEvents = events.filter((event) => event.date === today);
  const openReminders = reminders.filter(
    (reminder) => reminder.status !== "done" && reminder.dueDate <= today,
  );
  const pendingApprovals = kids.flatMap((kid) =>
    kid.chores
      .filter((chore) => chore.status === "pending")
      .map((chore) => ({ kid: kid.name, chore })),
  );
  const dueMaintenance = maintenance.filter((task) =>
    ["overdue", "due-soon"].includes(getMaintenanceStatus(task, today)),
  );
  const nextPaycheck = budget?.paychecks[0];
  const unpaidBills = budget?.bills.filter((bill) => !bill.paid) ?? [];

  return (
    <>
      <WelcomePanel
        eyebrow={formatFullDate(today)}
        title={`Good ${getDayPart()}, ${firstName(profile.display_name)}.`}
        description="Here is what needs attention across the household today."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CalendarDays} label="Today" value={todayEvents.length} helper="scheduled events" />
        <Metric icon={CheckCircle2} label="Due now" value={openReminders.length} helper="open reminders" />
        <Metric icon={ClipboardCheck} label="Approvals" value={pendingApprovals.length} helper="waiting for an adult" />
        <Metric icon={ShoppingCart} label="Shopping" value={listItems.filter((item) => !item.checked).length} helper="open list items" />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardList
          title="Today's schedule"
          description="Calendar"
          href="/calendar"
          empty="Nothing scheduled today."
        >
          {todayEvents.map((event) => (
            <DashboardRow
              key={event.id}
              title={event.title}
              detail={`${formatEventTime(event)} - ${event.person}`}
              badge={event.category}
            />
          ))}
        </DashboardList>
        <DashboardList
          title="Needs action"
          description="Reminders and approvals"
          href="/reminders"
          empty="Nothing urgent is waiting."
        >
          {openReminders.map((reminder) => (
            <DashboardRow
              key={reminder.id}
              title={reminder.title}
              detail={`${reminder.owner} - ${formatShortDate(reminder.dueDate)}`}
              badge={reminder.priority}
            />
          ))}
          {pendingApprovals.map(({ kid, chore }) => (
            <DashboardRow
              key={chore.id}
              title={chore.title}
              detail={`${kid} requested approval`}
              badge={formatKidMoney(chore.rewardCents)}
            />
          ))}
        </DashboardList>
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardList
          title="Home and vehicles"
          description="Maintenance"
          href="/maintain"
          empty="Nothing due soon."
        >
          {dueMaintenance.map((task) => (
            <DashboardRow
              key={task.id}
              title={task.title}
              detail={`${task.appliesTo} - ${task.assignedTo}`}
              badge={getMaintenanceStatus(task, today)}
            />
          ))}
        </DashboardList>
        {budget ? (
          <Card className="border-slate-900 bg-slate-950 text-white shadow-sm">
            <CardHeader>
              <CardDescription className="text-slate-300">Private budget snapshot</CardDescription>
              <CardTitle className="text-2xl">
                {nextPaycheck ? formatMoney(nextPaycheck.amountCents) : "No paycheck entered"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">
                {nextPaycheck
                  ? `${nextPaycheck.earner} on ${formatShortDate(nextPaycheck.payDate)}`
                  : "Add income to create an allocation plan."}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {unpaidBills.length} unpaid bills in the catalog.
              </p>
              <Button asChild className="mt-5 w-full bg-white text-slate-950 hover:bg-slate-100">
                <Link href="/budget">Review budget <ArrowRight className="size-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DashboardList
            title="Family members"
            description="Independence"
            href="/kids"
            empty="No child profiles configured."
          >
            {kids.map((kid) => (
              <DashboardRow
                key={kid.id}
                title={kid.name}
                detail={`${kid.chores.filter((chore) => chore.status !== "approved").length} active responsibilities`}
                badge={formatKidMoney(kid.walletCents)}
              />
            ))}
          </DashboardList>
        )}
      </section>
    </>
  );
}

function ChildToday({
  profile,
  today,
  events,
  reminders,
  kids,
}: TodayDashboardProps) {
  const kid = kids[0];
  const name = kid?.name ?? profile.display_name;
  const personalEvents = events.filter(
    (event) =>
      event.date === today && (event.person === name || event.person === "Family"),
  );
  const personalReminders = reminders.filter(
    (reminder) =>
      reminder.status !== "done" &&
      reminder.dueDate <= today &&
      (reminder.owner === name || reminder.owner === "Family"),
  );
  const activeChores = kid?.chores.filter((chore) => chore.status !== "approved") ?? [];

  return (
    <>
      <WelcomePanel
        eyebrow={formatFullDate(today)}
        title={`Hey ${firstName(name)}, here is your day.`}
        description={getAgeGuidance(kid?.birthDate)}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CalendarDays} label="Schedule" value={personalEvents.length} helper="events today" />
        <Metric icon={CheckCircle2} label="To do" value={personalReminders.length} helper="items due" />
        <Metric icon={ClipboardCheck} label="Responsibilities" value={activeChores.length} helper="still active" />
        <Metric icon={PiggyBank} label="Wallet" value={kid ? formatKidMoney(kid.walletCents) : "$0.00"} helper="available money" />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardList
          title="My schedule"
          description="Today"
          href="/calendar"
          empty="You have a clear schedule today."
        >
          {personalEvents.map((event) => (
            <DashboardRow
              key={event.id}
              title={event.title}
              detail={formatEventTime(event)}
              badge={event.category}
            />
          ))}
        </DashboardList>
        <DashboardList
          title="My next steps"
          description="Responsibilities"
          href="/kids"
          empty="Nothing is waiting on you."
        >
          {personalReminders.map((reminder) => (
            <DashboardRow
              key={reminder.id}
              title={reminder.title}
              detail={formatShortDate(reminder.dueDate)}
              badge={reminder.priority}
            />
          ))}
          {activeChores.map((chore) => (
            <DashboardRow
              key={chore.id}
              title={chore.title}
              detail={chore.status === "pending" ? "Waiting for approval" : "Available"}
              badge={formatKidMoney(chore.rewardCents)}
            />
          ))}
        </DashboardList>
      </section>
      {kid ? (
        <Card className="border-white/80 bg-white/84 shadow-sm">
          <CardHeader>
            <CardDescription>Money goals</CardDescription>
            <CardTitle>What you are building toward</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {kid.goals.map((goal) => (
              <div key={goal.id} className="rounded-lg border bg-background/70 p-4">
                <p className="font-medium">{goal.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatKidMoney(goal.savedCents)} of {formatKidMoney(goal.targetCents)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function WelcomePanel({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">{eyebrow}</Badge>
        <CardTitle className="text-3xl sm:text-4xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number | string;
  helper: string;
}) {
  return (
    <Card className="border-white/80 bg-white/84 shadow-sm">
      <CardContent className="p-4">
        <Icon className="size-5 text-sky-700" />
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function DashboardList({
  title,
  description,
  href,
  empty,
  children,
}: {
  title: string;
  description: string;
  href: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children)
    ? children.some(Boolean)
    : Boolean(children);

  return (
    <Card className="border-white/80 bg-white/84 shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardDescription>{description}</CardDescription>
          <CardTitle>{title}</CardTitle>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={href}>Open <ArrowRight className="size-4" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasChildren ? children : (
          <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
            {empty}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardRow({
  title,
  detail,
  badge,
}: {
  title: string;
  detail: string;
  badge: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/70 p-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
      <Badge variant="secondary" className="capitalize">{badge}</Badge>
    </div>
  );
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function getDayPart() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getAgeGuidance(birthDate?: string) {
  if (!birthDate) {
    return "Your schedule, responsibilities, and money are together in one place.";
  }

  const age = getAge(birthDate);
  if (age <= 12) {
    return "Keep today simple: check your responsibilities, pack what you need, and make progress on a goal.";
  }
  if (age <= 15) {
    return "Stay ahead of school, activities, rides, responsibilities, and your spending plan.";
  }
  return "Manage your schedule, work, driving, responsibilities, and longer-term money goals.";
}

function getAge(birthDate: string) {
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age;
}
