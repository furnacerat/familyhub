import { AppFrame } from "@/components/app-frame";
import { CalendarWorkspace } from "@/components/calendar-workspace";
import { getWeekStart } from "@/lib/date-utils";
import { getCalendarEvents, getHouseholdPeople } from "@/lib/household-data";
import { requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const profile = await requireProfile();
  const [events, people] = await Promise.all([
    getCalendarEvents(profile),
    getHouseholdPeople(profile),
  ]);

  return (
    <AppFrame>
      <CalendarWorkspace
        key={JSON.stringify(events)}
        householdId={profile.household_id}
        initialEvents={events}
        people={people}
        weekStart={getWeekStart()}
        canIntegrate={profile.role === "owner" || profile.role === "adult"}
      />
    </AppFrame>
  );
}
