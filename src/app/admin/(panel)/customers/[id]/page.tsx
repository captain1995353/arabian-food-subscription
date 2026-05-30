import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatKRW } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { CustomerEditForm } from "@/components/admin/CustomerEditForm";
import type { Customer, Order, Payment, Profile, Subscription } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!profile) notFound();

  const [{ data: customer }, { data: subs }, { data: orders }, { data: payments }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
    supabase.from("orders").select("*").eq("customer_id", id).order("delivery_date", { ascending: false }),
    supabase.from("payments").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
  ]);

  const p = profile as Profile;

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-gold">
        <ArrowLeft size={16} /> Back to customers
      </Link>
      <h1 className="text-2xl font-bold">{p.full_name || p.email}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <CustomerEditForm profile={p} customer={(customer as Customer) ?? null} />

        <div className="space-y-6">
          <HistoryCard title="Subscriptions">
            {(subs as Subscription[] ?? []).map((s) => (
              <Row key={s.id} left={`${s.plan_type} · ${formatDate(s.start_date)}`} right={<StatusBadge status={s.status} />} />
            ))}
            {(!subs || subs.length === 0) && <Empty />}
          </HistoryCard>

          <HistoryCard title="Orders">
            {(orders as Order[] ?? []).map((o) => (
              <Row key={o.id} left={`${o.order_number} · ${formatDate(o.delivery_date)}`} right={<StatusBadge status={o.status} />} />
            ))}
            {(!orders || orders.length === 0) && <Empty />}
          </HistoryCard>

          <HistoryCard title="Payments">
            {(payments as Payment[] ?? []).map((pay) => (
              <Row key={pay.id} left={`${formatKRW(pay.amount)} · ${pay.method.replace(/_/g, " ")}`} right={<StatusBadge status={pay.status} />} />
            ))}
            {(!payments || payments.length === 0) && <Empty />}
          </HistoryCard>
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 divide-y divide-teal/10">{children}</div>
    </div>
  );
}
function Row({ left, right }: { left: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span>{left}</span>
      {right}
    </div>
  );
}
function Empty() {
  return <p className="py-2 text-sm text-ink-muted">Nothing yet.</p>;
}
