"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireRole } from "@/lib/supabase/auth";
import type { HouseholdRole } from "@/lib/supabase/types";

export async function createInvite(formData: FormData) {
  const profile = await requireProfile();
  requireRole(profile, ["owner"]);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member") as HouseholdRole;
  const budgetAccess = formData.get("budgetAccess") === "on";
  const supabase = await createClient();

  const { data: token, error } = await supabase.rpc("create_household_invite", {
    invite_email: email,
    invite_role: role,
    invite_budget_access: budgetAccess,
  });

  if (error || !token) {
    redirect(`/settings/invites?message=${encodeURIComponent(error?.message ?? "Invite failed")}`);
  }

  const origin = (await headers()).get("origin") ?? "http://127.0.0.1:3000";
  const inviteUrl = `${origin}/invite/${token}`;

  redirect(`/settings/invites?invite=${encodeURIComponent(inviteUrl)}&email=${encodeURIComponent(email)}`);
}

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const supabase = await createClient();

  const { error } = await supabase.rpc("accept_household_invite", {
    invite_token: token,
    display_name: displayName,
  });

  if (error) {
    redirect(`/invite/${token}?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}
