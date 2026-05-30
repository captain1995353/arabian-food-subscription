import { createClient } from "@/lib/supabase/server";
import { formatDate, formatKRW } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { OrderControls } from "@/components/admin/OrderControls";
import type { Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment?: string; date?: string; city?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("delivery_date", { ascending: false });

  if (sp.status) query = query.eq("status", sp.status);
  if (sp.payment) query = query.eq("payment_status", sp.payment);
  if (sp.date) query = query.eq("delivery_date", sp.date);
  if (sp.city) query = query.ilike("delivery_city", `%${sp.city}%`);

  const { data } = await query;
  const orders = (data as (Order & { order_items: OrderItem[] })[]) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      {/* Filters */}
      <form className="card grid gap-3 sm:grid-cols-5" method="get">
        <div>
          <label>Status</label>
          <select name="status" defaultValue={sp.status ?? ""}>
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div>
          <label>Payment</label>
          <select name="payment" defaultValue={sp.payment ?? ""}>
            <option value="">All</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
          </select>
        </div>
        <div>
          <label>Delivery date</label>
          <input type="date" name="date" defaultValue={sp.date ?? ""} />
        </div>
        <div>
          <label>City</label>
          <input name="city" defaultValue={sp.city ?? ""} placeholder="e.g. Seoul" />
        </div>
        <div className="flex items-end">
          <button className="btn btn-gold w-full py-2.5">Filter</button>
        </div>
      </form>

      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{o.order_number}</h2>
                  <StatusBadge status={o.payment_status} />
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {o.delivery_name} · {o.delivery_phone} · {formatDate(o.delivery_date)}
                </p>
                <p className="text-sm text-ink-muted">
                  {[o.delivery_address, o.delivery_room, o.delivery_city, o.delivery_zip].filter(Boolean).join(", ")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-gold">{formatKRW(o.total)}</p>
                <div className="mt-2"><OrderControls orderId={o.id} status={o.status} paid={o.payment_status === "paid"} /></div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-teal/10 pt-3 text-sm text-ink-secondary">
              {o.order_items.map((it) => (
                <span key={it.id}>{it.name} ×{it.quantity}</span>
              ))}
            </div>
            {o.special_note && <p className="mt-2 text-xs text-gold">Note: {o.special_note}</p>}
          </div>
        ))}
        {orders.length === 0 && <p className="text-ink-muted">No orders match these filters.</p>}
      </div>
    </div>
  );
}
