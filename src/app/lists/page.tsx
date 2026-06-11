import { AppFrame } from "@/components/app-frame";
import { ListsWorkspace } from "@/components/lists-workspace";
import { getHouseholdPeople, getListItems } from "@/lib/household-data";
import { requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  const profile = await requireProfile();
  const [items, people] = await Promise.all([
    getListItems(profile),
    getHouseholdPeople(profile),
  ]);

  return (
    <AppFrame>
      <ListsWorkspace
        key={JSON.stringify(items)}
        householdId={profile.household_id}
        initialItems={items}
        people={people}
      />
    </AppFrame>
  );
}
