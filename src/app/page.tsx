import { FamilyHubShell } from "@/components/family-hub-shell";
import { requireProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requireProfile();

  return <FamilyHubShell />;
}
