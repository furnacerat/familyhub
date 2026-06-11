"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Car,
  CircleDollarSign,
  Plus,
  Route,
} from "lucide-react";

import {
  createRideRequest,
  createTeenMoneyItem,
  createVehicleLog,
  createWorkEntry,
  settleTeenMoneyItem,
  updateRideRequest,
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
import { Textarea } from "@/components/ui/textarea";
import { formatKidMoney, type KidProfile } from "@/lib/kids-money-utils";
import {
  getAgeFromBirthDate,
  type TeenData,
} from "@/lib/teen-utils";
import { useHouseholdRealtime } from "@/hooks/use-household-realtime";

type AddType = "ride" | "work" | "vehicle" | "money";

const realtimeTables = [
  "ride_requests",
  "teen_work_entries",
  "teen_vehicle_logs",
  "teen_money_items",
];

export function TeenWorkspace({
  householdId,
  kids,
  data,
  canManage,
}: {
  householdId: string;
  kids: KidProfile[];
  data: TeenData;
  canManage: boolean;
}) {
  const router = useRouter();
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id ?? "");
  const selectedKid = kids.find((kid) => kid.id === selectedKidId) ?? kids[0];
  const age = getAgeFromBirthDate(selectedKid?.birthDate);

  useHouseholdRealtime(householdId, realtimeTables);

  if (!selectedKid) {
    return (
      <Card><CardHeader><CardTitle>No linked child profile</CardTitle></CardHeader></Card>
    );
  }

  const rides = data.rides.filter((item) => item.kidId === selectedKid.id);
  const work = data.work.filter((item) => item.kidId === selectedKid.id);
  const vehicles = data.vehicles.filter((item) => item.kidId === selectedKid.id);
  const money = data.money.filter((item) => item.kidId === selectedKid.id);

  return (
    <>
      <section className="flex flex-col gap-4 rounded-lg border border-white/80 bg-white/84 p-5 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">Growing independence</Badge>
          <h2 className="text-3xl font-semibold">
            {canManage ? `${selectedKid.name}'s life tools.` : "My life tools."}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {getAgeDescription(age)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {canManage && kids.length > 1 ? (
            <Select value={selectedKid.id} onValueChange={setSelectedKidId}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {kids.map((kid) => (
                  <SelectItem key={kid.id} value={kid.id}>{kid.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <AddTeenItemDialog
            kid={selectedKid}
            age={age}
            onSaved={() => router.refresh()}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <TeenCard
          icon={Route}
          title="Ride requests"
          description="Pickup and driver coordination"
          empty="No rides requested."
        >
          {rides.map((ride) => (
            <TeenRow
              key={ride.id}
              title={`${ride.pickup} to ${ride.destination}`}
              detail={formatDateTime(ride.neededAt)}
              badge={ride.driverName ? `${ride.status}: ${ride.driverName}` : ride.status}
              action={
                canManage && ride.status === "requested" ? (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await updateRideRequest(ride.id, "claimed");
                      router.refresh();
                    }}
                  >
                    I can drive
                  </Button>
                ) : undefined
              }
            />
          ))}
        </TeenCard>

        {age === null || age >= 14 ? (
          <TeenCard
            icon={BriefcaseBusiness}
            title="Work and income"
            description="Shifts and expected earnings"
            empty="No work shifts entered."
          >
            {work.map((entry) => (
              <TeenRow
                key={entry.id}
                title={entry.employer}
                detail={`${formatDate(entry.shiftDate)} at ${formatTime(entry.startTime)}`}
                badge={formatKidMoney(entry.expectedIncomeCents)}
              />
            ))}
          </TeenCard>
        ) : null}

        {age === null || age >= 16 ? (
          <TeenCard
            icon={Car}
            title="Driving and vehicle"
            description="Fuel, mileage, insurance, and service"
            empty="No vehicle activity entered."
          >
            {vehicles.map((entry) => (
              <TeenRow
                key={entry.id}
                title={`${entry.vehicle} - ${entry.entryType}`}
                detail={`${formatDate(entry.loggedOn)}${entry.mileage ? ` - ${entry.mileage.toLocaleString()} mi` : ""}`}
                badge={formatKidMoney(entry.amountCents)}
              />
            ))}
          </TeenCard>
        ) : null}

        {age === null || age >= 13 ? (
          <TeenCard
            icon={CircleDollarSign}
            title="Spending and reimbursements"
            description="Plans and who owes whom"
            empty="No open money items."
          >
            {money.map((item) => (
              <TeenRow
                key={item.id}
                title={item.label}
                detail={item.direction ? item.direction.replaceAll("-", " ") : "spending plan"}
                badge={`${formatKidMoney(item.amountCents)} - ${item.status}`}
                action={
                  item.status === "open" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await settleTeenMoneyItem(item.id);
                        router.refresh();
                      }}
                    >
                      Settle
                    </Button>
                  ) : undefined
                }
              />
            ))}
          </TeenCard>
        ) : null}
      </section>
    </>
  );
}

function AddTeenItemDialog({
  kid,
  age,
  onSaved,
}: {
  kid: KidProfile;
  age: number | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => {
    const values: AddType[] = ["ride"];
    if (age === null || age >= 13) values.push("money");
    if (age === null || age >= 14) values.push("work");
    if (age === null || age >= 16) values.push("vehicle");
    return values;
  }, [age]);
  const [type, setType] = useState<AddType>(options[0]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const amount = dollarsToCents(String(data.get("amount") ?? "0"));

    if (type === "ride") {
      await createRideRequest({
        kidId: kid.id,
        pickup: String(data.get("pickup") ?? ""),
        destination: String(data.get("destination") ?? ""),
        neededAt: String(data.get("neededAt") ?? ""),
        notes: String(data.get("notes") ?? ""),
      });
    }
    if (type === "work") {
      await createWorkEntry({
        kidId: kid.id,
        employer: String(data.get("employer") ?? ""),
        shiftDate: String(data.get("date") ?? ""),
        startTime: String(data.get("startTime") ?? ""),
        endTime: String(data.get("endTime") ?? ""),
        expectedIncomeCents: amount,
        notes: String(data.get("notes") ?? ""),
      });
    }
    if (type === "vehicle") {
      await createVehicleLog({
        kidId: kid.id,
        vehicle: String(data.get("vehicle") ?? ""),
        entryType: String(data.get("entryType") ?? "fuel") as "fuel",
        loggedOn: String(data.get("date") ?? ""),
        amountCents: amount,
        mileage: toOptionalNumber(String(data.get("mileage") ?? "")),
        notes: String(data.get("notes") ?? ""),
      });
    }
    if (type === "money") {
      const itemType = String(data.get("itemType") ?? "spending-plan") as
        | "spending-plan"
        | "reimbursement";
      await createTeenMoneyItem({
        kidId: kid.id,
        itemType,
        label: String(data.get("label") ?? ""),
        amountCents: amount,
        dueDate: String(data.get("date") ?? ""),
        direction:
          itemType === "reimbursement"
            ? (String(data.get("direction")) as "family-owes-kid")
            : undefined,
      });
    }

    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" />Add</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle>Add for {kid.name}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as AddType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>{labelType(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {type === "ride" ? <RideFields /> : null}
            {type === "work" ? <WorkFields /> : null}
            {type === "vehicle" ? <VehicleFields /> : null}
            {type === "money" ? <MoneyFields /> : null}
            <div className="grid gap-2">
              <Label htmlFor="teen-notes">Notes</Label>
              <Textarea id="teen-notes" name="notes" />
            </div>
          </div>
          <DialogFooter><Button type="submit">Save</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RideFields() {
  return (
    <>
      <Field name="pickup" label="Pickup" />
      <Field name="destination" label="Destination" />
      <Field name="neededAt" label="Needed at" type="datetime-local" />
    </>
  );
}

function WorkFields() {
  return (
    <>
      <Field name="employer" label="Employer" />
      <Field name="date" label="Shift date" type="date" />
      <div className="grid grid-cols-2 gap-3">
        <Field name="startTime" label="Start" type="time" />
        <Field name="endTime" label="End" type="time" required={false} />
      </div>
      <Field name="amount" label="Expected income" inputMode="decimal" />
    </>
  );
}

function VehicleFields() {
  return (
    <>
      <Field name="vehicle" label="Vehicle" />
      <div className="grid gap-2">
        <Label>Entry type</Label>
        <Select name="entryType" defaultValue="fuel">
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["fuel", "mileage", "maintenance", "insurance"].map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Field name="date" label="Date" type="date" />
      <Field name="amount" label="Amount" inputMode="decimal" />
      <Field name="mileage" label="Mileage" inputMode="numeric" required={false} />
    </>
  );
}

function MoneyFields() {
  return (
    <>
      <div className="grid gap-2">
        <Label>Money item</Label>
        <Select name="itemType" defaultValue="spending-plan">
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="spending-plan">Spending plan</SelectItem>
            <SelectItem value="reimbursement">Reimbursement</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Field name="label" label="Label" />
      <Field name="amount" label="Amount" inputMode="decimal" />
      <Field name="date" label="Due date" type="date" required={false} />
      <div className="grid gap-2">
        <Label>Reimbursement direction</Label>
        <Select name="direction" defaultValue="family-owes-kid">
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="family-owes-kid">Family owes child</SelectItem>
            <SelectItem value="kid-owes-family">Child owes family</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function TeenCard({
  icon: Icon,
  title,
  description,
  empty,
  children,
}: {
  icon: typeof Route;
  title: string;
  description: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  return (
    <Card className="border-white/80 bg-white/84 shadow-sm">
      <CardHeader>
        <Icon className="size-6 text-sky-700" />
        <CardDescription>{description}</CardDescription>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasChildren ? children : <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">{empty}</p>}
      </CardContent>
    </Card>
  );
}

function TeenRow({
  title,
  detail,
  badge,
  action,
}: {
  title: string;
  detail: string;
  badge: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 rounded-lg border bg-background/70 p-3 sm:grid-cols-[1fr_auto]">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm capitalize text-muted-foreground">{detail}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="capitalize">{badge}</Badge>
        {action}
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  required = true,
  ...props
}: React.ComponentProps<typeof Input> & {
  name: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`teen-${name}`}>{label}</Label>
      <Input id={`teen-${name}`} name={name} required={required} {...props} />
    </div>
  );
}

function getAgeDescription(age: number | null) {
  if (age === null) return "Rides, work, driving, and personal money coordination.";
  if (age <= 12) return "Start with rides, school logistics, and simple planning.";
  if (age <= 15) return "Coordinate rides, activities, spending plans, and first work experiences.";
  return "Manage work shifts, income, driving, vehicle costs, and reimbursements.";
}

function labelType(type: AddType) {
  return { ride: "Ride request", work: "Work shift", vehicle: "Vehicle log", money: "Money item" }[type];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(date));
}

function formatTime(time: string) {
  const [hourValue, minute] = time.split(":").map(Number);
  return `${hourValue % 12 || 12}:${String(minute).padStart(2, "0")} ${hourValue >= 12 ? "PM" : "AM"}`;
}

function dollarsToCents(value: string) {
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
}

function toOptionalNumber(value: string) {
  const numeric = Number(value.replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}
