import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { GenerateDeliveries, DeliveryStatusSelect } from "@/components/admin/DeliveryControls";
import type { Delivery, Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let dq = supabase.from("deliveries").select("*").order("city");
  if (date) dq = dq.eq("delivery_date", date);
  else dq = dq.gte("delivery_date", today);
  const { data: delRows } = await dq;
  const deliveries = (delRows as Delivery[]) ?? [];

  // Pull the related orders (for name/phone/room/items/note).
  const orderIds = deliveries.map((d) => d.order_id);
  const { data: orderRows } = orderIds.length
    ? await supabase.from("orders").select("*, order_items(*)").in("id", orderIds)
    : { data: [] as (Order & { order_items: OrderItem[] })[] };
  const omap = new Map((orderRows ?? []).map((o: any) => [o.id, o]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Deliveries</h1>

      <GenerateDeliveries defaultDate={date ?? today} />

      <div className="card print:shadow-none">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Delivery list {date ? `· ${formatDate(date)}` : "· upcoming"}
          </h2>
          <span className="text-sm text-ink-muted">{deliveries.length} stop(s)</span>
        </div>

        <div className="mt-4 space-y-3">
          {deliveries.map((d) => {
            const o = omap.get(d.order_id);
            return (
              <div key={d.id} className="rounded-xl border border-teal/15 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{o?.delivery_name ?? "Customer"} · {o?.delivery_phone ?? ""}</p>
                    <p className="text-sm text-ink-secondary">
                      {[d.address, o?.delivery_room, d.city, o?.delivery_zip].filter(Boolean).join(", ")}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {(o?.order_items ?? []).map((it: OrderItem) => `${it.name}×${it.quantity}`).join(", ")}
                    </p>
                    {o?.special_note && <p className="mt-1 text-xs text-gold">Note: {o.special_note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    <DeliveryStatusSelect id={d.id} status={d.status} />
                  </div>
                </div>
              </div>
            );
          })}
          {deliveries.length === 0 && (
            <p className="text-ink-muted">No deliveries. Pick a date above and generate the list from that day&apos;s orders.</p>
          )}
        </div>
      </div>
    </div>
  );
}
