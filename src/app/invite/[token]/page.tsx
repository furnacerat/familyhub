import Link from "next/link";
import { redirect } from "next/navigation";

import { acceptInvite } from "@/app/invite-actions";
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
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { token } = await params;
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data: inviteRows } = await supabase.rpc("get_household_invite", {
    invite_token: token,
  });
  const invite = inviteRows?.[0];
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!invite) {
    redirect("/login?message=Invite not found");
  }

  const isAccepted = Boolean(invite.accepted_at);
  const currentTime = new Date();
  const isExpired = new Date(invite.expires_at).getTime() < currentTime.getTime();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#fbfaf7_0%,_#eef4f8_100%)] px-4 py-10">
      <Card className="w-full max-w-md border-white/80 bg-white/88 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Join {invite.household_name}</CardTitle>
          <CardDescription>
            This invite is for {invite.email} as {invite.role}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {message}
            </div>
          ) : null}
          {isAccepted || isExpired ? (
            <div className="rounded-lg border border-border bg-background/70 p-3 text-sm text-muted-foreground">
              {isAccepted ? "This invite has already been accepted." : "This invite has expired."}
            </div>
          ) : user ? (
            <form action={acceptInvite} className="space-y-3">
              <input name="token" type="hidden" value={token} />
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input id="displayName" name="displayName" required />
              </div>
              <Button className="w-full" type="submit">
                Accept invite
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sign in or create an account with {invite.email} to accept this
                invite.
              </p>
              <Button asChild className="w-full">
                <Link href={`/login?invite=${token}`}>Continue to login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
