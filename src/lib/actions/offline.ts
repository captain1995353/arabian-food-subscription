"use server";

import { createServiceClient } from "@/lib/supabase/server";

export interface OfflineInput {
  full_name: string;
  phone: string;
  nationality: string;
  city: string;
  address: string;
  zip_code: string;
  room_building: string;
  delivery_day: string;
  special_note: string;
  weeklyMenuId: string;
  items: { foodItemId: string; quantity: number }[];
}

export type OfflineResult = { error?: string; success?: boolean };

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

  // Load the published menu items (authoritative names + caps).
  const { data: menu } = await supabase
    .from("weekly_menus")
    .select("id")
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
    nationality: input.nationality || null,
    city: input.city || null,
    address: input.address || null,
    zip_code: input.zip_code || null,
    room_building: input.room_building || null,
    delivery_day: input.delivery_day || null,
    item_summary,
    items: lines.map((l) => ({ name: l.name, quantity: l.quantity })),
    special_note: input.special_note || null,
    weekly_menu_id: menu.id,
  });
  if (error) return { error: error.message };

  return { success: true };
}
