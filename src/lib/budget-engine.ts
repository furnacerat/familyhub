export type BillPriority = "critical" | "high" | "normal" | "low";

export type BillCategory =
  | "housing"
  | "utilities"
  | "insurance"
  | "debt"
  | "food"
  | "transportation"
  | "childcare"
  | "household"
  | "other";

export type Paycheck = {
  id: string;
  earner: string;
  amountCents: number;
  payDate: string;
  status: "expected" | "received";
};

export type Bill = {
  id: string;
  name: string;
  category: BillCategory;
  amountCents: number;
  dueDate: string;
  paid: boolean;
  priority: BillPriority;
  minimumPaymentCents?: number;
  canSplit: boolean;
  hasLateFeeRisk?: boolean;
  hasShutoffRisk?: boolean;
  autopay?: boolean;
};

export type BudgetReserve = {
  id: string;
  name: string;
  amountCents: number;
  category: BillCategory;
  priority: "essential" | "preferred";
};

export type AllocationSettings = {
  minimumBufferCents: number;
  today: string;
};

export type AllocationInput = {
  paycheck: Paycheck;
  upcomingPaychecks: Paycheck[];
  bills: Bill[];
  reserves: BudgetReserve[];
  settings: AllocationSettings;
};

export type AllocationItemType = "bill" | "reserve" | "buffer";

export type AllocationStatus = "funded" | "partial" | "unfunded" | "held";

export type AllocationItem = {
  id: string;
  type: AllocationItemType;
  name: string;
  category: BillCategory | "buffer";
  dueDate?: string;
  requestedCents: number;
  allocatedCents: number;
  status: AllocationStatus;
  reason: string;
  sortScore: number;
};

export type AllocationPlan = {
  paycheck: Paycheck;
  nextPaycheckDate: string | null;
  startingCents: number;
  allocatedCents: number;
  bufferCents: number;
  flexibleCents: number;
  uncoveredCents: number;
  items: AllocationItem[];
  warnings: string[];
};

type Candidate = {
  id: string;
  type: "bill" | "reserve";
  name: string;
  category: BillCategory;
  dueDate?: string;
  requestedCents: number;
  minimumCents: number;
  canSplit: boolean;
  reason: string;
  sortScore: number;
};

const priorityRank: Record<BillPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const categoryRank: Record<BillCategory, number> = {
  housing: 0,
  utilities: 1,
  insurance: 2,
  childcare: 3,
  food: 4,
  transportation: 5,
  debt: 6,
  household: 7,
  other: 8,
};

