import {
  Banknote,
  CalendarDays,
  Car,
  CheckCircle2,
  ClipboardList,
  Home,
  PiggyBank,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Wrench,
} from "lucide-react";

export type Role = "Owner" | "Adult" | "Child" | "Member";

export type NavItem = {
  label: string;
  icon: typeof Home;
  access: Role[];
};

export const navItems: NavItem[] = [
  { label: "Home", icon: Home, access: ["Owner", "Adult", "Child", "Member"] },
  {
    label: "Calendar",
    icon: CalendarDays,
    access: ["Owner", "Adult", "Child", "Member"],
  },
  {
    label: "Lists",
    icon: ShoppingCart,
    access: ["Owner", "Adult", "Child", "Member"],
  },
  {
    label: "Reminders",
    icon: CheckCircle2,
    access: ["Owner", "Adult", "Child", "Member"],
  },
  { label: "Budget", icon: Banknote, access: ["Owner", "Adult"] },
  { label: "Kids", icon: PiggyBank, access: ["Owner", "Adult", "Child"] },
  {
    label: "Maintain",
    icon: Wrench,
    access: ["Owner", "Adult", "Member"],
  },
];

export const householdStats = [
  {
    label: "Today",
    value: "7 items",
    helper: "events, tasks, and errands",
    icon: ClipboardList,
  },
  {
    label: "Next check",
    value: "$1,850",
    helper: "expected Friday",
    icon: Banknote,
  },
  {
    label: "Home care",
    value: "3 due",
    helper: "one is overdue",
    icon: Wrench,
  },
];

export const todaysSchedule = [
  {
    time: "7:45 AM",
    title: "School drop-off",
    person: "Family",
    color: "bg-sky-500",
  },
  {
    time: "4:30 PM",
    title: "Practice",
    person: "Avery",
    color: "bg-emerald-500",
  },
  {
    time: "6:15 PM",
    title: "Dinner prep",
    person: "Jordan",
    color: "bg-amber-500",
  },
];

export const shoppingItems = [
  { name: "Milk", area: "Groceries", checked: false },
  { name: "Laundry detergent", area: "House", checked: false },
  { name: "Dog food", area: "Pets", checked: true },
  { name: "AA batteries", area: "Hardware", checked: false },
];

export const reminders = [
  {
    title: "Return library books",
    due: "Tonight",
    owner: "Mia",
    status: "Open",
  },
  {
    title: "Call dentist",
    due: "Tomorrow",
    owner: "Jordan",
    status: "Open",
  },
  {
    title: "Permission slip",
    due: "Friday",
    owner: "Taylor",
    status: "Needs adult",
  },
];

export const budgetPlan = {
  paycheck: "$1,850.00",
  date: "Friday, Jun 12",
  flexible: "$195.00",
  covered: "$1,655.00",
  bills: [
    {
      name: "Mortgage",
      due: "Jun 15",
      amount: "$950",
      reason: "critical and due before the next paycheck",
      priority: "Critical",
    },
    {
      name: "Electric",
      due: "Jun 13",
      amount: "$180",
      reason: "due in two days with late fee risk",
      priority: "Urgent",
    },
    {
      name: "Car insurance",
      due: "Jun 18",
      amount: "$225",
      reason: "required bill due before the next income window",
      priority: "High",
    },
    {
      name: "Groceries",
      due: "Hold",
      amount: "$300",
      reason: "protected household spending",
      priority: "Reserve",
    },
  ],
};

export const cashFlow = [
  { label: "Income", value: 1850, color: "bg-emerald-500" },
  { label: "Bills", value: 1355, color: "bg-sky-500" },
  { label: "Reserves", value: 300, color: "bg-amber-500" },
  { label: "Flexible", value: 195, color: "bg-rose-500" },
];

export const kidsMoney = [
  {
    name: "Avery",
    balance: "$24.50",
    goal: "Bike helmet",
    saved: 18,
    target: 35,
    next: "$5 allowance due Sunday",
  },
  {
    name: "Mia",
    balance: "$41.00",
    goal: "Art set",
    saved: 28,
    target: 50,
    next: "Chore approval pending",
  },
];

export const maintenanceTasks = [
  {
    title: "Furnace filter",
    appliesTo: "House",
    due: "Due in 5 days",
    cadence: "Every 90 days",
    icon: Home,
  },
  {
    title: "Van oil change",
    appliesTo: "Family van",
    due: "Overdue by 200 miles",
    cadence: "Every 5,000 miles",
    icon: Car,
  },
  {
    title: "Smoke detector test",
    appliesTo: "Whole house",
    due: "Next week",
    cadence: "Monthly",
    icon: ShieldCheck,
  },
];

export const buildSteps = [
  {
    title: "Private household access",
    detail: "Owner, Adult, Child, and Member roles with budget privacy.",
    icon: ShieldCheck,
  },
  {
    title: "Manual money system",
    detail: "Bills, paychecks, due dates, and explainable allocation plans.",
    icon: Banknote,
  },
  {
    title: "Kid money habits",
    detail: "Balances, savings goals, allowance, chores, and parent approval.",
    icon: Sparkles,
  },
];
