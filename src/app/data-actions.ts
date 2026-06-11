"use server";

import { revalidatePath } from "next/cache";

import type { BillCategory, BillPriority } from "@/lib/budget-engine";
import type { CalendarEventCategory } from "@/lib/calendar-utils";
import { addCadence, type MaintenanceCadenceUnit } from "@/lib/maintenance-utils";
import type { ReminderPriority, ReminderStatus } from "@/lib/reminder-utils";
import { parseIcsEvents } from "@/lib/calendar-ics";
import { canAccessBudget, requireProfile, requireRole } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

type CalendarInput = {
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  person: string;
  location?: string;
  category: CalendarEventCategory;
  notes?: string;
  requiresAdultApproval?: boolean;
};

export async function createCalendarEvent(input: CalendarInput) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").insert({
    household_id: profile.household_id,
    title: input.title,
    event_date: input.date,
    start_time: input.startTime,
    end_time: input.endTime || null,
    person: input.person,
    location: input.location || null,
    category: input.category,
    notes: input.notes || null,
    requires_adult_approval: input.requiresAdultApproval ?? false,
    created_by: profile.id,
  });

  assertMutation(error);
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function createListItem(input: {
  name: string;
  list: string;
  addedBy: string;
  quantity?: string;
  notes?: string;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: existingList, error: findError } = await supabase
    .from("household_lists")
    .select("id")
    .eq("household_id", profile.household_id)
    .eq("list_type", input.list)
    .maybeSingle();

  assertMutation(findError);

  let listId = existingList?.id;
  if (!listId) {
    const { data: newList, error: listError } = await supabase
      .from("household_lists")
      .insert({
        household_id: profile.household_id,
        name: toTitle(input.list),
        list_type: input.list,
      })
      .select("id")
      .single();
    assertMutation(listError);
    if (!newList) {
      throw new Error("Unable to create list.");
    }
    listId = newList.id;
  }

  const { error } = await supabase.from("list_items").insert({
    household_id: profile.household_id,
    list_id: listId,
    name: input.name,
    quantity: input.quantity || null,
    notes: input.notes || null,
    added_by: input.addedBy,
  });

  assertMutation(error);
  revalidatePath("/lists");
  revalidatePath("/");
}

export async function setListItemChecked(id: string, checked: boolean) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("list_items")
    .update({ checked })
    .eq("id", id)
    .eq("household_id", profile.household_id);
  assertMutation(error);
  revalidatePath("/lists");
  revalidatePath("/");
}

export async function deleteListItem(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("id", id)
    .eq("household_id", profile.household_id);
  assertMutation(error);
  revalidatePath("/lists");
  revalidatePath("/");
}

export async function createReminder(input: {
  title: string;
  dueDate: string;
  owner: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  notes?: string;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("reminders").insert({
    household_id: profile.household_id,
    title: input.title,
    due_date: input.dueDate,
    owner: input.owner,
    priority: input.priority,
    status: input.status,
    notes: input.notes || null,
  });
  assertMutation(error);
  revalidatePath("/reminders");
  revalidatePath("/");
}

export async function setReminderStatus(id: string, status: ReminderStatus) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("reminders")
    .update({ status })
    .eq("id", id)
    .eq("household_id", profile.household_id);
  assertMutation(error);
  revalidatePath("/reminders");
  revalidatePath("/");
}

export async function deleteReminder(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", id)
    .eq("household_id", profile.household_id);
  assertMutation(error);
  revalidatePath("/reminders");
  revalidatePath("/");
}

export async function createMaintenanceTask(input: {
  title: string;
  category: string;
  appliesTo: string;
  assignedTo: string;
  cadenceValue: number;
  cadenceUnit: MaintenanceCadenceUnit;
  nextDueDate?: string;
  currentMileage?: number;
  nextDueMileage?: number;
  notes?: string;
}) {
  const profile = await requireProfile();
  requireRole(profile, ["owner", "adult"]);
  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_tasks").insert({
    household_id: profile.household_id,
    title: input.title,
    category: input.category,
    applies_to: input.appliesTo,
    assigned_to: input.assignedTo,
    cadence_value: input.cadenceValue,
    cadence_unit: input.cadenceUnit,
    next_due_date: input.nextDueDate || null,
    current_mileage: input.currentMileage ?? null,
    next_due_mileage: input.nextDueMileage ?? null,
    notes: input.notes || null,
  });
  assertMutation(error);
  revalidatePath("/maintain");
  revalidatePath("/");
}

