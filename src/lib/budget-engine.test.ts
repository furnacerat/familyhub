import { describe, expect, it } from "vitest";

import {
  createAllocationPlan,
  formatMoney,
  type AllocationInput,
} from "@/lib/budget-engine";
import {
  sampleAllocationInput,
  sampleBills,
  samplePaychecks,
  sampleReserves,
} from "@/lib/budget-sample-data";

describe("createAllocationPlan", () => {
  it("holds the minimum buffer before allocating obligations", () => {
    const plan = createAllocationPlan(sampleAllocationInput);

    expect(plan.bufferCents).toBe(10_000);
    expect(plan.items[0]).toMatchObject({
      type: "buffer",
      allocatedCents: 10_000,
      status: "held",
    });
  });

  it("prioritizes shutoff risk and critical bills before lower priority bills", () => {
    const plan = createAllocationPlan(sampleAllocationInput);
    const billNames = plan.items
      .filter((item) => item.type === "bill")
      .map((item) => item.name);

    expect(billNames.slice(0, 3)).toEqual([
      "Electric",
      "Mortgage",
      "Car insurance",
    ]);
  });

  it("excludes bills due after the next paycheck window", () => {
    const plan = createAllocationPlan(sampleAllocationInput);
    const names = plan.items.map((item) => item.name);

    expect(names).not.toContain("Phone");
  });

  it("marks splittable bills as partial when only a minimum can be covered", () => {
    const input: AllocationInput = {
      ...sampleAllocationInput,
      paycheck: {
        ...samplePaychecks[0],
        amountCents: 161_000,
      },
      reserves: [],
    };

    const plan = createAllocationPlan(input);
    const cardMinimum = plan.items.find((item) => item.name === "Card minimum");

    expect(cardMinimum).toMatchObject({
      allocatedCents: 15_500,
      status: "partial",
    });
  });

  it("leaves non-splittable bills unfunded when cash is short", () => {
    const input: AllocationInput = {
      ...sampleAllocationInput,
      paycheck: {
        ...samplePaychecks[0],
        amountCents: 145_000,
      },
      bills: sampleBills.filter((bill) => bill.name !== "Card minimum"),
      reserves: [],
    };

    const plan = createAllocationPlan(input);
    const insurance = plan.items.find((item) => item.name === "Car insurance");

    expect(insurance).toMatchObject({
      allocatedCents: 0,
      status: "unfunded",
    });
  });

  it("promotes past-due bills ahead of upcoming critical bills", () => {
    const input: AllocationInput = {
      ...sampleAllocationInput,
      bills: [
        ...sampleBills,
        {
          id: "bill-water-past-due",
          name: "Water",
          category: "utilities",
          amountCents: 8_000,
          dueDate: "2026-06-08",
          paid: false,
          priority: "normal",
          canSplit: false,
        },
      ],
    };

    const plan = createAllocationPlan(input);
    const firstBill = plan.items.find((item) => item.type === "bill");

    expect(firstBill?.name).toBe("Water");
  });

  it("allocates essential reserves after urgent bills when money remains", () => {
    const plan = createAllocationPlan(sampleAllocationInput);

    expect(plan.items.find((item) => item.name === "Groceries")).toMatchObject({
      type: "reserve",
      allocatedCents: sampleReserves[0].amountCents,
      status: "funded",
    });
  });
});

describe("formatMoney", () => {
  it("formats cents as US dollars", () => {
    expect(formatMoney(185_000)).toBe("$1,850.00");
  });
});
