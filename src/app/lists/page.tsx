import { AppFrame } from "@/components/app-frame";
import { ListsWorkspace } from "@/components/lists-workspace";
import { initialListItems } from "@/lib/list-data";
import { requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  await requireProfile();

  return (
    <AppFrame>
      <ListsWorkspace initialItems={initialListItems} />
    </AppFrame>
  );
}