export async function completeMaintenance(input: {
  taskId: string;
  completedAt: string;
  mileage?: number;
  note?: string;
  cadenceValue: number;
  cadenceUnit: MaintenanceCadenceUnit;
}) {
  const profile = await requireProfile();
  requireRole(profile, ["owner", "adult"]);
  const supabase = await createClient();
  const nextDueDate =
    input.cadenceUnit === "miles"
      ? null
      : addCadence(
          input.completedAt,
          input.cadenceValue,
          input.cadenceUnit,
        );
  const nextDueMileage =
    input.cadenceUnit === "miles" && input.mileage
      ? input.mileage + input.cadenceValue
      : null;

  const { error: completionError } = await supabase
    .from("maintenance_completions")
    .insert({
      household_id: profile.household_id,
      task_id: input.taskId,
      completed_at: input.completedAt,
      mileage: input.mileage ?? null,
      note: input.note || null,
    });
  assertMutation(completionError);

  const { error: taskError } = await supabase
    .from("maintenance_tasks")
    .update({
      last_completed_date: input.completedAt,
      last_completed_mileage: input.mileage ?? null,
      current_mileage: input.mileage ?? undefined,
      next_due_date: nextDueDate ?? undefined,
      next_due_mileage: nextDueMileage ?? undefined,
    })
    .eq("id", input.taskId)
    .eq("household_id", profile.household_id);
  assertMutation(taskError);
  revalidatePath("/maintain");
  revalidatePath("/");
}

export async function createKidGoal(input: {
  kidId: string;
  name: string;
  targetCents: number;
}) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_kid_goal", {
    goal_kid_id: input.kidId,
    goal_name: input.name,
    goal_target_cents: input.targetCents,
  });
  assertMutation(error);
  revalidatePath("/kids");
  revalidatePath("/");
}

export async function addKidMoney(input: {
  kidId: string;
  type: "deposit" | "spend";
  amountCents: number;
  label: string;
}) {
  const profile = await requireProfile();
  requireRole(profile, ["owner", "adult"]);
  const supabase = await createClient();
  const { data: kid, error: readError } = await supabase
    .from("kid_profiles")
    .select("wallet_cents")
    .eq("id", input.kidId)
    .eq("household_id", profile.household_id)
    .single();
  assertMutation(readError);
  if (!kid) {
    throw new Error("Child profile not found.");
  }

  const signedAmount =
    input.type === "spend" ? -input.amountCents : input.amountCents;
  const { error: updateError } = await supabase
    .from("kid_profiles")
    .update({ wallet_cents: Math.max(kid.wallet_cents + signedAmount, 0) })
    .eq("id", input.kidId)
    .eq("household_id", profile.household_id);
  assertMutation(updateError);

  const { error: transactionError } = await supabase
    .from("kid_transactions")
    .insert({
      household_id: profile.household_id,
      kid_id: input.kidId,
      transaction_type: input.type,
      amount_cents: input.amountCents,
      label: input.label,
    });
  assertMutation(transactionError);
  revalidatePath("/kids");
  revalidatePath("/");
}

export async function saveToKidGoal(input: {
  kidId: string;
  goalId: string;
  amountCents: number;
}) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_to_kid_goal", {
    savings_kid_id: input.kidId,
    savings_goal_id: input.goalId,
    requested_cents: input.amountCents,
  });
  assertMutation(error);
  revalidatePath("/kids");
  revalidatePath("/");
}

export async function createKidProfile(input: {
  name: string;
  birthDate?: string;
  allowanceCents: number;
  allowanceDay: string;
  profileId?: string;
}) {
  const profile = await requireProfile();
  requireRole(profile, ["owner"]);
  const supabase = await createClient();
  const { error } = await supabase.from("kid_profiles").insert({
    household_id: profile.household_id,
    name: input.name,
    birth_date: input.birthDate || null,
    allowance_cents: input.allowanceCents,
    allowance_day: input.allowanceDay,
    profile_id: input.profileId || null,
  });
  assertMutation(error);
  revalidatePath("/settings/family");
  revalidatePath("/kids");
}

