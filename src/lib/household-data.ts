import "server-only";

import type { Bill, BudgetReserve, Paycheck } from "@/lib/budget-engine";
import type { CalendarEvent } from "@/lib/calendar-utils";
import type { KidProfile } from "@/lib/kids-money-utils";
import type { HouseholdListItem, HouseholdListType } from "@/lib/list-utils";
import type { MaintenanceTask } from "@/lib/maintenance-utils";
import type { Reminder } from "@/lib/reminder-utils";
import { createClient } from "@/lib/supabase/server";
import type { HouseholdProfile } from "@/lib/supabase/types";
import type { TeenData } from "@/lib/teen-utils";
import type {
  NotificationItem,
  NotificationPreferences,
} from "@/lib/notification-utils";

export async function getHouseholdPeople(profile: HouseholdProfile) {
  const supabase = await createClient();
  const [{ data: profiles }, { data: kids }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("household_id", profile.household_id)
      .order("display_name"),
    supabase
      .from("kid_profiles")
      .select("name")
      .eq("household_id", profile.household_id)
      .order("name"),
  ]);

  return Array.from(
    new Set([
      "Family",
      ...(profiles ?? []).map((item) => item.display_name),
      ...(kids ?? []).map((item) => item.name),
    ]),
  );
}

export async function getCalendarEvents(profile: HouseholdProfile) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("event_date")
    .order("start_time");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(
    (row): CalendarEvent => ({
      id: row.id,
      title: row.title,
      date: row.event_date,
      startTime: trimTime(row.start_time),
      endTime: row.end_time ? trimTime(row.end_time) : undefined,
      person: row.person,
      location: row.location ?? undefined,
      category: row.category as CalendarEvent["category"],
      notes: row.notes ?? undefined,
      requiresAdultApproval: row.requires_adult_approval,
    }),
  );
}

export async function getListItems(profile: HouseholdProfile) {
  const supabase = await createClient();
  const [{ data: lists, error: listError }, { data: items, error: itemError }] =
    await Promise.all([
      supabase
        .from("household_lists")
        .select("id, list_type")
        .eq("household_id", profile.household_id),
      supabase
        .from("list_items")
        .select("*")
        .eq("household_id", profile.household_id)
        .order("created_at", { ascending: false }),
    ]);

  if (listError || itemError) {
    throw new Error(listError?.message ?? itemError?.message);
  }

  const listTypes = new Map(
    (lists ?? []).map((list) => [list.id, list.list_type as HouseholdListType]),
  );

  return (items ?? []).map(
    (row): HouseholdListItem => ({
      id: row.id,
      name: row.name,
      list: listTypes.get(row.list_id ?? "") ?? "other",
      addedBy: row.added_by,
      checked: row.checked,
      quantity: row.quantity ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.created_at,
    }),
  );
}

export async function getReminders(profile: HouseholdProfile) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("due_date");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(
    (row): Reminder => ({
      id: row.id,
      title: row.title,
      dueDate: row.due_date,
      owner: row.owner,
      status: row.status as Reminder["status"],
      priority: row.priority as Reminder["priority"],
      notes: row.notes ?? undefined,
      createdAt: row.created_at,
    }),
  );
}

