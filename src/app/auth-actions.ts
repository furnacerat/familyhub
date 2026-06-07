"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const inviteToken = String(formData.get("inviteToken") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect(inviteToken ? `/invite/${inviteToken}` : "/");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const inviteToken = String(formData.get("inviteToken") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect(inviteToken ? `/invite/${inviteToken}` : "/setup");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createHousehold(formData: FormData) {
  const householdName = String(formData.get("householdName") ?? "Family Hub");
  const displayName = String(formData.get("displayName") ?? "Owner");
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_household_for_current_user", {
    household_name: householdName,
    display_name: displayName,
  });

  if (error) {
    redirect(`/setup?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}
