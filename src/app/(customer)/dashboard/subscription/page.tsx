import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatKRW } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { SubscriptionActions } from "@/components/customer/SubscriptionActions";
import { ReceiptUpload } from "@/components/customer/ReceiptUpload";
import type { Order, Subscription } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const { profile } = await requireCustomer();
  const supabase = await createClient();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false });

  const subscriptions = (subs as Subscription[]) ?? [];

  // Orders grouped by subscription, to show the weekly deliveries.
  const { data: orderRows } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", profile.id)
    .order("delivery_date");
  const orders = (orderRows as Order[]) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Subscriptions</h1>

      {subscriptions.length === 0 && (
        <div className="card text-center">
          <p className="text-ink-secondary">You have no subscriptions yet.</p>
          <Link href="/select-food" className="btn btn-gold mt-4">Start a subscription</Link>
        </div>
      )}

      {subscriptions.map((sub) => {
        const subOrders = orders.filter((o) => o.subscription_id === sub.id);
        return (
          <div key={sub.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold capitalize">{sub.plan_type} plan</h2>
                <p className="text-sm text-ink-muted">
                  {formatDate(sub.start_date)} – {formatDate(sub.end_date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={sub.status} />
                <StatusBadge status={sub.payment_status} />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Info label="Weekly deliveries" value={String(sub.weekly_deliveries)} />
              <Info label="Total price" value={formatKRW(sub.total_price)} />
              <Info label="Delivery status" value={<StatusBadge status={sub.delivery_status} />} />
            </div>

            {/* Weekly deliveries */}
            {subOrders.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-ink-secondary">Weekly deliveries</p>
                <div className="mt-2 divide-y divide-teal/10">
                  {subOrders.map((o, i) => (
                    <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span>Week {i + 1} · {formatDate(o.delivery_date)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment receipt */}
            <div className="mt-5 rounded-xl border border-teal/15 bg-bg-surface p-4">
              <p className="text-sm font-semibold text-ink-secondary">Payment</p>
              <p className="mt-1 text-xs text-ink-muted">
                Pay by Toss Bank · <span className="text-gold">1002-6091-5319</span> (Arabiana), then upload your receipt below.
              </p>
              <div className="mt-3">
                <ReceiptUpload subscriptionId={sub.id} current={sub.receipt_url} paid={sub.payment_status === "paid"} />
              </div>
            </div>

            <div className="mt-5">
              <SubscriptionActions id={sub.id} status={sub.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
