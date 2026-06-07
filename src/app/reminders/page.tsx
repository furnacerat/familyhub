import { AppFrame } from "@/components/app-frame";
import { RemindersWorkspace } from "@/components/reminders-workspace";
import { initialReminders } from "@/lib/reminder-data";

export default function RemindersPage() {
  return (
    <AppFrame>
      <RemindersWorkspace initialReminders={initialReminders} />
    </AppFrame>
  );
}
