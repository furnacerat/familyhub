import { AppFrame } from "@/components/app-frame";
import { NotificationsWorkspace } from "@/components/notifications-workspace";
import { getNotifications } from "@/lib/household-data";
import { requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const data = await getNotifications(profile);

  return (
    <AppFrame>
      <NotificationsWorkspace
        key={JSON.stringify(data)}
        householdId={profile.household_id}
        notifications={data.notifications}
        preferences={data.preferences}
      />
    </AppFrame>
  );
}