export async function linkKidProfile(kidId: string, profileId?: string) {
  const profile = await requireProfile();
  requireRole(profile, ["owner"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("kid_profiles")
    .update({ profile_id: profileId || null })
    .eq("id", kidId)
    .eq("household_id", profile.household_id);
  assertMutation(error);
  revalidatePath("/settings/family");
  revalidatePath("/kids");
}

export async function requestKidChore(
  kidId: string,
  choreId: string,
  proofNote?: string,
) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_kid_chore", {
    requested_kid_id: kidId,
    requested_chore_id: choreId,
    completion_note: proofNote || null,
  });
  assertMutation(error);
  revalidatePath("/kids");
  revalidatePath("/");
}

export async function createKidResponsibility(input: {
  kidId: string;
  title: string;
  responsibilityType: "family" | "paid-job";
  recurrence: "once" | "daily" | "weekly" | "monthly";
  rewardCents: number;
  dueDate?: string;
  dueTime?: string;
}) {
  const profile = await requireProfile();
  requireRole(profile, ["owner", "adult"]);
  const supabase = await createClient();
  const { error } = await supabase.from("kid_chores").insert({
    household_id: profile.household_id,
    kid_id: input.kidId,
    title: input.title,
    responsibility_type: input.responsibilityType,
    recurrence: input.recurrence,
    reward_cents:
      input.responsibilityType === "paid-job" ? input.rewardCents : 0,
    due_date: input.dueDate || null,
    due_time: input.dueTime || null,
  });
  assertMutation(error);
  revalidatePath("/kids");
  revalidatePath("/");
}

