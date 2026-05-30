import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Customer } from "@/lib/types";

/** Returns the logged-in profile, or null. Server-only. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data as Profile) ?? null;
}

/** Redirects to /login if not signed in; returns the profile otherwise. */
export async function requireUser(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Redirects admins to /admin and anonymous users to /login. */
export async function requireCustomer(): Promise<{
  profile: Profile;
  customer: Customer | null;
}> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", profile.id)
    .single();

  return { profile, customer: (customer as Customer) ?? null };
}

/** Requires an admin; otherwise redirects to /admin/login. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");
  if (profile.role !== "admin") redirect("/admin/login?error=not_admin");
  return profile;
}