export function createAllocationPlan(input: AllocationInput): AllocationPlan {
  validateInput(input);

  const nextPaycheckDate = findNextPaycheckDate(
    input.paycheck,
    input.upcomingPaychecks,
  );
  const windowEnd = nextPaycheckDate ?? input.paycheck.payDate;
  const candidates = [
    ...input.bills
      .filter((bill) => shouldConsiderBill(bill, input.settings.today, windowEnd))
      .map((bill) => billToCandidate(bill, input.settings.today)),
    ...input.reserves.map((reserve) => reserveToCandidate(reserve)),
  ].sort((a, b) => a.sortScore - b.sortScore);

  let availableCents = input.paycheck.amountCents;
  const warnings: string[] = [];
  const items: AllocationItem[] = [];

  const bufferCents = Math.min(input.settings.minimumBufferCents, availableCents);
  if (bufferCents > 0) {
    availableCents -= bufferCents;
    items.push({
      id: "buffer",
      type: "buffer",
      name: "Household buffer",
      category: "buffer",
      requestedCents: input.settings.minimumBufferCents,
      allocatedCents: bufferCents,
      status: "held",
      reason: "Held first so the plan does not spend the account down to zero.",
      sortScore: -100,
    });
  }

  for (const candidate of candidates) {
    const allocatedCents = allocateCandidate(candidate, availableCents);
    availableCents -= allocatedCents;

    const status = getStatus(candidate.requestedCents, allocatedCents);
    if (status !== "funded") {
      warnings.push(`${candidate.name} is ${status}.`);
    }

    items.push({
      id: candidate.id,
      type: candidate.type,
      name: candidate.name,
      category: candidate.category,
      dueDate: candidate.dueDate,
      requestedCents: candidate.requestedCents,
      allocatedCents,
      status,
      reason: candidate.reason,
      sortScore: candidate.sortScore,
    });
  }

  const allocatedCents = items.reduce((sum, item) => sum + item.allocatedCents, 0);
  const uncoveredCents = items.reduce(
    (sum, item) => sum + Math.max(item.requestedCents - item.allocatedCents, 0),
    0,
  );

  return {
    paycheck: input.paycheck,
    nextPaycheckDate,
    startingCents: input.paycheck.amountCents,
    allocatedCents,
    bufferCents,
    flexibleCents: availableCents,
    uncoveredCents,
    items,
    warnings,
  };
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function getAllocationSummary(plan: AllocationPlan) {
  const fundedBills = plan.items.filter(
    (item) => item.type === "bill" && item.status === "funded",
  ).length;
  const partialItems = plan.items.filter((item) => item.status === "partial").length;
  const unfundedItems = plan.items.filter(
    (item) => item.status === "unfunded",
  ).length;

  return {
    fundedBills,
    partialItems,
    unfundedItems,
    hasShortfall: plan.uncoveredCents > 0,
  };
}

function validateInput(input: AllocationInput) {
  if (input.paycheck.amountCents < 0) {
    throw new Error("Paycheck amount cannot be negative.");
  }

  for (const bill of input.bills) {
    if (bill.amountCents < 0) {
      throw new Error(`${bill.name} amount cannot be negative.`);
    }
  }

  for (const reserve of input.reserves) {
    if (reserve.amountCents < 0) {
      throw new Error(`${reserve.name} reserve cannot be negative.`);
    }
  }
}

function findNextPaycheckDate(
  paycheck: Paycheck,
  upcomingPaychecks: Paycheck[],
): string | null {
  const currentTime = toDayNumber(paycheck.payDate);
  const next = upcomingPaychecks
    .filter((item) => item.id !== paycheck.id)
    .filter((item) => toDayNumber(item.payDate) > currentTime)
    .sort((a, b) => toDayNumber(a.payDate) - toDayNumber(b.payDate))[0];

  return next?.payDate ?? null;
}

function shouldConsiderBill(bill: Bill, today: string, windowEnd: string): boolean {
  if (bill.paid) {
    return false;
  }

  return toDayNumber(bill.dueDate) < toDayNumber(windowEnd) || isPastDue(bill, today);
}

function billToCandidate(bill: Bill, today: string): Candidate {
  const dueDateScore = toDayNumber(bill.dueDate);
  const pastDue = isPastDue(bill, today);
  const urgencyScore =
    (pastDue ? 0 : 100_000) +
    priorityRank[bill.priority] * 10_000 +
    (bill.hasShutoffRisk ? 0 : 1_000) +
    (bill.hasLateFeeRisk ? 0 : 500) +
    categoryRank[bill.category] * 50 +
    dueDateScore;

  return {
    id: bill.id,
    type: "bill",
    name: bill.name,
    category: bill.category,
    dueDate: bill.dueDate,
    requestedCents: bill.amountCents,
    minimumCents: bill.minimumPaymentCents ?? bill.amountCents,
    canSplit: bill.canSplit,
    reason: buildBillReason(bill, today),
    sortScore: urgencyScore,
  };
}

function reserveToCandidate(reserve: BudgetReserve): Candidate {
  return {
    id: reserve.id,
    type: "reserve",
    name: reserve.name,
    category: reserve.category,
    requestedCents: reserve.amountCents,
    minimumCents: reserve.amountCents,
    canSplit: true,
    reason:
      reserve.priority === "essential"
        ? "Protected spending for the household before flexible money is counted."
        : "Preferred reserve funded after urgent bills when cash is available.",
    sortScore: reserve.priority === "essential" ? 125_000 : 175_000,
  };
}

function allocateCandidate(candidate: Candidate, availableCents: number): number {
  if (availableCents <= 0) {
    return 0;
  }

  if (availableCents >= candidate.requestedCents) {
    return candidate.requestedCents;
  }

  if (!candidate.canSplit) {
    return 0;
  }

  if (availableCents >= candidate.minimumCents) {
    return availableCents;
  }

  return candidate.type === "reserve" ? availableCents : 0;
}

function getStatus(
  requestedCents: number,
  allocatedCents: number,
): AllocationStatus {
  if (allocatedCents === 0 && requestedCents > 0) {
    return "unfunded";
  }

  if (allocatedCents < requestedCents) {
    return "partial";
  }

  return "funded";
}

function buildBillReason(bill: Bill, today: string): string {
  if (isPastDue(bill, today)) {
    return "Past due bills are handled before upcoming obligations.";
  }

  if (bill.hasShutoffRisk) {
    return "Prioritized because it has service interruption risk.";
  }

  if (bill.priority === "critical") {
    return "Critical household bill due before the next paycheck.";
  }

  if (bill.hasLateFeeRisk) {
    return "Prioritized because it has late fee risk.";
  }

  return "Due before the next paycheck window closes.";
}

function isPastDue(bill: Bill, today: string): boolean {
  return toDayNumber(bill.dueDate) < toDayNumber(today);
}

function toDayNumber(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00.000Z`) / 86_400_000);
}
