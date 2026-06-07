import { redirect } from "next/navigation";

import { createHousehold } from "@/app/auth-actions";
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

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    redirect("/");
  }

  const { message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#fbfaf7_0%,_#eef4f8_100%)] px-4 py-10">
      <Card className="w-full max-w-md border-white/80 bg-white/88 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Create your household</CardTitle>
          <CardDescription>
            This creates the private household and makes you the owner with
            budget access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {message}
            </div>
          ) : null}
          <form action={createHousehold} className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="householdName">Household name</Label>
              <Input
                id="householdName"
                name="householdName"
                defaultValue="Family Hub"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Your display name</Label>
              <Input id="displayName" name="displayName" required />
            </div>
            <Button className="w-full" type="submit">
              Create household
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
