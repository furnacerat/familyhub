import type { KidProfile } from "@/lib/kids-money-utils";

export const initialKidsMoney: KidProfile[] = [
  {
    id: "avery",
    name: "Avery",
    walletCents: 2450,
    allowanceCents: 500,
    allowanceDay: "Sunday",
    goals: [
      {
        id: "avery-bike-helmet",
        name: "Bike helmet",
        savedCents: 1800,
        targetCents: 3500,
      },
    ],
    chores: [
      {
        id: "avery-trash",
        title: "Trash bins",
        rewardCents: 200,
        status: "available",
      },
      {
        id: "avery-dog",
        title: "Feed dog",
        rewardCents: 100,
        status: "pending",
      },
    ],
    transactions: [
      {
        id: "avery-allowance",
        type: "deposit",
        amountCents: 500,
        label: "Allowance",
        createdAt: "2026-06-02T09:00:00",
      },
    ],
  },
  {
    id: "mia",
    name: "Mia",
    walletCents: 4100,
    allowanceCents: 500,
    allowanceDay: "Sunday",
    goals: [
      {
        id: "mia-art-set",
        name: "Art set",
        savedCents: 2800,
        targetCents: 5000,
      },
    ],
    chores: [
      {
        id: "mia-dishes",
        title: "Dishes",
        rewardCents: 200,
        status: "available",
      },
      {
        id: "mia-room",
        title: "Room reset",
        rewardCents: 300,
        status: "available",
      },
    ],
    transactions: [
      {
        id: "mia-chore",
        type: "chore",
        amountCents: 300,
        label: "Helped with laundry",
        createdAt: "2026-06-03T12:00:00",
      },
    ],
  },
];
