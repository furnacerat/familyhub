import { headers } from "next/headers";

import { AppFrame } from "@/components/app-frame";
import { CalendarIntegrations } from "@/components/calendar-integrations";
import { requireProfile, requireRole } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CalendarIntegrationsPage() {
  const profile = await requireProfile();
  requireRole(profile, ["owner", "adult"]);
  const supabase = await createClient();
  const [{ data: feed }, headerStore] = await Promise.all([
    supabase
      .from("calendar_feed_tokens")
      .select("token")
      .eq("household_id", profile.household_id)
      .eq("revoked", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    headers(),
  ]);
  const origin =
    headerStore.get("origin") ??
    `${headerStore.get("x-forwarded-proto") ?? "http"}://${headerStore.get("host") ?? "127.0.0.1:3000"}`;

  return (
    <AppFrame>
      <CalendarIntegrations
        origin={origin}
        feedUrl={feed ? `${origin}/api/calendar/feed/${feed.token}` : undefined}
      />
    </AppFrame>
  );
}
