import { AppFrame } from "@/components/app-frame";
import { FamilySettings } from "@/components/family-settings";
import { getKidsMoney } from "@/lib/household-data";
import { requireProfile, requireRole } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { HouseholdProfile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function FamilySettingsPage() {
  const profile = await requireProfile();
  requireRole(profile, ["owner"]);
  const supabase = await createClient();
  const [kids, { data: childAccounts }] = await Promise.all([
    getKidsMoney(profile),
    supabase
      .from("profiles")
      .select("id, household_id, email, display_name, role, budget_access")
      .eq("household_id", profile.household_id)
      .eq("role", "child")
      .order("display_name"),
  ]);

  return (
    <AppFrame>
      <FamilySettings
        kids={kids}
        childAccounts={(childAccounts ?? []) as HouseholdProfile[]}
      />
    </AppFrame>
  );
}
