import { AppFrame } from "@/components/app-frame";
import { RemindersWorkspace } from "@/components/reminders-workspace";
import { getLocalIsoDate } from "@/lib/date-utils";
import { getHouseholdPeople, getReminders } from "@/lib/household-data";
import { requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const profile = await requireProfile();
  const [reminders, people] = await Promise.all([
    getReminders(profile),
    getHouseholdPeople(profile),
  ]);

  return (
    <AppFrame>
      <RemindersWorkspace
        key={JSON.stringify(reminders)}
        householdId={profile.household_id}
        initialReminders={reminders}
        people={people}
        today={getLocalIsoDate()}
      />
    </AppFrame>
  );
}
