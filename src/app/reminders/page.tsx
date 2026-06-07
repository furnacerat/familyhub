import { AppFrame } from "@/components/app-frame";
import { RemindersWorkspace } from "@/components/reminders-workspace";
import { initialReminders } from "@/lib/reminder-data";
import { requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  await requireProfile();

  return (
    <AppFrame>
      <RemindersWorkspace initialReminders={initialReminders} />
    </AppFrame>
  );
}
