import { createClient } from "@/lib/supabase/server";
import { formatDate, formatKRW } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { MarkPaidButton } from "@/components/admin/MarkPaidButton";
import type { Order, Payment } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const [{ data: unpaidRows }, { data: payRows }] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .neq("payment_status", "paid")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
    supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  const unpaid = (unpaidRows as Order[]) ?? [];
  const payments = (payRows as Payment[]) ?? [];

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalUnpaid = unpaid.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card"><p className="text-sm text-ink-muted">Confirmed revenue</p><p className="mt-1 font-display text-2xl font-bold text-gold">{formatKRW(totalPaid)}</p></div>
        <div className="card"><p className="text-sm text-ink-muted">Outstanding (unpaid orders)</p><p className="mt-1 font-display text-2xl font-bold text-spice">{formatKRW(totalUnpaid)}</p></div>
      </div>

      {/* Unpaid orders */}
      <div className="card">
        <h2 className="text-lg font-semibold">Unpaid / pending orders</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted"><tr><th className="pb-2">Order</th><th className="pb-2">Delivery</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-teal/10">
              {unpaid.map((o) => (
                <tr key={o.id}>
                  <td className="py-2.5 font-medium">{o.order_number}</td>
                  <td className="py-2.5">{formatDate(o.delivery_date)}</td>
                  <td className="py-2.5">{formatKRW(o.total)}</td>
                  <td className="py-2.5"><StatusBadge status={o.payment_status} /></td>
                  <td className="py-2.5 text-right"><MarkPaidButton orderId={o.id} /></td>
                </tr>
              ))}
              {unpaid.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-ink-muted">All orders are paid 🎉</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment history */}
      <div className="card">
        <h2 className="text-lg font-semibold">Payment records</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted"><tr><th className="pb-2">Date</th><th className="pb-2">Amount</th><th className="pb-2">Method</th><th className="pb-2">Status</th><th className="pb-2">Note</th></tr></thead>
            <tbody className="divide-y divide-teal/10">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5">{formatDate(p.paid_at ?? p.created_at)}</td>
                  <td className="py-2.5">{formatKRW(p.amount)}</td>
                  <td className="py-2.5 capitalize">{p.method.replace(/_/g, " ")}</td>
                  <td className="py-2.5"><StatusBadge status={p.status} /></td>
                  <td className="py-2.5 text-ink-muted">{p.transaction_note ?? "—"}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-ink-muted">No payments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
