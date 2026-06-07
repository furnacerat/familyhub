import { Mail, UserPlus } from "lucide-react";

import { createInvite } from "@/app/invite-actions";
import { AppFrame } from "@/components/app-frame";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requireProfile, requireRole } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; email?: string; message?: string }>;
}) {
  const profile = await requireProfile();
  requireRole(profile, ["owner"]);

  const supabase = await createClient();
  const { data: invites } = await supabase
    .from("household_invites")
    .select("id, email, role, budget_access, token, expires_at, accepted_at, created_at")
    .eq("household_id", profile.household_id)
    .order("created_at", { ascending: false });
  const { invite, email, message } = await searchParams;
  const mailtoHref =
    invite && email
      ? `mailto:${email}?subject=${encodeURIComponent("You're invited to Family Hub")}&body=${encodeURIComponent(`Use this private invite link to join Family Hub:\n\n${invite}`)}`
      : null;

  return (
    <AppFrame>
      <section className="flex flex-col gap-3 rounded-lg border border-white/80 bg-white/84 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-3 rounded-md">
            Owner settings
          </Badge>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Invite family members.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Create a private invite link tied to an email address, role, and
            budget access setting.
          </p>
        </div>
      </section>

      {message ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {message}
        </div>
      ) : null}

      {invite ? (
        <Card className="border-white/80 bg-emerald-50 shadow-sm">
          <CardHeader>
            <CardDescription>Invite created</CardDescription>
            <CardTitle>Send this private link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input readOnly value={invite} />
            <div className="flex flex-col gap-2 sm:flex-row">
              {mailtoHref ? (
                <Button asChild>
                  <a href={mailtoHref}>
                    <Mail className="size-4" />
                    Open email
                  </a>
                </Button>
              ) : null}
              <p className="text-sm text-muted-foreground">
                Copy the link if your email app does not open automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <UserPlus className="size-5" />
            </div>
            <CardDescription>New invite</CardDescription>
            <CardTitle>Email and access</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createInvite} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select name="role" defaultValue="member">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adult">Adult</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input name="budgetAccess" type="checkbox" className="size-4" />
                Give budget access, adults only
              </label>
              <Button type="submit" className="w-full">
                Create invite
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader>
            <CardDescription>Pending and used links</CardDescription>
            <CardTitle>Invite history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(invites ?? []).map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-medium">{item.email}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.role} {item.budget_access ? "- budget access" : ""}
                  </p>
                </div>
                <Badge variant={item.accepted_at ? "secondary" : "outline"}>
                  {item.accepted_at ? "Accepted" : "Pending"}
                </Badge>
              </div>
            ))}
            {!invites?.length ? (
              <div className="rounded-lg border border-dashed border-border bg-background/60 p-6 text-center text-sm text-muted-foreground">
                No invites yet.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </AppFrame>
  );
}
