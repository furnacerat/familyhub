import {
  createAllocationPlan,
  type AllocationInput,
  type Bill,
  type BudgetReserve,
  type Paycheck,
} from "@/lib/budget-engine";

export const samplePaychecks: Paycheck[] = [
  {
    id: "paycheck-jordan-2026-06-12",
    earner: "Jordan",
    amountCents: 185_000,
    payDate: "2026-06-12",
    status: "expected",
  },
  {
    id: "paycheck-taylor-2026-06-19",
    earner: "Taylor",
    amountCents: 127_500,
    payDate: "2026-06-19",
    status: "expected",
  },
  {
    id: "paycheck-jordan-2026-06-26",
    earner: "Jordan",
    amountCents: 185_000,
    payDate: "2026-06-26",
    status: "expected",
  },
];

export const sampleBills: Bill[] = [
  {
    id: "bill-electric-2026-06",
    name: "Electric",
    category: "utilities",
    amountCents: 18_000,
    dueDate: "2026-06-13",
    paid: false,
    priority: "critical",
    canSplit: false,
    hasLateFeeRisk: true,
    hasShutoffRisk: true,
  },
  {
    id: "bill-mortgage-2026-06",
    name: "Mortgage",
    category: "housing",
    amountCents: 95_000,
    dueDate: "2026-06-15",
    paid: false,
    priority: "critical",
    canSplit: false,
  },
  {
    id: "bill-car-insurance-2026-06",
    name: "Car insurance",
    category: "insurance",
    amountCents: 22_500,
    dueDate: "2026-06-18",
    paid: false,
    priority: "high",
    canSplit: false,
  },
  {
    id: "bill-card-minimum-2026-06",
    name: "Card minimum",
    category: "debt",
    amountCents: 16_500,
    dueDate: "2026-06-16",
    paid: false,
    priority: "normal",
    minimumPaymentCents: 7_500,
    canSplit: true,
    hasLateFeeRisk: true,
  },
  {
    id: "bill-phone-2026-06",
    name: "Phone",
    category: "utilities",
    amountCents: 16_500,
    dueDate: "2026-06-21",
    paid: false,
    priority: "normal",
    canSplit: false,
  },
];

export const sampleReserves: BudgetReserve[] = [
  {
    id: "reserve-groceries",
    name: "Groceries",
    amountCents: 30_000,
    category: "food",
    priority: "essential",
  },
  {
    id: "reserve-gas",
    name: "Gas",
    amountCents: 10_000,
    category: "transportation",
    priority: "essential",
  },
];

export const sampleAllocationInput: AllocationInput = {
  paycheck: samplePaychecks[0],
  upcomingPaychecks: samplePaychecks,
  bills: sampleBills,
  reserves: sampleReserves,
  settings: {
    minimumBufferCents: 10_000,
    today: "2026-06-12",
  },
};

export const sampleAllocationPlan = createAllocationPlan(sampleAllocationInput);
