import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatKRW } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { SubscriptionControls } from "@/components/admin/SubscriptionControls";
import type { Profile, Subscription } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });
  if (sp.plan) query = query.eq("plan_type", sp.plan);
  if (sp.status) query = query.eq("status", sp.status);

  const { data } = await query;
  const rows = (data as Subscription[]) ?? [];

  // customer_id === profile id; fetch the matching profiles in one query.
  const ids = [...new Set(rows.map((r) => r.customer_id))];
  const { data: profs } = ids.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", ids)
    : { data: [] as Pick<Profile, "id" | "full_name" | "email">[] };
  const pmap = new Map((profs ?? []).map((p) => [p.id, p]));

  const subs = rows.map((s) => ({ ...s, customer: pmap.get(s.customer_id) }));

  const tabs = [
    { label: "All", href: "/admin/subscriptions" },
    { label: "Weekly", href: "/admin/subscriptions?plan=weekly" },
    { label: "Monthly", href: "/admin/subscriptions?plan=monthly" },
    { label: "Active", href: "/admin/subscriptions?status=active" },
    { label: "Paused", href: "/admin/subscriptions?status=paused" },
    { label: "Cancelled", href: "/admin/subscriptions?status=cancelled" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Subscriptions</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.label} href={t.href} className="rounded-full border border-teal/25 px-4 py-1.5 text-sm text-ink-muted hover:border-gold hover:text-gold">
            {t.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-teal/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-secondary text-left text-ink-muted">
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Period</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal/10">
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="p-3">
                  <p className="font-medium">{s.customer?.full_name}</p>
                  <p className="text-xs text-ink-muted">{s.customer?.email}</p>
                </td>
                <td className="p-3 capitalize">{s.plan_type}</td>
                <td className="p-3">{formatDate(s.start_date)} – {formatDate(s.end_date)}</td>
                <td className="p-3">{formatKRW(s.total_price)}</td>
                <td className="p-3"><StatusBadge status={s.payment_status} /></td>
                <td className="p-3"><StatusBadge status={s.status} /></td>
                <td className="p-3"><SubscriptionControls id={s.id} status={s.status} /></td>
              </tr>
            ))}
            {subs.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-ink-muted">No subscriptions.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
