export type RideRequest = {
  id: string;
  kidId: string;
  pickup: string;
  destination: string;
  neededAt: string;
  status: "requested" | "claimed" | "completed" | "cancelled";
  driverName?: string;
  notes?: string;
};

export type WorkEntry = {
  id: string;
  kidId: string;
  employer: string;
  shiftDate: string;
  startTime: string;
  endTime?: string;
  expectedIncomeCents: number;
  notes?: string;
};

export type VehicleLog = {
  id: string;
  kidId: string;
  vehicle: string;
  entryType: "fuel" | "mileage" | "maintenance" | "insurance";
  loggedOn: string;
  amountCents: number;
  mileage?: number;
  notes?: string;
};

export type TeenMoneyItem = {
  id: string;
  kidId: string;
  itemType: "spending-plan" | "reimbursement";
  label: string;
  amountCents: number;
  dueDate?: string;
  direction?: "family-owes-kid" | "kid-owes-family";
  status: "open" | "settled";
};

export type TeenData = {
  rides: RideRequest[];
  work: WorkEntry[];
  vehicles: VehicleLog[];
  money: TeenMoneyItem[];
};

export function getAgeFromBirthDate(birthDate?: string) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age;
}
