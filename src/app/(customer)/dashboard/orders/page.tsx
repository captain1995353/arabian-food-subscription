import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatKRW } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { Message } from "@/components/ui/Toast";
import { ReceiptUpload } from "@/components/customer/ReceiptUpload";
import { DeleteOrderButton } from "@/components/customer/DeleteOrderButton";
import type { Order, OrderItem, Subscription } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { profile } = await requireCustomer();
  const { success } = await searchParams;
  const supabase = await createClient();

  const [{ data }, { data: subRows }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("customer_id", profile.id)
      .order("delivery_date", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("customer_id", profile.id)
      .neq("payment_status", "paid")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
  ]);

  const orders = (data as (Order & { order_items: OrderItem[] })[]) ?? [];
  const unpaidSubs = (subRows as Subscription[]) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Order History</h1>

      {success && (
        <Message type="success">
          Your order was placed! Complete payment below and we&apos;ll prepare your food.
        </Message>
      )}

      {/* Complete payment */}
      {unpaidSubs.map((s) => (
        <div key={s.id} className="card border-gold/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Complete your payment</h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Amount due: <span className="font-display font-bold text-gold">{formatKRW(s.total_price)}</span> · {s.plan_type} plan
              </p>
            </div>
            <StatusBadge status={s.payment_status} />
          </div>
          <div className="mt-3 rounded-lg bg-bg-surface p-3 text-sm">
            <p className="text-ink-secondary">Send the total by <strong className="text-gold">Toss Bank · 1002-6091-5319</strong> (UDDIN AZHAR), then upload your receipt:</p>
            <div className="mt-3">
              <ReceiptUpload subscriptionId={s.id} current={s.receipt_url} paid={s.payment_status === "paid"} />
            </div>
          </div>
        </div>
      ))}

      {orders.length === 0 ? (
        <div className="card text-center">
          <p className="text-ink-secondary">No orders yet.</p>
          <Link href="/select-food" className="btn btn-gold mt-4">Order food</Link>
        </div>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{o.order_number}</h2>
                <p className="text-sm text-ink-muted">Delivery {formatDate(o.delivery_date)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={o.status} />
                <StatusBadge status={o.payment_status} />
              </div>
            </div>

            <div className="mt-4 divide-y divide-teal/10">
              {o.order_items.map((it) => (
                <div key={it.id} className="py-2 text-sm">
                  <span>{it.name} × {it.quantity}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-teal/15 pt-3">
              <span className="text-sm text-ink-muted">
                {[o.delivery_address, o.delivery_room, o.delivery_city].filter(Boolean).join(", ")}
              </span>
              <span className="font-display font-bold text-gold">{formatKRW(o.total)}</span>
            </div>
            {o.special_note && (
              <p className="mt-2 text-xs text-ink-muted">Note: {o.special_note}</p>
            )}
            {o.status !== "delivered" && o.status !== "out_for_delivery" && (
              <div className="mt-3 flex justify-end border-t border-teal/10 pt-3">
                <DeleteOrderButton orderId={o.id} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
