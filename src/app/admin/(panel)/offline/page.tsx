import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { OfflineSubscriber } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminOfflinePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offline_subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  const rows = (data as OfflineSubscriber[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Offline Subscribers</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Submissions from the public form at <code className="text-gold">/offline</code>. {rows.length} total.
          </p>
        </div>
        <a href="/admin/offline/export" className="btn btn-gold py-2">
          <Download size={16} /> Export to Excel (CSV)
        </a>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-teal/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-secondary text-left text-ink-muted">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Passport</th>
              <th className="p-3">City</th>
              <th className="p-3">Address</th>
              <th className="p-3">Delivery</th>
              <th className="p-3">Items</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal/10">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-3 whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td className="p-3 font-medium">{r.full_name}</td>
                <td className="p-3 whitespace-nowrap">{r.phone}</td>
                <td className="p-3">{r.passport_no ?? "—"}</td>
                <td className="p-3">{r.city ?? "—"}</td>
                <td className="p-3">{[r.address, r.room_building, r.zip_code].filter(Boolean).join(", ") || "—"}</td>
                <td className="p-3 whitespace-nowrap">{r.delivery_date ? formatDate(r.delivery_date) : "—"}</td>
                <td className="p-3">{r.item_summary ?? "—"}</td>
                <td className="p-3 text-ink-muted">{r.special_note ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-ink-muted">No offline submissions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
