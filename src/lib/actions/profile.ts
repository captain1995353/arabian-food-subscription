"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations";

export type ProfileState = { error?: string; success?: boolean };

/** Customer updates their personal info + delivery address. */
export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in." };

  const { error: pErr } = await supabase
    .from("profiles")
    .update({ full_name: d.full_name, phone: d.phone })
    .eq("id", user.id);
  if (pErr) return { error: pErr.message };

  const { error: cErr } = await supabase
    .from("customers")
    .update({
      nationality: d.nationality,
      city: d.city,
      address: d.address,
      zip_code: d.zip_code,
      room_building: d.room_building,
      preferred_delivery_day: d.preferred_delivery_day,
      allergy_note: d.allergy_note,
    })
    .eq("id", user.id);
  if (cErr) return { error: cErr.message };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { success: true };
}
