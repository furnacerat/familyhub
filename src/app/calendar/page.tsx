import { CalendarPlus } from "lucide-react";

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
import { todaysSchedule } from "@/lib/family-data";

const weekDays = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

export default function CalendarPage() {
  return (
    <AppFrame>
      <PageHeader
        eyebrow="Shared family calendar"
        title="Everyone's schedule in one place."
        description="Family members can add events, adults can manage details, and the home dashboard can surface what matters today."
        action="Add event"
      />
      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader>
            <CardDescription>Week view</CardDescription>
            <CardTitle>June 6-12</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className="min-h-24 rounded-lg border border-border/70 bg-background/70 p-2"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {day}
                </p>
                <p className="mt-1 text-lg font-semibold">{index + 6}</p>
                {index < 3 ? (
                  <span className="mt-4 block h-2 rounded-full bg-sky-500" />
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Upcoming events</CardDescription>
              <CardTitle>Family agenda</CardTitle>
            </div>
            <Button size="icon" variant="outline" aria-label="Add calendar event">
              <CalendarPlus className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysSchedule.map((event) => (
              <div
                key={`${event.date}-${event.title}`}
                className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[5rem_1fr_auto]"
              >
                <div>
                  <p className="font-semibold">{event.date}</p>
                  <p className="text-sm text-muted-foreground">{event.time}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${event.color}`} />
                    <p className="font-medium">{event.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.location}
                  </p>
                </div>
                <Badge variant="secondary" className="h-fit rounded-md">
                  {event.person}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppFrame>
  );
}
