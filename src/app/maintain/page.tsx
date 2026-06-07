import { AppFrame } from "@/components/app-frame";
import { MaintenanceWorkspace } from "@/components/maintenance-workspace";
import { initialMaintenanceTasks } from "@/lib/maintenance-data";

export default function MaintainPage() {
  return (
    <AppFrame>
      <MaintenanceWorkspace initialTasks={initialMaintenanceTasks} />
    </AppFrame>
  );
}
