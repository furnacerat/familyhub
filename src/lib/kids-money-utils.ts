export type KidTransactionType = "deposit" | "spend" | "goal-save" | "chore";
export type ChoreStatus = "available" | "pending" | "approved";

export type KidGoal = {
  id: string;
  name: string;
  targetCents: number;
  savedCents: number;
};

export type KidChore = {
  id: string;
  title: string;
  rewardCents: number;
  status: ChoreStatus;
};

export type KidTransaction = {
  id: string;
  type: KidTransactionType;
  amountCents: number;
  label: string;
  createdAt: string;
};

export type KidProfile = {
  id: string;
  name: string;
  walletCents: number;
  allowanceCents: number;
  allowanceDay: string;
  goals: KidGoal[];
  chores: KidChore[];
  transactions: KidTransaction[];
};

export function formatKidMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function getGoalProgress(goal: KidGoal) {
  if (goal.targetCents <= 0) {
    return 0;
  }

  return Math.min(Math.round((goal.savedCents / goal.targetCents) * 100), 100);
}

export function getKidStats(kid: KidProfile) {
  const totalGoalSavedCents = kid.goals.reduce(
    (sum, goal) => sum + goal.savedCents,
    0,
  );
  const totalGoalTargetCents = kid.goals.reduce(
    (sum, goal) => sum + goal.targetCents,
    0,
  );
  const pendingChores = kid.chores.filter((chore) => chore.status === "pending");
  const availableChores = kid.chores.filter(
    (chore) => chore.status === "available",
  );

  return {
    totalMoneyCents: kid.walletCents + totalGoalSavedCents,
    totalGoalSavedCents,
    totalGoalTargetCents,
    pendingChores: pendingChores.length,
    availableChores: availableChores.length,
  };
}

export function addKidTransaction(
  kids: KidProfile[],
  kidId: string,
  transaction: Omit<KidTransaction, "id" | "createdAt">,
) {
  const createdAt = new Date().toISOString();

  return kids.map((kid) => {
    if (kid.id !== kidId) {
      return kid;
    }

    const signedAmount =
      transaction.type === "spend" || transaction.type === "goal-save"
        ? -transaction.amountCents
        : transaction.amountCents;

    return {
      ...kid,
      walletCents: Math.max(kid.walletCents + signedAmount, 0),
      transactions: [
        {
          ...transaction,
          id: createKidMoneyId(transaction.label, createdAt),
          createdAt,
        },
        ...kid.transactions,
      ],
    };
  });
}

export function addSavingsToGoal(
  kids: KidProfile[],
  kidId: string,
  goalId: string,
  amountCents: number,
) {
  const createdAt = new Date().toISOString();

  return kids.map((kid) => {
    if (kid.id !== kidId || amountCents <= 0) {
      return kid;
    }

    const availableAmount = Math.min(kid.walletCents, amountCents);

    return {
      ...kid,
      walletCents: kid.walletCents - availableAmount,
      goals: kid.goals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              savedCents: Math.min(
                goal.savedCents + availableAmount,
                goal.targetCents,
              ),
            }
          : goal,
      ),
      transactions: [
        {
          id: createKidMoneyId("goal-save", createdAt),
          type: "goal-save" as const,
          amountCents: availableAmount,
          label: "Moved to savings goal",
          createdAt,
        },
        ...kid.transactions,
      ],
    };
  });
}

export function requestChoreApproval(
  kids: KidProfile[],
  kidId: string,
  choreId: string,
) {
  return kids.map((kid) =>
    kid.id === kidId
      ? {
          ...kid,
          chores: kid.chores.map((chore) =>
            chore.id === choreId && chore.status === "available"
              ? { ...chore, status: "pending" as const }
              : chore,
          ),
        }
      : kid,
  );
}

export function approveChore(kids: KidProfile[], kidId: string, choreId: string) {
  const createdAt = new Date().toISOString();

  return kids.map((kid) => {
    if (kid.id !== kidId) {
      return kid;
    }

    const chore = kid.chores.find((item) => item.id === choreId);
    if (!chore || chore.status !== "pending") {
      return kid;
    }

    return {
      ...kid,
      walletCents: kid.walletCents + chore.rewardCents,
      chores: kid.chores.map((item) =>
        item.id === choreId ? { ...item, status: "approved" as const } : item,
      ),
      transactions: [
        {
          id: createKidMoneyId(chore.title, createdAt),
          type: "chore" as const,
          amountCents: chore.rewardCents,
          label: chore.title,
          createdAt,
        },
        ...kid.transactions,
      ],
    };
  });
}

export function addKidGoal(
  kids: KidProfile[],
  kidId: string,
  goal: Omit<KidGoal, "id" | "savedCents">,
) {
  return kids.map((kid) =>
    kid.id === kidId
      ? {
          ...kid,
          goals: [
            ...kid.goals,
            {
              ...goal,
              id: createKidMoneyId(goal.name, new Date().toISOString()),
              savedCents: 0,
            },
          ],
        }
      : kid,
  );
}

export function createKidMoneyId(label: string, createdAt: string) {
  return `${createdAt}-${label}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
