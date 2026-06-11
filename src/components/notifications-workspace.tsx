"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CheckCheck } from "lucide-react";

import {
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
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
import type {
  NotificationItem,
  NotificationPreferences,
} from "@/lib/notification-utils";
import { useHouseholdRealtime } from "@/hooks/use-household-realtime";

const realtimeTables = ["notifications"];

export function NotificationsWorkspace({
  householdId,
  notifications,
  preferences,
}: {
  householdId: string;
  notifications: NotificationItem[];
  preferences: NotificationPreferences;
}) {
  const router = useRouter();
  const [dailyDigest, setDailyDigest] = useState(preferences.dailyDigest);
  useHouseholdRealtime(householdId, realtimeTables);

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await updateNotificationPreferences({
      dailyDigest,
      digestTime: String(data.get("digestTime") ?? "18:00"),
    });
    router.refresh();
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-lg border border-white/80 bg-white/84 p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">Inbox</Badge>
          <h2 className="text-3xl font-semibold">Household notifications.</h2>
          <p className="mt-2 text-muted-foreground">
            Approvals, rides, schedule changes, and other actionable updates.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await markAllNotificationsRead();
            router.refresh();
          }}
        >
          <CheckCheck className="size-4" />
          Mark all read
        </Button>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/80 bg-white/84 shadow-sm">
          <CardHeader>
            <CardDescription>Latest activity</CardDescription>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border p-4 ${
                  notification.readAt ? "bg-background/60" : "bg-sky-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{notification.title}</p>
                      {!notification.readAt ? <Badge>New</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.body}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatTimestamp(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {notification.href ? (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={notification.href}
                          onClick={() => void markNotificationRead(notification.id)}
                        >
                          Open
                        </Link>
                      </Button>
                    ) : null}
                    {!notification.readAt ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await markNotificationRead(notification.id);
                          router.refresh();
                        }}
                      >
                        Read
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {!notifications.length ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <BellRing className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">No notifications yet.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit border-white/80 bg-white/84 shadow-sm">
          <CardHeader>
            <CardDescription>Preferences</CardDescription>
            <CardTitle>Daily digest</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePreferences} className="space-y-4">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={dailyDigest}
                  onChange={(event) => setDailyDigest(event.target.checked)}
                />
                Prepare a daily household digest
              </label>
              <div className="grid gap-2">
                <Label htmlFor="digest-time">Digest time</Label>
                <Input
                  id="digest-time"
                  name="digestTime"
                  type="time"
                  defaultValue={preferences.digestTime}
                  disabled={!dailyDigest}
                />
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Digest preferences are stored now. Email or push delivery can
                use this schedule when a delivery provider is connected.
              </p>
              <Button type="submit" className="w-full">Save preferences</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
