import { BellRing, Clock3 } from "lucide-react";

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
import { reminders } from "@/lib/family-data";

export default function RemindersPage() {
  return (
    <AppFrame>
      <PageHeader
        eyebrow="Family reminders"
        title="Small things stay visible."
        description="Keep everyday reminders separate from recurring home maintenance so one-off tasks do not get lost."
        action="Add reminder"
      />
      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader>
            <CardDescription>Open reminders</CardDescription>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reminders.map((item) => (
              <div
                key={item.title}
                className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="flex gap-3">
                  <Clock3 className="mt-1 size-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.due} - {item.owner}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Badge variant="secondary">{item.status}</Badge>
                  <Badge variant={item.priority === "High" ? "destructive" : "outline"}>
                    {item.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-slate-950 text-white shadow-sm">
          <CardHeader>
            <BellRing className="mb-2 size-8 text-sky-300" />
            <CardDescription className="text-slate-300">
              Notification model
            </CardDescription>
            <CardTitle>Next phase behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-300">
            <p>Adults can create household-wide reminders.</p>
            <p>Children can see assigned tasks and request completion.</p>
            <p>Maintenance reminders stay in their own section with history.</p>
          </CardContent>
        </Card>
      </section>
    </AppFrame>
  );
}
