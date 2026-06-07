import { CheckCircle2, PiggyBank } from "lucide-react";

import { AppFrame } from "@/components/app-frame";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { kidsMoney } from "@/lib/family-data";

export default function KidsPage() {
  return (
    <AppFrame>
      <PageHeader
        eyebrow="Kid-friendly budgeting"
        title="Money habits they can understand."
        description="Balances, goals, allowance, chores, and parent approval without exposing the adult household budget."
        action="Add child goal"
      />
      <section className="grid gap-4 xl:grid-cols-2">
        {kidsMoney.map((kid) => {
          const percent = Math.round((kid.saved / kid.target) * 100);

          return (
            <Card
              key={kid.name}
              className="border-white/80 bg-white/84 shadow-sm backdrop-blur"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription>{kid.next}</CardDescription>
                    <CardTitle>{kid.name}</CardTitle>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <PiggyBank className="size-6" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                    <p className="text-sm text-muted-foreground">Wallet</p>
                    <p className="mt-1 text-2xl font-semibold">{kid.balance}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                    <p className="text-sm text-muted-foreground">Goal</p>
                    <p className="mt-1 text-lg font-semibold">{kid.goal}</p>
                  </div>
                </div>
                <div>
                  <Progress value={percent} />
                  <div className="mt-2 flex justify-between text-sm">
                    <span>
                      ${kid.saved} of ${kid.target}
                    </span>
                    <span className="text-muted-foreground">{percent}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {kid.chores.map((chore) => (
                    <div
                      key={chore}
                      className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        <span className="font-medium">{chore}</span>
                      </div>
                      <Badge variant="secondary">Earns</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </AppFrame>
  );
}
