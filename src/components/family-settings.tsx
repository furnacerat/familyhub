"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserRoundCog } from "lucide-react";

import { createKidProfile, linkKidProfile } from "@/app/data-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KidProfile } from "@/lib/kids-money-utils";
import type { HouseholdProfile } from "@/lib/supabase/types";

export function FamilySettings({
  kids,
  childAccounts,
}: {
  kids: KidProfile[];
  childAccounts: HouseholdProfile[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const profileId = String(data.get("profileId") ?? "");
    await createKidProfile({
      name: String(data.get("name") ?? "").trim(),
      birthDate: String(data.get("birthDate") ?? ""),
      allowanceCents: dollarsToCents(String(data.get("allowance") ?? "0")),
      allowanceDay: String(data.get("allowanceDay") ?? "Sunday"),
      profileId: profileId === "unlinked" ? undefined : profileId || undefined,
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-lg border border-white/80 bg-white/84 p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">Owner settings</Badge>
          <h2 className="text-3xl font-semibold">Family profiles and access.</h2>
          <p className="mt-2 text-muted-foreground">
            Link each child account to exactly one private child profile.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4" />Add child profile</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={submit}>
              <DialogHeader><DialogTitle>Add child profile</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <Field id="child-name" label="Name" name="name" />
                <Field id="birth-date" label="Birth date" name="birthDate" type="date" />
                <Field id="allowance" label="Allowance" name="allowance" inputMode="decimal" />
                <div className="grid gap-2">
                  <Label>Allowance day</Label>
                  <Select name="allowanceDay" defaultValue="Sunday">
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {weekdays.map((day) => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <AccountSelect accounts={childAccounts} name="profileId" />
              </div>
              <DialogFooter><Button type="submit">Create profile</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      <Card className="border-white/80 bg-white/84 shadow-sm">
        <CardHeader>
          <CardDescription>Children and teens</CardDescription>
          <CardTitle>Profile access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {kids.map((kid) => (
            <div
              key={kid.id}
              className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-4 md:grid-cols-[1fr_18rem]"
            >
              <div className="flex gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <UserRoundCog className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{kid.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {kid.birthDate ? `${getAge(kid.birthDate)} years old` : "Age not set"}
                  </p>
                </div>
              </div>
              <Select
                value={kid.profileId ?? "unlinked"}
                onValueChange={async (value) => {
                  await linkKidProfile(
                    kid.id,
                    value === "unlinked" ? undefined : value,
                  );
                  router.refresh();
                }}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlinked">No account linked</SelectItem>
                  {childAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {!kids.length ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              No child profiles yet.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

function AccountSelect({
  accounts,
  name,
}: {
  accounts: HouseholdProfile[];
  name: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>Child account</Label>
      <Select name={name} defaultValue="unlinked">
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="unlinked">Link later</SelectItem>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Field({
  id,
  label,
  ...props
}: React.ComponentProps<typeof Input> & { id: string; label: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} required {...props} />
    </div>
  );
}

function dollarsToCents(value: string) {
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
}

function getAge(birthDate: string) {
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
