"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/actions/notifications";
import type {
  DeliveryStatus,
  OrderStatus,
  PaymentMethod,
  SubscriptionStatus,
} from "@/lib/types";

export type AdminState = { error?: string; success?: boolean };

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_FOOD_BUCKET || "food-images";

// Read a checkbox value from FormData ("on" when checked, absent otherwise).
const checkbox = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";

// =====================================================================
//  FOOD ITEMS
// =====================================================================

/** Upload a food image to Supabase Storage and return its public URL. */
export async function uploadFoodImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file selected." };

  const supabase = await createClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `food/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) return { error: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function saveFoodItem(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = (formData.get("id") as string) || null;

  const payload = {
    name: (formData.get("name") as string)?.trim(),
    description: (formData.get("description") as string) || "",
    image_url: (formData.get("image_url") as string) || null,
    price: Number(formData.get("price") || 0),
    category: (formData.get("category") as string) || "Rice",
    is_halal: checkbox(formData, "is_halal"),
    spicy_level: Number(formData.get("spicy_level") || 0),
    available_quantity: Number(formData.get("available_quantity") || 0),
    is_active: checkbox(formData, "is_active"),
  };
  if (!payload.name) return { error: "Name is required." };

  const { error } = id
    ? await supabase.from("food_items").update(payload).eq("id", id)
    : await supabase.from("food_items").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/admin/food");
  return { success: true };
}

export async function deleteFoodItem(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("food_items").delete().eq("id", id);
  revalidatePath("/admin/food");
}

export async function toggleFoodActive(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("food_items").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/food");
}

// =====================================================================
//  PLANS / PACKAGES
// =====================================================================

export async function savePlan(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = (formData.get("id") as string) || null;
  const planType = ((formData.get("plan_type") as string) || "weekly") as "weekly" | "monthly";

  const payload = {
    name: (formData.get("name") as string)?.trim(),
    plan_type: planType,
    weeks_count: planType === "monthly" ? 4 : 1, // weekly = 1 delivery, monthly = 4
    item_count: Number(formData.get("item_count") || 0), // 0 = a-la-carte, >0 = fixed package
    base_price: Number(formData.get("base_price") || 0),
    description: (formData.get("description") as string) || "",
    is_active: checkbox(formData, "is_active"),
  };
  if (!payload.name) return { error: "Name is required." };

  const { error } = id
    ? await supabase.from("subscription_plans").update(payload).eq("id", id)
    : await supabase.from("subscription_plans").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/admin/packages");
  return { success: true };
}

export async function deletePlan(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("subscription_plans").delete().eq("id", id);
  revalidatePath("/admin/packages");
}

export async function togglePlanActive(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("subscription_plans").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/packages");
}

// =====================================================================
//  WEEKLY MENUS
// =====================================================================

export async function saveMenu(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = (formData.get("id") as string) || null;

  const payload = {
    title: (formData.get("title") as string)?.trim(),
    week_number: formData.get("week_number") ? Number(formData.get("week_number")) : null,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    delivery_date: formData.get("delivery_date") as string,
    order_deadline: new Date(formData.get("order_deadline") as string).toISOString(),
    status: (formData.get("status") as string) || "draft",
  };
  if (!payload.title) return { error: "Title is required." };

  const { error } = id
    ? await supabase.from("weekly_menus").update(payload).eq("id", id)
    : await supabase.from("weekly_menus").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/admin/menus");
  return { success: true };
}

export async function setMenuStatus(id: string, status: "draft" | "published" | "closed") {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("weekly_menus").update({ status }).eq("id", id);
  revalidatePath("/admin/menus");
}

export async function deleteMenu(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("weekly_menus").delete().eq("id", id);
  revalidatePath("/admin/menus");
}

/** Add a food item to a weekly menu (price/stock snapshot from the catalog). */
export async function addMenuItem(menuId: string, foodItemId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: food } = await supabase
    .from("food_items")
    .select("price, available_quantity")
    .eq("id", foodItemId)
    .single();
  await supabase.from("weekly_menu_items").insert({
    weekly_menu_id: menuId,
    food_item_id: foodItemId,
    price: food?.price ?? 0,
    available_quantity: food?.available_quantity ?? 0,
  });
  revalidatePath(`/admin/menus/${menuId}`);
}

export async function removeMenuItem(itemId: string, menuId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("weekly_menu_items").delete().eq("id", itemId);
  revalidatePath(`/admin/menus/${menuId}`);
}

// =====================================================================
//  ORDERS
// =====================================================================

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select("customer_id, order_number")
    .single();

  if (order) {
    await notify(
      order.customer_id,
      status === "delivered" ? "delivery_update" : "order_confirmation",
      `Order ${order.order_number} updated`,
      `Your order is now: ${status.replace(/_/g, " ")}.`
    );
  }
  revalidatePath("/admin/orders");
}

// =====================================================================
//  PAYMENTS
// =====================================================================

/** Mark an order (and any related payment record) as paid. */
export async function markOrderPaid(orderId: string, method: PaymentMethod, note?: string) {
  await requireAdmin();
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", orderId)
    .select("customer_id, subscription_id, total, order_number")
    .single();
  if (!order) return;

  // Update or create the payment record.
  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("payments")
      .update({ status: "paid", method, transaction_note: note ?? null, paid_at: new Date().toISOString(), confirmed_by: admin.id })
      .eq("id", existing.id);
  } else {
    await supabase.from("payments").insert({
      customer_id: order.customer_id,
      order_id: orderId,
      subscription_id: order.subscription_id,
      amount: order.total,
      method,
      status: "paid",
      transaction_note: note ?? null,
      paid_at: new Date().toISOString(),
      confirmed_by: admin.id,
    });
  }

  // If the order belongs to a subscription, mark the subscription paid too.
  if (order.subscription_id) {
    await supabase.from("subscriptions").update({ payment_status: "paid" }).eq("id", order.subscription_id);
  }

  await notify(
    order.customer_id,
    "payment_confirmation",
    "Payment confirmed ✅",
    `We received your payment for order ${order.order_number}. Thank you!`
  );

  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
}

// =====================================================================
//  SUBSCRIPTIONS
// =====================================================================

export async function adminUpdateSubscription(id: string, status: SubscriptionStatus) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("subscriptions").update({ status }).eq("id", id);
  revalidatePath("/admin/subscriptions");
}

/** Extend a subscription end date by N weeks. */
export async function extendSubscription(id: string, weeks: number) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: sub } = await supabase.from("subscriptions").select("end_date, weekly_deliveries").eq("id", id).single();
  if (!sub) return;
  const end = new Date(sub.end_date);
  end.setDate(end.getDate() + weeks * 7);
  await supabase
    .from("subscriptions")
    .update({ end_date: end.toISOString().slice(0, 10), weekly_deliveries: sub.weekly_deliveries + weeks })
    .eq("id", id);
  revalidatePath("/admin/subscriptions");
}

// =====================================================================
//  DELIVERIES
// =====================================================================

/**
 * Generate delivery rows for every (non-cancelled) order on a given date that
 * doesn't already have one. Builds the weekly delivery list.
 */
export async function generateDeliveries(deliveryDate: string): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, customer_id, delivery_city, delivery_address")
    .eq("delivery_date", deliveryDate)
    .neq("status", "cancelled");
  if (!orders?.length) return { error: "No orders found for that date." };

  const { data: existing } = await supabase
    .from("deliveries")
    .select("order_id")
    .eq("delivery_date", deliveryDate);
  const have = new Set((existing ?? []).map((d) => d.order_id));

  const rows = orders
    .filter((o) => !have.has(o.id))
    .map((o) => ({
      order_id: o.id,
      customer_id: o.customer_id,
      delivery_date: deliveryDate,
      status: "scheduled" as DeliveryStatus,
      city: o.delivery_city,
      address: o.delivery_address,
    }));

  if (rows.length) await supabase.from("deliveries").insert(rows);
  revalidatePath("/admin/deliveries");
  return { success: true };
}

export async function updateDeliveryStatus(id: string, status: DeliveryStatus) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: d } = await supabase
    .from("deliveries")
    .update({ status })
    .eq("id", id)
    .select("order_id, customer_id")
    .single();

  // Keep the order status in sync for the common transitions.
  if (d) {
    if (status === "delivered") {
      await supabase.from("orders").update({ status: "delivered" }).eq("id", d.order_id);
    } else if (status === "out_for_delivery") {
      await supabase.from("orders").update({ status: "out_for_delivery" }).eq("id", d.order_id);
    }
    await notify(d.customer_id, "delivery_update", "Delivery update", `Your delivery is now: ${status.replace(/_/g, " ")}.`);
  }
  revalidatePath("/admin/deliveries");
}

// =====================================================================
//  CUSTOMERS
// =====================================================================

export async function adminUpdateCustomer(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing customer id." };

  await supabase
    .from("profiles")
    .update({ full_name: formData.get("full_name") as string, phone: formData.get("phone") as string })
    .eq("id", id);

  await supabase
    .from("customers")
    .update({
      nationality: formData.get("nationality") as string,
      city: formData.get("city") as string,
      address: formData.get("address") as string,
      zip_code: formData.get("zip_code") as string,
      room_building: formData.get("room_building") as string,
      preferred_delivery_day: formData.get("preferred_delivery_day") as string,
      allergy_note: formData.get("allergy_note") as string,
    })
    .eq("id", id);

  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin/customers");
  return { success: true };
}
