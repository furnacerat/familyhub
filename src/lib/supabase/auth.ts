import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { HouseholdProfile, HouseholdRole } from "@/lib/supabase/types";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, household_id, email, display_name, role, budget_access")
    .eq("id", user.id)
    .maybeSingle();

  return profile as HouseholdProfile | null;
}

export async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/setup");
  }

  return profile;
}

export function canAccessBudget(profile: HouseholdProfile) {
  return (
    profile.budget_access &&
    (profile.role === "owner" || profile.role === "adult")
  );
}

export function requireRole(profile: HouseholdProfile, roles: HouseholdRole[]) {
  if (!roles.includes(profile.role)) {
    redirect("/");
  }
}
