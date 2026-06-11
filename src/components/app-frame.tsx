import { AppFrameClient } from "@/components/app-frame-client";
import { navItems } from "@/lib/family-data";
import { requireProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function AppFrame({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_profile_id", profile.id)
    .is("read_at", null);
  const navigation = navItems
    .filter((item) => item.access.includes(toDisplayRole(profile.role)))
    .map((item) =>
      item.href === "/kids"
        ? {
            ...item,
            label: profile.role === "child" ? "My Hub" : "Family Members",
          }
        : item.href === "/teen" && profile.role === "child"
          ? { ...item, label: "My Life" }
          : item,
    );

  return (
    <AppFrameClient
      profile={profile}
      navigation={navigation}
      unreadCount={unreadCount ?? 0}
    >
      {children}
    </AppFrameClient>
  );
}

function toDisplayRole(role: "owner" | "adult" | "member" | "child") {
  const roleMap = {
    owner: "Owner",
    adult: "Adult",
    member: "Member",
    child: "Child",
  } as const;

  return roleMap[role];
}
