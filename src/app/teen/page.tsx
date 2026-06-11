import { AppFrame } from "@/components/app-frame";
import { TeenWorkspace } from "@/components/teen-workspace";
import { getKidsMoney, getTeenData } from "@/lib/household-data";
import { requireProfile, requireRole } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function TeenPage() {
  const profile = await requireProfile();
  requireRole(profile, ["owner", "adult", "child"]);
  const [kids, data] = await Promise.all([
    getKidsMoney(profile),
    getTeenData(),
  ]);

  return (
    <AppFrame>
      <TeenWorkspace
        key={JSON.stringify(data)}
        householdId={profile.household_id}
        kids={kids}
        data={data}
        canManage={profile.role === "owner" || profile.role === "adult"}
      />
    </AppFrame>
  );
}
