import { Banknote, Landmark, Plus } from "lucide-react";

import { AppFrame } from "@/components/app-frame";
import { AllocationCard, BudgetCompanion } from "@/components/dashboard-sections";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { billCatalog, paychecks } from "@/lib/family-data";

export default function BudgetPage() {
  return (
    <AppFrame>
      <PageHeader
        eyebrow="Adult-only budget"
        title="Manual bills and paychecks first."
        description="This is the protected money area for you and your wife. The allocation plan stays explainable before we add bank syncing later."
        action="Add paycheck"
      />
      <BudgetCompanion />
      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Income</CardDescription>
              <CardTitle>Upcoming paychecks</CardTitle>
            </div>
            <Button size="icon" variant="outline" aria-label="Add paycheck">
              <Plus className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {paychecks.map((check) => (
              <div
                key={`${check.earner}-${check.date}`}
                className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="flex gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Banknote className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{check.earner}</p>
                    <p className="text-sm text-muted-foreground">
                      {check.date} - {check.cadence}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-lg font-semibold">{check.amount}</p>
                  <Badge variant="secondary">{check.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader>
            <CardDescription>Bills</CardDescription>
            <CardTitle>Manual bill catalog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {billCatalog.map((bill) => (
              <div
                key={bill.name}
                className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="flex gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                    <Landmark className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{bill.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {bill.category} - due {bill.due}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-lg font-semibold">{bill.amount}</p>
                  <Badge variant="outline">{bill.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <AllocationCard />
    </AppFrame>
  );
}
