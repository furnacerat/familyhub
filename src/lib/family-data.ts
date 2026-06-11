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
  Route,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";

export type Role = "Owner" | "Adult" | "Child" | "Member";

export type NavItem = {
  label: string;
  href: string;
  icon: typeof Home;
  access: Role[];
};

export const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    access: ["Owner", "Adult", "Child", "Member"],
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    access: ["Owner", "Adult", "Child", "Member"],
  },
  {
    label: "Lists",
    href: "/lists",
    icon: ShoppingCart,
    access: ["Owner", "Adult", "Child", "Member"],
  },
  {
    label: "Reminders",
    href: "/reminders",
    icon: CheckCircle2,
    access: ["Owner", "Adult", "Child", "Member"],
  },
  { label: "Budget", href: "/budget", icon: Banknote, access: ["Owner", "Adult"] },
  {
    label: "Kids",
    href: "/kids",
    icon: PiggyBank,
    access: ["Owner", "Adult", "Child"],
  },
  {
    label: "Teen Tools",
    href: "/teen",
    icon: Route,
    access: ["Owner", "Adult", "Child"],
  },
  {
    label: "Family",
    href: "/settings/family",
    icon: Users,
    access: ["Owner"],
  },
  {
    label: "Maintain",
    href: "/maintain",
    icon: Wrench,
    access: ["Owner", "Adult", "Member"],
  },
  {
    label: "Invites",
    href: "/settings/invites",
    icon: UserPlus,
    access: ["Owner"],
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
    date: "Jun 6",
    time: "7:45 AM",
    title: "School drop-off",
    person: "Family",
    location: "Elementary entrance",
    color: "bg-sky-500",
  },
  {
    date: "Jun 6",
    time: "4:30 PM",
    title: "Practice",
    person: "Avery",
    location: "Field 3",
    color: "bg-emerald-500",
  },
  {
    date: "Jun 6",
    time: "6:15 PM",
    title: "Dinner prep",
    person: "Jordan",
    location: "Home",
    color: "bg-amber-500",
  },
  {
    date: "Jun 7",
    time: "10:00 AM",
    title: "Grocery pickup",
    person: "Taylor",
    location: "Market",
    color: "bg-rose-500",
  },
  {
    date: "Jun 9",
    time: "3:15 PM",
    title: "Dentist appointment",
    person: "Mia",
    location: "Main Street Dental",
    color: "bg-violet-500",
  },
];

export const shoppingItems = [
  { name: "Milk", area: "Groceries", addedBy: "Mia", checked: false },
  {
    name: "Laundry detergent",
    area: "House",
    addedBy: "Jordan",
    checked: false,
  },
  { name: "Dog food", area: "Pets", addedBy: "Avery", checked: true },
  { name: "AA batteries", area: "Hardware", addedBy: "Taylor", checked: false },
  { name: "Apples", area: "Groceries", addedBy: "Mia", checked: false },
  { name: "Air filter", area: "Maintenance", addedBy: "Jordan", checked: false },
];

export const reminders = [
  {
    title: "Return library books",
    due: "Tonight",
    owner: "Mia",
    status: "Open",
    priority: "Normal",
  },
  {
    title: "Call dentist",
    due: "Tomorrow",
    owner: "Jordan",
    status: "Open",
    priority: "High",
  },
  {
    title: "Permission slip",
    due: "Friday",
    owner: "Taylor",
    status: "Needs adult",
    priority: "High",
  },
  {
    title: "Pack practice bag",
    due: "Saturday morning",
    owner: "Avery",
    status: "Open",
    priority: "Normal",
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
    chores: ["Trash bins", "Feed dog"],
  },
  {
    name: "Mia",
    balance: "$41.00",
    goal: "Art set",
    saved: 28,
    target: 50,
    next: "Chore approval pending",
    chores: ["Dishes", "Room reset"],
  },
];

export const maintenanceTasks = [
  {
    title: "Furnace filter",
    appliesTo: "House",
    due: "Due in 5 days",
    cadence: "Every 90 days",
    lastDone: "Mar 13",
    assignedTo: "Jordan",
    icon: Home,
  },
  {
    title: "Van oil change",
    appliesTo: "Family van",
    due: "Overdue by 200 miles",
    cadence: "Every 5,000 miles",
    lastDone: "151,230 mi",
    assignedTo: "Taylor",
    icon: Car,
  },
  {
    title: "Smoke detector test",
    appliesTo: "Whole house",
    due: "Next week",
    cadence: "Monthly",
    lastDone: "May 8",
    assignedTo: "Family",
    icon: ShieldCheck,
  },
];

export const paychecks = [
  {
    earner: "Jordan",
    amount: "$1,850.00",
    date: "Jun 12",
    cadence: "Biweekly",
    status: "Expected",
  },
  {
    earner: "Taylor",
    amount: "$1,275.00",
    date: "Jun 19",
    cadence: "Biweekly",
    status: "Expected",
  },
];

export const billCatalog = [
  {
    name: "Mortgage",
    category: "Housing",
    amount: "$950",
    due: "Jun 15",
    status: "Planned",
  },
  {
    name: "Electric",
    category: "Utilities",
    amount: "$180",
    due: "Jun 13",
    status: "Pay first",
  },
  {
    name: "Car insurance",
    category: "Insurance",
    amount: "$225",
    due: "Jun 18",
    status: "Planned",
  },
  {
    name: "Phone",
    category: "Utilities",
    amount: "$165",
    due: "Jun 21",
    status: "Upcoming",
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
