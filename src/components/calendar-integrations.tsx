"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarSync, Copy, Download, Upload } from "lucide-react";

import {
  createCalendarFeedToken,
  importIcsCalendar,
} from "@/app/data-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CalendarIntegrations({
  feedUrl,
  origin,
}: {
  feedUrl?: string;
  origin: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function importCalendar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const count = await importIcsCalendar(String(data.get("ics") ?? ""));
    setMessage(`${count} events imported.`);
    router.refresh();
  }

  return (
    <>
      <section className="rounded-lg border border-white/80 bg-white/84 p-5 shadow-sm">
        <Badge variant="secondary" className="mb-3">Calendar connections</Badge>
        <h2 className="text-3xl font-semibold">Use Family Hub with your calendar.</h2>
        <p className="mt-2 text-muted-foreground">
          Subscribe from Apple Calendar, Google Calendar, or Outlook, and import
          standard ICS calendar files.
        </p>
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-white/80 bg-white/84 shadow-sm">
          <CardHeader>
            <Download className="size-6 text-sky-700" />
            <CardDescription>Private read-only feed</CardDescription>
            <CardTitle>Subscribe externally</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedUrl ? (
              <>
                <Input readOnly value={feedUrl} />
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(feedUrl)}
                >
                  <Copy className="size-4" />
                  Copy subscription URL
                </Button>
                <p className="text-sm text-muted-foreground">
                  Add this URL as a subscribed calendar. Anyone with the URL can
                  read the family calendar, so treat it like a private password.
                </p>
              </>
            ) : (
              <Button
                onClick={async () => {
                  const token = await createCalendarFeedToken();
                  await navigator.clipboard.writeText(
                    `${origin}/api/calendar/feed/${token}`,
                  );
                  router.refresh();
                }}
              >
                <CalendarSync className="size-4" />
                Create private feed
              </Button>
            )}
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/84 shadow-sm">
          <CardHeader>
            <Upload className="size-6 text-emerald-700" />
            <CardDescription>ICS import</CardDescription>
            <CardTitle>Bring events into Family Hub</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={importCalendar} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="ics-source">ICS calendar contents</Label>
                <Textarea
                  id="ics-source"
                  name="ics"
                  className="min-h-48 font-mono text-xs"
                  placeholder="BEGIN:VCALENDAR..."
                  required
                />
              </div>
              {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
              <Button type="submit">Import events</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