export async function returnKidChore(kidId: string, choreId: string) {
  const profile = await requireProfile();
  requireRole(profile, ["owner", "adult"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("kid_chores")
    .update({ status: "available", proof_note: null, requested_at: null })
    .eq("id", choreId)
    .eq("kid_id", kidId)
    .eq("household_id", profile.household_id);
  assertMutation(error);
  revalidatePath("/kids");
  revalidatePath("/");
}

export async function approveKidChore(kidId: string, choreId: string) {
  const profile = await requireProfile();
  requireRole(profile, ["owner", "adult"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_kid_chore", {
    approved_kid_id: kidId,
    approved_chore_id: choreId,
  });
  assertMutation(error);
  revalidatePath("/kids");
  revalidatePath("/");
}

export async function createPaycheck(input: {
  earner: string;
  amountCents: number;
  payDate: string;
}) {
  const profile = await requireProfile();
  assertBudget(profile);
  const supabase = await createClient();
  const { error } = await supabase.from("budget_paychecks").insert({
    household_id: profile.household_id,
    earner: input.earner,
    amount_cents: input.amountCents,
    pay_date: input.payDate,
  });
  assertMutation(error);
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function createBill(input: {
  name: string;
  category: BillCategory;
  amountCents: number;
  dueDate: string;
  priority: BillPriority;
}) {
  const profile = await requireProfile();
  assertBudget(profile);
  const supabase = await createClient();
  const { error } = await supabase.from("budget_bills").insert({
    household_id: profile.household_id,
    name: input.name,
    category: input.category,
    amount_cents: input.amountCents,
    due_date: input.dueDate,
    priority: input.priority,
  });
  assertMutation(error);
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function createRideRequest(input: {
  kidId: string;
  pickup: string;
  destination: string;
  neededAt: string;
  notes?: string;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("ride_requests").insert({
    household_id: profile.household_id,
    kid_id: input.kidId,
    pickup: input.pickup,
    destination: input.destination,
    needed_at: input.neededAt,
    notes: input.notes || null,
    created_by: profile.id,
  });
  assertMutation(error);
  revalidatePath("/teen");
  revalidatePath("/");
}

export async function updateRideRequest(
  id: string,
  status: "claimed" | "completed" | "cancelled",
  driverName?: string,
) {
  const profile = await requireProfile();
  requireRole(profile, ["owner", "adult"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("ride_requests")
    .update({ status, driver_name: driverName || profile.display_name })
    .eq("id", id)
    .eq("household_id", profile.household_id);
  assertMutation(error);
  revalidatePath("/teen");
  revalidatePath("/");
}

export async function createWorkEntry(input: {
  kidId: string;
  employer: string;
  shiftDate: string;
  startTime: string;
  endTime?: string;
  expectedIncomeCents: number;
  notes?: string;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("teen_work_entries").insert({
    household_id: profile.household_id,
    kid_id: input.kidId,
    employer: input.employer,
    shift_date: input.shiftDate,
    start_time: input.startTime,
    end_time: input.endTime || null,
    expected_income_cents: input.expectedIncomeCents,
    notes: input.notes || null,
    created_by: profile.id,
  });
  assertMutation(error);
  revalidatePath("/teen");
  revalidatePath("/");
}

export async function createVehicleLog(input: {
  kidId: string;
  vehicle: string;
  entryType: "fuel" | "mileage" | "maintenance" | "insurance";
  loggedOn: string;
  amountCents: number;
  mileage?: number;
  notes?: string;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("teen_vehicle_logs").insert({
    household_id: profile.household_id,
    kid_id: input.kidId,
    vehicle: input.vehicle,
    entry_type: input.entryType,
    logged_on: input.loggedOn,
    amount_cents: input.amountCents,
    mileage: input.mileage ?? null,
    notes: input.notes || null,
    created_by: profile.id,
  });
  assertMutation(error);
  revalidatePath("/teen");
}

export async function createTeenMoneyItem(input: {
  kidId: string;
  itemType: "spending-plan" | "reimbursement";
  label: string;
  amountCents: number;
  dueDate?: string;
  direction?: "family-owes-kid" | "kid-owes-family";
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("teen_money_items").insert({
    household_id: profile.household_id,
    kid_id: input.kidId,
    item_type: input.itemType,
    label: input.label,
    amount_cents: input.amountCents,
    due_date: input.dueDate || null,
    direction: input.direction || null,
    created_by: profile.id,
  });
  assertMutation(error);
  revalidatePath("/teen");
}

export async function settleTeenMoneyItem(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("teen_money_items")
    .update({ status: "settled" })
    .eq("id", id)
    .eq("household_id", profile.household_id);
  assertMutation(error);
  revalidatePath("/teen");
}

export async function markNotificationRead(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_profile_id", profile.id);
  assertMutation(error);
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_profile_id", profile.id)
    .is("read_at", null);
  assertMutation(error);
  revalidatePath("/notifications");
}

export async function updateNotificationPreferences(input: {
  dailyDigest: boolean;
  digestTime: string;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("notification_preferences").upsert({
    profile_id: profile.id,
    household_id: profile.household_id,
    in_app: true,
    daily_digest: input.dailyDigest,
    digest_time: input.digestTime,
  });
  assertMutation(error);
  revalidatePath("/notifications");
}

export async function createCalendarFeedToken() {
  const profile = await requireProfile();
  requireRole(profile, ["owner", "adult"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_feed_tokens")
    .insert({
      household_id: profile.household_id,
      created_by: profile.id,
    })
    .select("token")
    .single();
  assertMutation(error);
  if (!data) throw new Error("Unable to create calendar feed.");
  revalidatePath("/calendar/integrations");
  return data.token as string;
}

export async function importIcsCalendar(source: string) {
  const profile = await requireProfile();
  const events = parseIcsEvents(source);
  if (!events.length) throw new Error("No calendar events were found.");
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").insert(
    events.slice(0, 250).map((event) => ({
      household_id: profile.household_id,
      title: event.title,
      event_date: event.date,
      start_time: event.startTime,
      end_time: event.endTime || null,
      person: event.person,
      location: event.location || null,
      category: event.category,
      notes: event.notes || null,
      created_by: profile.id,
    })),
  );
  assertMutation(error);
  revalidatePath("/calendar");
  revalidatePath("/");
  return events.length;
}

function assertBudget(profile: Awaited<ReturnType<typeof requireProfile>>) {
  if (!canAccessBudget(profile)) {
    throw new Error("Budget access is required.");
  }
}

function assertMutation(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function toTitle(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
