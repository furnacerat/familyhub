import { AppFrame } from "@/components/app-frame";
import { KidsMoneyWorkspace } from "@/components/kids-money-workspace";
import { getKidsMoney } from "@/lib/household-data";
import { requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function KidsPage() {
  const profile = await requireProfile();
  const kids = await getKidsMoney(profile);

  return (
    <AppFrame>
      <KidsMoneyWorkspace
        key={JSON.stringify(kids)}
        householdId={profile.household_id}
        initialKids={kids}
        canManage={profile.role === "owner" || profile.role === "adult"}
        viewMode={profile.role === "child" ? "child" : "parent"}
      />
    </AppFrame>
  );
}
