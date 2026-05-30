"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerSchema, loginSchema, adminRegisterSchema } from "@/lib/validations";

export type AuthState = { error?: string; message?: string };

/**
 * Register a new CUSTOMER. The DB trigger handle_new_user() creates the
 * matching profile + customers row from the metadata we pass here.
 */
export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      data: {
        role: "customer",
        full_name: d.full_name,
        phone: d.phone,
        nationality: d.nationality,
        city: d.city,
        address: d.address,
        zip_code: d.zip_code,
        room_building: d.room_building,
        preferred_delivery_day: d.preferred_delivery_day,
        allergy_note: d.allergy_note,
      },
    },
  });

  if (error) return { error: error.message };

  // If email confirmation is disabled, a session is returned immediately.
  if (data.session) redirect("/dashboard");

  // Otherwise the user must confirm their email first.
  redirect("/login?confirm=1");
}

/**
 * Register an ADMIN account. Gated by a secret invite code held in the
 * ADMIN_SIGNUP_CODE env var (server-only) — without the correct code, no
 * admin account can be created. The DB trigger reads role='admin' from the
 * sign-up metadata and skips creating a customers row.
 */
export async function adminRegisterAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = adminRegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;

  const expected = process.env.ADMIN_SIGNUP_CODE;
  if (!expected) {
    return { error: "Admin sign-up is disabled. Set ADMIN_SIGNUP_CODE in the server env." };
  }
  if (d.invite_code !== expected) {
    return { error: "Invalid invite code." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      data: { role: "admin", full_name: d.full_name, phone: d.phone },
    },
  });
  if (error) return { error: error.message };

  if (data.session) redirect("/admin");
  redirect("/admin/login?confirm=1");
}

/** Customer/admin login. Redirects by role. */
export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const redirectTo = (formData.get("redirect") as string) || "";
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");
  redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard");
}

/** Admin-only login. Rejects non-admin accounts. */
export async function adminLoginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "This account is not an admin." };
  }
  redirect("/admin");
}