export async function getKidsMoney(profile: HouseholdProfile) {
  const supabase = await createClient();
  const { data: kids, error: kidError } = await supabase
    .from("kid_profiles")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("name");

  if (kidError) {
    throw new Error(kidError.message);
  }

  const kidIds = (kids ?? []).map((kid) => kid.id);
  if (!kidIds.length) {
    return [];
  }

  const [
    { data: goals, error: goalError },
    { data: chores, error: choreError },
    { data: transactions, error: transactionError },
  ] = await Promise.all([
    supabase.from("kid_goals").select("*").in("kid_id", kidIds),
    supabase.from("kid_chores").select("*").in("kid_id", kidIds),
    supabase
      .from("kid_transactions")
      .select("*")
      .in("kid_id", kidIds)
      .order("created_at", { ascending: false }),
  ]);

  if (goalError || choreError || transactionError) {
    throw new Error(
      goalError?.message ?? choreError?.message ?? transactionError?.message,
    );
  }

  return (kids ?? []).map(
    (kid): KidProfile => ({
      id: kid.id,
      name: kid.name,
      birthDate: kid.birth_date ?? undefined,
      profileId: kid.profile_id ?? undefined,
      walletCents: kid.wallet_cents,
      allowanceCents: kid.allowance_cents,
      allowanceDay: kid.allowance_day,
      goals: (goals ?? [])
        .filter((goal) => goal.kid_id === kid.id)
        .map((goal) => ({
          id: goal.id,
          name: goal.name,
          targetCents: goal.target_cents,
          savedCents: goal.saved_cents,
        })),
      chores: (chores ?? [])
        .filter((chore) => chore.kid_id === kid.id)
        .map((chore) => ({
          id: chore.id,
          title: chore.title,
          rewardCents: chore.reward_cents,
          status: chore.status as KidProfile["chores"][number]["status"],
          responsibilityType:
            (chore.responsibility_type as KidProfile["chores"][number]["responsibilityType"]) ??
            "paid-job",
          recurrence:
            (chore.recurrence as KidProfile["chores"][number]["recurrence"]) ??
            "once",
          dueDate: chore.due_date ?? undefined,
          dueTime: chore.due_time ? trimTime(chore.due_time) : undefined,
          proofNote: chore.proof_note ?? undefined,
          streakCount: chore.streak_count ?? 0,
        })),
      transactions: (transactions ?? [])
        .filter((transaction) => transaction.kid_id === kid.id)
        .map((transaction) => ({
          id: transaction.id,
          type: transaction.transaction_type as KidProfile["transactions"][number]["type"],
          amountCents: transaction.amount_cents,
          label: transaction.label,
          createdAt: transaction.created_at,
        })),
    }),
  );
}

export async function getMaintenanceTasks(profile: HouseholdProfile) {
  const supabase = await createClient();
  const { data: tasks, error: taskError } = await supabase
    .from("maintenance_tasks")
    .select("*")
    .eq("household_id", profile.household_id);

  if (taskError) {
    throw new Error(taskError.message);
  }

  const taskIds = (tasks ?? []).map((task) => task.id);
  const { data: completions, error: completionError } = taskIds.length
    ? await supabase
        .from("maintenance_completions")
        .select("*")
        .in("task_id", taskIds)
        .order("completed_at", { ascending: false })
    : { data: [], error: null };

  if (completionError) {
    throw new Error(completionError.message);
  }

  return (tasks ?? []).map(
    (task): MaintenanceTask => ({
      id: task.id,
      title: task.title,
      category: task.category as MaintenanceTask["category"],
      appliesTo: task.applies_to,
      assignedTo: task.assigned_to,
      cadenceValue: task.cadence_value,
      cadenceUnit: task.cadence_unit as MaintenanceTask["cadenceUnit"],
      lastCompletedDate: task.last_completed_date ?? undefined,
      nextDueDate: task.next_due_date ?? undefined,
      lastCompletedMileage: task.last_completed_mileage ?? undefined,
      currentMileage: task.current_mileage ?? undefined,
      nextDueMileage: task.next_due_mileage ?? undefined,
      notes: task.notes ?? undefined,
      completedHistory: (completions ?? [])
        .filter((completion) => completion.task_id === task.id)
        .map((completion) => ({
          id: completion.id,
          completedAt: completion.completed_at,
          mileage: completion.mileage ?? undefined,
          note: completion.note ?? undefined,
        })),
    }),
  );
}

