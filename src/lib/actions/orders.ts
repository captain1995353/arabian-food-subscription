"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/actions/notifications";
import { addDays } from "@/lib/utils";
import type { PaymentMethod, PlanType } from "@/lib/types";

export interface PlaceOrderInput {
  weeklyMenuId: string;
  planType: PlanType;
  items: { foodItemId: string; quantity: number }[];
  specialNote?: string;
  paymentMethod: PaymentMethod;
  delivery: {
    name: string;
    phone: string;
    city: string;
    address: string;
    zip: string;
    room: string;
  };
}

export interface PlaceOrderResult {
  error?: string;
  orderId?: string;
  subscriptionId?: string;
}

/**
 * Core checkout flow. Implements the business logic:
 *  - validates the chosen items against the PUBLISHED weekly menu
 *  - prices everything server-side (never trusts the client)
 *  - weekly plan => 1 weekly delivery; monthly plan => 4 weekly deliveries
 *  - creates a subscription, one order per delivery week, order items,
 *    an (unpaid) payment record, and an order-confirmation notification
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  if (!input.items.length) return { error: "Please select at least one food item." };

  // 1. Confirm the menu is published and load its priced items.
  const { data: menu } = await supabase
    .from("weekly_menus")
    .select("*")
    .eq("id", input.weeklyMenuId)
    .eq("status", "published")
    .maybeSingle();
  if (!menu) return { error: "This weekly menu is no longer available." };

  const { data: menuItems } = await supabase
    .from("weekly_menu_items")
    .select("food_item_id, price, available_quantity, food_item:food_items(name)")
    .eq("weekly_menu_id", menu.id);

  const priceMap = new Map(
    (menuItems ?? []).map((m: any) => [
      m.food_item_id,
      { price: Number(m.price), name: m.food_item?.name ?? "Item", stock: m.available_quantity },
    ])
  );

  // 2. Build validated line items + per-week subtotal.
  const lines = input.items
    .filter((i) => i.quantity > 0 && priceMap.has(i.foodItemId))
    .map((i) => {
      const info = priceMap.get(i.foodItemId)!;
      return {
        food_item_id: i.foodItemId,
        name: info.name,
        unit_price: info.price,
        quantity: i.quantity,
        line_total: info.price * i.quantity,
      };
    });
  if (!lines.length) return { error: "Selected items are not on this week's menu." };

  const perWeek = lines.reduce((s, l) => s + l.line_total, 0);
  const weeks = input.planType === "monthly" ? 4 : 1;
  const total = perWeek * weeks;

  // 3. Resolve a matching plan (optional link).
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("plan_type", input.planType)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const firstDelivery = new Date(menu.delivery_date);
  const startDate = menu.delivery_date;
  const endDate = addDays(firstDelivery, (weeks - 1) * 7);

  // 4. Create the subscription.
  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .insert({
      customer_id: user.id,
      plan_id: plan?.id ?? null,
      plan_type: input.planType,
      start_date: startDate,
      end_date: endDate,
      weekly_deliveries: weeks,
      total_price: total,
      payment_status: "unpaid",
      delivery_status: "scheduled",
      status: "active",
    })
    .select("id")
    .single();
  if (subErr || !sub) return { error: subErr?.message ?? "Could not create subscription." };

  // 5. Create one order (+ items) per delivery week.
  let firstOrderId = "";
  for (let w = 0; w < weeks; w++) {
    const deliveryDate = addDays(firstDelivery, w * 7);
    const { data: order, error: ordErr } = await supabase
      .from("orders")
      .insert({
        customer_id: user.id,
        subscription_id: sub.id,
        weekly_menu_id: menu.id,
        delivery_date: deliveryDate,
        delivery_name: input.delivery.name,
        delivery_phone: input.delivery.phone,
        delivery_city: input.delivery.city,
        delivery_address: input.delivery.address,
        delivery_zip: input.delivery.zip,
        delivery_room: input.delivery.room,
        special_note: input.specialNote ?? null,
        subtotal: perWeek,
        total: perWeek,
        status: "pending",
        payment_status: "unpaid",
      })
      .select("id")
      .single();
    if (ordErr || !order) return { error: ordErr?.message ?? "Could not create order." };
    if (!firstOrderId) firstOrderId = order.id;

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (itemsErr) return { error: itemsErr.message };
  }

  // 6. Record the (unpaid) payment for the whole subscription.
  await supabase.from("payments").insert({
    customer_id: user.id,
    subscription_id: sub.id,
    order_id: firstOrderId,
    amount: total,
    method: input.paymentMethod,
    status: "unpaid",
  });

  // 7. Notify the customer.
  await notify(
    user.id,
    "order_confirmation",
    "Order received 🎉",
    `Your ${input.planType} subscription (${weeks} ${
      weeks === 1 ? "delivery" : "deliveries"
    }) is confirmed. Please complete payment so we can prepare your food.`
  );

  revalidatePath("/dashboard");
  return { orderId: firstOrderId, subscriptionId: sub.id };
}

/** Customer pauses their subscription. */
export async function pauseSubscription(subscriptionId: string) {
  const supabase = await createClient();
  await supabase.from("subscriptions").update({ status: "paused" }).eq("id", subscriptionId);
  revalidatePath("/dashboard/subscription");
}

/** Customer resumes a paused subscription. */
export async function resumeSubscription(subscriptionId: string) {
  const supabase = await createClient();
  await supabase.from("subscriptions").update({ status: "active" }).eq("id", subscriptionId);
  revalidatePath("/dashboard/subscription");
}

/** Customer cancels their subscription (and any non-delivered orders). */
export async function cancelSubscription(subscriptionId: string) {
  const supabase = await createClient();
  await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", subscriptionId);
  await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("subscription_id", subscriptionId)
    .in("status", ["pending", "confirmed"]);
  revalidatePath("/dashboard/subscription");
}
