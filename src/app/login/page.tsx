import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { signIn, signUp } from "@/app/auth-actions";
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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; invite?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const { message, invite } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#fbfaf7_0%,_#eef4f8_100%)] px-4 py-10">
      <Card className="w-full max-w-md border-white/80 bg-white/88 shadow-sm backdrop-blur">
        <CardHeader>
          <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle className="text-2xl">Sign in to Family Hub</CardTitle>
          <CardDescription>
            Use the private household account tied to your Supabase project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {message ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {message}
            </div>
          ) : null}
          <form action={signIn} className="space-y-3">
            <input name="inviteToken" type="hidden" value={invite ?? ""} />
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button className="w-full" type="submit">
              Sign in
            </Button>
          </form>
          <form action={signUp} className="space-y-3 border-t pt-5">
            <input name="inviteToken" type="hidden" value={invite ?? ""} />
            <p className="text-sm font-medium">First time here?</p>
            <div className="grid gap-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </div>
            <Button className="w-full" type="submit" variant="outline">
              Create account
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
