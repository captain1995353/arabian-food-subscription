import { createClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ data: paid }, { data: items }, { count: activeCustomers }, { data: unpaid }, { data: deliveries }] =
    await Promise.all([
      supabase.from("payments").select("amount, paid_at").eq("status", "paid"),
      supabase.from("order_items").select("name, quantity, line_total"),
      supabase.from("subscriptions").select("customer_id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("orders").select("total").neq("payment_status", "paid").neq("status", "cancelled"),
      supabase.from("deliveries").select("status"),
    ]);

  const paidRows = paid ?? [];
  const weekRevenue = paidRows.filter((p) => p.paid_at && new Date(p.paid_at) >= weekAgo).reduce((s, p) => s + Number(p.amount), 0);
  const monthRevenue = paidRows.filter((p) => p.paid_at && new Date(p.paid_at) >= monthStart).reduce((s, p) => s + Number(p.amount), 0);
  const allRevenue = paidRows.reduce((s, p) => s + Number(p.amount), 0);

  // Most ordered items
  const agg = new Map<string, { qty: number; revenue: number }>();
  for (const it of items ?? []) {
    const cur = agg.get(it.name) ?? { qty: 0, revenue: 0 };
    cur.qty += it.quantity;
    cur.revenue += Number(it.line_total);
    agg.set(it.name, cur);
  }
  const topItems = [...agg.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);

  const pendingTotal = (unpaid ?? []).reduce((s, o) => s + Number(o.total), 0);
  const delivered = (deliveries ?? []).filter((d) => d.status === "delivered").length;
  const pendingDeliveries = (deliveries ?? []).filter((d) => d.status !== "delivered" && d.status !== "failed").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Revenue · last 7 days" value={formatKRW(weekRevenue)} />
        <Stat label="Revenue · this month" value={formatKRW(monthRevenue)} />
        <Stat label="Revenue · all time" value={formatKRW(allRevenue)} />
        <Stat label="Active customers (subs)" value={String(activeCustomers ?? 0)} />
        <Stat label="Pending payments" value={formatKRW(pendingTotal)} accent="spice" />
        <Stat label="Deliveries done / pending" value={`${delivered} / ${pendingDeliveries}`} />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold">Most ordered items</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted"><tr><th className="pb-2">#</th><th className="pb-2">Item</th><th className="pb-2">Qty ordered</th><th className="pb-2">Revenue</th></tr></thead>
            <tbody className="divide-y divide-teal/10">
              {topItems.map(([name, v], i) => (
                <tr key={name}>
                  <td className="py-2.5 text-ink-muted">{i + 1}</td>
                  <td className="py-2.5 font-medium">{name}</td>
                  <td className="py-2.5">{v.qty}</td>
                  <td className="py-2.5">{formatKRW(v.revenue)}</td>
                </tr>
              ))}
              {topItems.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-ink-muted">No order data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "spice" }) {
  return (
    <div className="card">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${accent === "spice" ? "text-spice" : "text-gold"}`}>{value}</p>
    </div>
  );
}
