import { AppFrame } from "@/components/app-frame";
import { MaintenanceWorkspace } from "@/components/maintenance-workspace";
import { getLocalIsoDate } from "@/lib/date-utils";
import { getHouseholdPeople, getMaintenanceTasks } from "@/lib/household-data";
import { requireProfile, requireRole } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function MaintainPage() {
  const profile = await requireProfile();
  requireRole(profile, ["owner", "adult", "member"]);
  const [tasks, people] = await Promise.all([
    getMaintenanceTasks(profile),
    getHouseholdPeople(profile),
  ]);

  return (
    <AppFrame>
      <MaintenanceWorkspace
        key={JSON.stringify(tasks)}
        householdId={profile.household_id}
        initialTasks={tasks}
        people={people}
        today={getLocalIsoDate()}
        canEdit={profile.role === "owner" || profile.role === "adult"}
      />
    </AppFrame>
  );
}
