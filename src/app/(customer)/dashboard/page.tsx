import Link from "next/link";
import { Bell, CalendarClock, CreditCard, Package } from "lucide-react";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatKRW } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import type { Order, Subscription, Notification } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { profile } = await requireCustomer();
  const supabase = await createClient();

  const [{ data: subs }, { data: orders }, { data: notes }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("customer_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*")
      .eq("customer_id", profile.id)
      .order("delivery_date", { ascending: true }),
    supabase
      .from("notifications")
      .select("*")
      .eq("customer_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const subscriptions = (subs as Subscription[]) ?? [];
  const allOrders = (orders as Order[]) ?? [];
  const notifications = (notes as Notification[]) ?? [];

  const activeSub = subscriptions.find((s) => s.status === "active");
  const today = new Date().toISOString().slice(0, 10);
  const nextDelivery = allOrders.find(
    (o) => o.delivery_date && o.delivery_date >= today && o.status !== "cancelled"
  );
  const recentOrders = [...allOrders].reverse().slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {profile.full_name.split(" ")[0] || "there"} 👋</h1>
        <p className="mt-1 text-sm text-ink-muted">Here&apos;s your subscription at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<CalendarClock size={18} />} label="Subscription">
          {activeSub ? (
            <span className="capitalize">{activeSub.plan_type} · active</span>
          ) : (
            <span className="text-ink-muted">None</span>
          )}
        </StatCard>
        <StatCard icon={<Package size={18} />} label="Next delivery">
          {nextDelivery ? formatDate(nextDelivery.delivery_date) : "—"}
        </StatCard>
        <StatCard icon={<CreditCard size={18} />} label="Payment">
          {activeSub ? <StatusBadge status={activeSub.payment_status} /> : "—"}
        </StatCard>
        <StatCard icon={<Package size={18} />} label="Total orders">
          {allOrders.length}
        </StatCard>
      </div>

      {/* Active subscription / CTA */}
      {activeSub ? (
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Your active subscription</h2>
            <StatusBadge status={activeSub.status} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <Field label="Plan"><span className="capitalize">{activeSub.plan_type}</span></Field>
            <Field label="Weekly deliveries">{activeSub.weekly_deliveries}</Field>
            <Field label="Period">{formatDate(activeSub.start_date)} – {formatDate(activeSub.end_date)}</Field>
            <Field label="Total">{formatKRW(activeSub.total_price)}</Field>
          </div>
          <div className="mt-5 flex gap-3">
            <Link href="/dashboard/subscription" className="btn btn-outline py-2">Manage subscription</Link>
            <Link href="/select-food" className="btn btn-gold py-2">Order again</Link>
          </div>
        </div>
      ) : (
        <div className="card text-center">
          <h2 className="text-lg font-semibold">No active subscription yet</h2>
          <p className="mt-1 text-ink-muted">Pick your meals from this week&apos;s menu to get started.</p>
          <Link href="/select-food" className="btn btn-gold mt-4">Browse & order food</Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent orders</h2>
            <Link href="/dashboard/orders" className="text-sm text-gold hover:underline">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No orders yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-teal/10">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{o.order_number}</p>
                    <p className="text-ink-muted">Delivery {formatDate(o.delivery_date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <StatusBadge status={o.payment_status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-gold" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          {notifications.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No notifications.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-lg bg-bg-surface p-3">
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-ink-muted">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-medium">{children}</p>
    </div>
  );
}
