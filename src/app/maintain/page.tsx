import { AppFrame } from "@/components/app-frame";
import { MaintenanceWorkspace } from "@/components/maintenance-workspace";
import { initialMaintenanceTasks } from "@/lib/maintenance-data";
import { requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function MaintainPage() {
  await requireProfile();

  return (
    <AppFrame>
      <MaintenanceWorkspace initialTasks={initialMaintenanceTasks} />
    </AppFrame>
  );
}
