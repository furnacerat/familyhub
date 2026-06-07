import { AppFrame } from "@/components/app-frame";
import { KidsMoneyWorkspace } from "@/components/kids-money-workspace";
import { initialKidsMoney } from "@/lib/kids-money-data";
import { requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function KidsPage() {
  await requireProfile();

  return (
    <AppFrame>
      <KidsMoneyWorkspace initialKids={initialKidsMoney} />
    </AppFrame>
  );
}
