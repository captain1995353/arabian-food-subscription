"use server";

import { createServiceClient } from "@/lib/supabase/server";

export interface OfflineInput {
  full_name: string;
  phone: string;
  passport_no: string;
  nationality: string;
  city: string;
  address: string;
  zip_code: string;
  room_building: string;
  special_note: string;
  paymentAmount: number;
  receiptUrl: string;
  latitude: number | null;
  longitude: number | null;
  mapLink: string;
  weeklyMenuId: string;
  items: { foodItemId: string; quantity: number }[];
}

export type OfflineResult = { error?: string; success?: boolean };

/**
 * Uploads an offline subscriber's payment receipt (public form, no login).
 * Runs server-side with the service client, so it works without exposing any
 * storage policy. Accepts any file type.
 */
export async function uploadOfflineReceipt(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  try {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { error: "Please choose a file." };
    if (file.size > 8 * 1024 * 1024) return { error: "File too large (max 8MB)." };

    const supabase = createServiceClient();
    const ext = (file.name.split(".").pop() || "dat").toLowerCase();
    const path = `offline/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const { error } = await supabase.storage
      .from("receipts")
      .upload(path, file, { upsert: false, cacheControl: "3600" });
    if (error) return { error: error.message };
    const { data } = supabase.storage.from("receipts").getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}

/**
 * Saves an offline/walk-in subscriber's weekly order. Public (no login):
 * runs server-side with the service client so it can insert without exposing
 * any policy to the browser. Validates the 6-item rule + per-item caps
 * against the published menu (prices not charged here — offline handled).
 */
export async function saveOfflineSubscriber(input: OfflineInput): Promise<OfflineResult> {
  if (!input.full_name?.trim()) return { error: "Please enter your name." };
  if (!input.phone?.trim()) return { error: "Please enter your phone number." };

  const supabase = createServiceClient();

  // Load the published menu (delivery date is fixed by us, from the menu).
  const { data: menu } = await supabase
    .from("weekly_menus")
    .select("id, delivery_date")
    .eq("id", input.weeklyMenuId)
    .eq("status", "published")
    .maybeSingle();
  if (!menu) return { error: "This menu is no longer available." };

  const { data: menuItems } = await supabase
    .from("weekly_menu_items")
    .select("food_item_id, food_item:food_items(name, max_per_week)")
    .eq("weekly_menu_id", menu.id);

  const info = new Map(
    (menuItems ?? []).map((m: any) => [
      m.food_item_id,
      { name: m.food_item?.name ?? "Item", max: Number(m.food_item?.max_per_week ?? 0) },
    ])
  );

  const lines = input.items
    .filter((i) => i.quantity > 0 && info.has(i.foodItemId))
    .map((i) => ({ name: info.get(i.foodItemId)!.name, quantity: i.quantity, max: info.get(i.foodItemId)!.max }));

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  if (totalQty !== 6) return { error: "Please select exactly 6 items." };
  for (const l of lines) {
    if (l.max > 0 && l.quantity > l.max) {
      return { error: `"${l.name}" can be selected at most ${l.max} time(s).` };
    }
  }

  const item_summary = lines.map((l) => `${l.name} x${l.quantity}`).join(", ");

  const { error } = await supabase.from("offline_subscribers").insert({
    full_name: input.full_name.trim(),
    phone: input.phone.trim(),
    passport_no: input.passport_no || null,
    nationality: input.nationality || null,
    city: input.city || null,
    address: input.address || null,
    zip_code: input.zip_code || null,
    room_building: input.room_building || null,
    delivery_date: menu.delivery_date, // fixed by us
    payment_amount: input.paymentAmount > 0 ? input.paymentAmount : null,
    receipt_url: input.receiptUrl || null,
    latitude: input.latitude,
    longitude: input.longitude,
    map_link: input.mapLink || null,
    item_summary,
    items: lines.map((l) => ({ name: l.name, quantity: l.quantity })),
    special_note: input.special_note || null,
    weekly_menu_id: menu.id,
  });
  if (error) return { error: error.message };

  return { success: true };
}
