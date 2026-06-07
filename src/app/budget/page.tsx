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
import { formatMoney } from "@/lib/budget-engine";
import { sampleBills, samplePaychecks } from "@/lib/budget-sample-data";

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
            {samplePaychecks.map((check) => (
              <div
                key={check.id}
                className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="flex gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Banknote className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{check.earner}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(check.payDate)}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-lg font-semibold">
                    {formatMoney(check.amountCents)}
                  </p>
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
            {sampleBills.map((bill) => (
              <div
                key={bill.id}
                className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="flex gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                    <Landmark className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{bill.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCategory(bill.category)} - due{" "}
                      {formatDate(bill.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-lg font-semibold">
                    {formatMoney(bill.amountCents)}
                  </p>
                  <Badge variant={bill.paid ? "secondary" : "outline"}>
                    {bill.paid ? "Paid" : bill.priority}
                  </Badge>
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

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatCategory(category: string): string {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
