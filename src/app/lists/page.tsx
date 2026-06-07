import { AppFrame } from "@/components/app-frame";
import { ListsWorkspace } from "@/components/lists-workspace";
import { initialListItems } from "@/lib/list-data";

export default function ListsPage() {
  return (
    <AppFrame>
      <ListsWorkspace initialItems={initialListItems} />
    </AppFrame>
  );
}