export async function getBudgetData(profile: HouseholdProfile) {
  const supabase = await createClient();
  const [
    { data: paychecks, error: paycheckError },
    { data: bills, error: billError },
    { data: reserves, error: reserveError },
  ] = await Promise.all([
    supabase
      .from("budget_paychecks")
      .select("*")
      .eq("household_id", profile.household_id)
      .order("pay_date"),
    supabase
      .from("budget_bills")
      .select("*")
      .eq("household_id", profile.household_id)
      .order("due_date"),
    supabase
      .from("budget_reserves")
      .select("*")
      .eq("household_id", profile.household_id),
  ]);

  if (paycheckError || billError || reserveError) {
    throw new Error(
      paycheckError?.message ?? billError?.message ?? reserveError?.message,
    );
  }

  return {
    paychecks: (paychecks ?? []).map(
      (row): Paycheck => ({
        id: row.id,
        earner: row.earner,
        amountCents: row.amount_cents,
        payDate: row.pay_date,
        status: row.status as Paycheck["status"],
      }),
    ),
    bills: (bills ?? []).map(
      (row): Bill => ({
        id: row.id,
        name: row.name,
        category: row.category as Bill["category"],
        amountCents: row.amount_cents,
        dueDate: row.due_date,
        paid: row.paid,
        priority: row.priority as Bill["priority"],
        minimumPaymentCents: row.minimum_payment_cents ?? undefined,
        canSplit: row.can_split,
        hasLateFeeRisk: row.has_late_fee_risk,
        hasShutoffRisk: row.has_shutoff_risk,
        autopay: row.autopay,
      }),
    ),
    reserves: (reserves ?? []).map(
      (row): BudgetReserve => ({
        id: row.id,
        name: row.name,
        amountCents: row.amount_cents,
        category: row.category as BudgetReserve["category"],
        priority: row.priority as BudgetReserve["priority"],
      }),
    ),
  };
}

function trimTime(time: string) {
  return time.slice(0, 5);
}

export async function getTeenData(): Promise<TeenData> {
  const supabase = await createClient();
  const [
    { data: rides, error: rideError },
    { data: work, error: workError },
    { data: vehicles, error: vehicleError },
    { data: money, error: moneyError },
  ] = await Promise.all([
    supabase.from("ride_requests").select("*").order("needed_at"),
    supabase.from("teen_work_entries").select("*").order("shift_date"),
    supabase.from("teen_vehicle_logs").select("*").order("logged_on", { ascending: false }),
    supabase.from("teen_money_items").select("*").order("created_at", { ascending: false }),
  ]);

  if (rideError || workError || vehicleError || moneyError) {
    throw new Error(
      rideError?.message ??
        workError?.message ??
        vehicleError?.message ??
        moneyError?.message,
    );
  }

  return {
    rides: (rides ?? []).map((row) => ({
      id: row.id,
      kidId: row.kid_id,
      pickup: row.pickup,
      destination: row.destination,
      neededAt: row.needed_at,
      status: row.status,
      driverName: row.driver_name ?? undefined,
      notes: row.notes ?? undefined,
    })),
    work: (work ?? []).map((row) => ({
      id: row.id,
      kidId: row.kid_id,
      employer: row.employer,
      shiftDate: row.shift_date,
      startTime: trimTime(row.start_time),
      endTime: row.end_time ? trimTime(row.end_time) : undefined,
      expectedIncomeCents: row.expected_income_cents,
      notes: row.notes ?? undefined,
    })),
    vehicles: (vehicles ?? []).map((row) => ({
      id: row.id,
      kidId: row.kid_id,
      vehicle: row.vehicle,
      entryType: row.entry_type,
      loggedOn: row.logged_on,
      amountCents: row.amount_cents,
      mileage: row.mileage ?? undefined,
      notes: row.notes ?? undefined,
    })),
    money: (money ?? []).map((row) => ({
      id: row.id,
      kidId: row.kid_id,
      itemType: row.item_type,
      label: row.label,
      amountCents: row.amount_cents,
      dueDate: row.due_date ?? undefined,
      direction: row.direction ?? undefined,
      status: row.status,
    })),
  };
}

export async function getNotifications(profile: HouseholdProfile) {
  const supabase = await createClient();
  const [{ data: notifications, error }, { data: preferences }] =
    await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("recipient_profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("profile_id", profile.id)
        .maybeSingle(),
    ]);

  if (error) throw new Error(error.message);

  return {
    notifications: (notifications ?? []).map(
      (row): NotificationItem => ({
        id: row.id,
        title: row.title,
        body: row.body,
        href: row.href ?? undefined,
        type: row.notification_type,
        readAt: row.read_at ?? undefined,
        createdAt: row.created_at,
      }),
    ),
    preferences: {
      inApp: preferences?.in_app ?? true,
      dailyDigest: preferences?.daily_digest ?? false,
      digestTime: preferences?.digest_time?.slice(0, 5) ?? "18:00",
    } satisfies NotificationPreferences,
  };
}
