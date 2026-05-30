import Link from "next/link";
import { Users, CalendarRange, CreditCard, Truck, Wallet, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatKRW } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

async function count(table: string, build: (q: any) => any) {
  const supabase = await createClient();
  const q = build(supabase.from(table).select("*", { count: "exact", head: true }));
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    customers,
    activeSubs,
    weeklyOrders,
    monthlyOrders,
    pendingPayments,
    upcomingDeliveries,
  ] = await Promise.all([
    count("customers", (q) => q),
    count("subscriptions", (q) => q.eq("status", "active")),
    count("subscriptions", (q) => q.eq("plan_type", "weekly")),
    count("subscriptions", (q) => q.eq("plan_type", "monthly")),
    count("orders", (q) => q.neq("payment_status", "paid").neq("status", "cancelled")),
    count("deliveries", (q) => q.gte("delivery_date", today).neq("status", "delivered")),
  ]);

  // Revenue = sum of paid payments.
  const { data: paid } = await supabase.from("payments").select("amount").eq("status", "paid");
  const revenue = (paid ?? []).reduce((s, p) => s + Number(p.amount), 0);

  const { data: recent } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);
  const recentOrders = (recent as Order[]) ?? [];

  const stats = [
    { label: "Customers", value: customers, icon: Users, href: "/admin/customers" },
    { label: "Active subscriptions", value: activeSubs, icon: CalendarRange, href: "/admin/subscriptions" },
    { label: "Weekly subs", value: weeklyOrders, icon: ShoppingBag, href: "/admin/subscriptions" },
    { label: "Monthly subs", value: monthlyOrders, icon: ShoppingBag, href: "/admin/subscriptions" },
    { label: "Pending payments", value: pendingPayments, icon: CreditCard, href: "/admin/payments" },
    { label: "Upcoming deliveries", value: upcomingDeliveries, icon: Truck, href: "/admin/deliveries" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Revenue banner */}
      <div className="card flex items-center justify-between bg-gradient-teal">
        <div>
          <p className="flex items-center gap-2 text-sm text-white/80"><Wallet size={16} /> Total revenue (paid)</p>
          <p className="mt-1 font-display text-3xl font-bold text-gold">{formatKRW(revenue)}</p>
        </div>
        <Link href="/admin/reports" className="btn btn-gold py-2">View reports</Link>
      </div>

      {/* Stat grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card transition hover:border-gold/40">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-muted">{s.label}</span>
              <s.icon size={18} className="text-gold" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold">{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-gold hover:underline">View all</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th className="pb-2">Order</th>
                <th className="pb-2">Delivery</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal/10">
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="py-2.5 font-medium">{o.order_number}</td>
                  <td className="py-2.5">{formatDate(o.delivery_date)}</td>
                  <td className="py-2.5">{formatKRW(o.total)}</td>
                  <td className="py-2.5"><StatusBadge status={o.status} /></td>
                  <td className="py-2.5"><StatusBadge status={o.payment_status} /></td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-ink-muted">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
