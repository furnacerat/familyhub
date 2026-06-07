import { AppFrame } from "@/components/app-frame";
import { CalendarWorkspace } from "@/components/calendar-workspace";
import { initialCalendarEvents } from "@/lib/calendar-data";

export default function CalendarPage() {
  return (
    <AppFrame>
      <CalendarWorkspace initialEvents={initialCalendarEvents} />
    </AppFrame>
  );
}
