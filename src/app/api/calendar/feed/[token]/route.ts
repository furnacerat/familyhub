import { createIcsCalendar } from "@/lib/calendar-ics";
import type { CalendarEvent } from "@/lib/calendar-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_calendar_feed", {
    feed_token: token,
  });

  if (error || !data?.length) {
    return new Response("Calendar feed not found", { status: 404 });
  }

  const householdName = data[0].household_name;
  const events: CalendarEvent[] = data.flatMap(
    (row: {
      id: string | null;
      title: string | null;
      event_date: string | null;
      start_time: string | null;
      end_time: string | null;
      person: string;
      location: string | null;
      category: string;
      notes: string | null;
    }) =>
      row.id && row.title && row.event_date && row.start_time
        ? [{
            id: row.id,
            title: row.title,
            date: row.event_date,
            startTime: row.start_time.slice(0, 5),
            endTime: row.end_time?.slice(0, 5),
            person: row.person,
            location: row.location ?? undefined,
            category: row.category as CalendarEvent["category"],
            notes: row.notes ?? undefined,
          }]
        : [],
  );

  return new Response(createIcsCalendar(householdName, events), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="family-hub.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
