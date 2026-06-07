import { describe, expect, it } from "vitest";

import {
  addKidGoal,
  addKidTransaction,
  addSavingsToGoal,
  approveChore,
  getGoalProgress,
  getKidStats,
  requestChoreApproval,
  type KidProfile,
} from "@/lib/kids-money-utils";

const kids: KidProfile[] = [
  {
    id: "avery",
    name: "Avery",
    walletCents: 1000,
    allowanceCents: 500,
    allowanceDay: "Sunday",
    goals: [{ id: "goal", name: "Helmet", savedCents: 500, targetCents: 2000 }],
    chores: [{ id: "chore", title: "Trash", rewardCents: 200, status: "available" }],
    transactions: [],
  },
];

describe("kids money utilities", () => {
  it("calculates goal progress", () => {
    expect(getGoalProgress(kids[0].goals[0])).toBe(25);
  });

  it("calculates kid stats", () => {
    expect(getKidStats(kids[0])).toMatchObject({
      totalMoneyCents: 1500,
      totalGoalSavedCents: 500,
      pendingChores: 0,
      availableChores: 1,
    });
  });

  it("adds deposits and spending transactions", () => {
    const deposited = addKidTransaction(kids, "avery", {
      type: "deposit",
      amountCents: 300,
      label: "Birthday",
    });

    expect(deposited[0].walletCents).toBe(1300);

    const spent = addKidTransaction(deposited, "avery", {
      type: "spend",
      amountCents: 400,
      label: "Toy",
    });

    expect(spent[0].walletCents).toBe(900);
  });

  it("moves wallet money to a savings goal", () => {
    const updated = addSavingsToGoal(kids, "avery", "goal", 700);

    expect(updated[0].walletCents).toBe(300);
    expect(updated[0].goals[0].savedCents).toBe(1200);
  });

  it("requests and approves chore payments", () => {
    const pending = requestChoreApproval(kids, "avery", "chore");
    expect(pending[0].chores[0].status).toBe("pending");

    const approved = approveChore(pending, "avery", "chore");
    expect(approved[0].walletCents).toBe(1200);
    expect(approved[0].chores[0].status).toBe("approved");
  });

  it("adds new goals", () => {
    const updated = addKidGoal(kids, "avery", {
      name: "Book",
      targetCents: 1500,
    });

    expect(updated[0].goals.at(-1)).toMatchObject({
      name: "Book",
      targetCents: 1500,
      savedCents: 0,
    });
  });
});
