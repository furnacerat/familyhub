import { CheckCircle2, Wrench } from "lucide-react";

import { AppFrame } from "@/components/app-frame";
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
import { maintenanceTasks } from "@/lib/family-data";

export default function MaintainPage() {
  return (
    <AppFrame>
      <PageHeader
        eyebrow="Home maintenance"
        title="Oil changes, filters, and household upkeep."
        description="Recurring maintenance gets its own history and schedule so it does not compete with ordinary reminders."
        action="Add task"
      />
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader>
            <CardDescription>Due soon</CardDescription>
            <CardTitle>Maintenance tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {maintenanceTasks.map((task) => (
              <div
                key={task.title}
                className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="flex gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                    <task.icon className="size-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{task.title}</p>
                      {task.due.includes("Overdue") ? (
                        <Badge className="bg-rose-600 text-white">Overdue</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.appliesTo} - {task.cadence}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Last done: {task.lastDone} - assigned to {task.assignedTo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <Badge variant="secondary">{task.due}</Badge>
                  <Button size="icon" variant="outline" aria-label="Mark done">
                    <CheckCircle2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-slate-950 text-white shadow-sm">
          <CardHeader>
            <Wrench className="mb-2 size-8 text-sky-300" />
            <CardDescription className="text-slate-300">
              Vehicle-ready reminders
            </CardDescription>
            <CardTitle>Date or mileage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-300">
            <p>Oil changes can become due by date, mileage, or whichever comes first.</p>
            <p>Completed tasks will later build a history for each vehicle or home system.</p>
            <p>Adults can assign tasks to family members from this section.</p>
          </CardContent>
        </Card>
      </section>
    </AppFrame>
  );
}
