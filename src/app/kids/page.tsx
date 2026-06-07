import { AppFrame } from "@/components/app-frame";
import { KidsMoneyWorkspace } from "@/components/kids-money-workspace";
import { initialKidsMoney } from "@/lib/kids-money-data";

export default function KidsPage() {
  return (
    <AppFrame>
      <KidsMoneyWorkspace initialKids={initialKidsMoney} />
    </AppFrame>
  );
}
