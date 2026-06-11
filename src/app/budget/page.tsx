import { redirect } from "next/navigation";

import { AppFrame } from "@/components/app-frame";
import { BudgetWorkspace } from "@/components/budget-workspace";
import { getBudgetData } from "@/lib/household-data";
import { canAccessBudget, requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const profile = await requireProfile();

  if (!canAccessBudget(profile)) {
    redirect("/");
  }

  const budget = await getBudgetData(profile);

  return (
    <AppFrame>
      <BudgetWorkspace
        key={JSON.stringify(budget)}
        householdId={profile.household_id}
        initialPaychecks={budget.paychecks}
        initialBills={budget.bills}
        reserves={budget.reserves}
      />
    </AppFrame>
  );
}
