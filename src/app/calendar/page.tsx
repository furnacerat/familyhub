import { AppFrame } from "@/components/app-frame";
import { CalendarWorkspace } from "@/components/calendar-workspace";
import { initialCalendarEvents } from "@/lib/calendar-data";
import { requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await requireProfile();

  return (
    <AppFrame>
      <CalendarWorkspace initialEvents={initialCalendarEvents} />
    </AppFrame>
  );
}
