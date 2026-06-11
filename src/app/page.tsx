import { AppFrame } from "@/components/app-frame";
import { TodayDashboard } from "@/components/today-dashboard";
import { getLocalIsoDate } from "@/lib/date-utils";
import {
  getBudgetData,
  getCalendarEvents,
  getKidsMoney,
  getListItems,
  getMaintenanceTasks,
  getReminders,
} from "@/lib/household-data";
import { canAccessBudget, requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const profile = await requireProfile();
  const [events, reminders, listItems, kids, maintenance, budget] =
    await Promise.all([
      getCalendarEvents(profile),
      getReminders(profile),
      getListItems(profile),
      getKidsMoney(profile),
      getMaintenanceTasks(profile),
      canAccessBudget(profile) ? getBudgetData(profile) : Promise.resolve(undefined),
    ]);

  return (
    <AppFrame>
      <TodayDashboard
        profile={profile}
        today={getLocalIsoDate()}
        events={events}
        reminders={reminders}
        listItems={listItems}
        kids={kids}
        maintenance={maintenance}
        budget={budget}
      />
    </AppFrame>
  );
}
