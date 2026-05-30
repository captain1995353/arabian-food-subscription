import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Customer, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let pq = supabase.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false });
  if (q) pq = pq.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  const { data: profiles } = await pq;
  const profs = (profiles as Profile[]) ?? [];

  const ids = profs.map((p) => p.id);
  const { data: custRows } = ids.length
    ? await supabase.from("customers").select("*").in("id", ids)
    : { data: [] as Customer[] };
  const cmap = new Map((custRows ?? []).map((c) => [c.id, c as Customer]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customers</h1>

      <form method="get" className="flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Search name or email…" className="max-w-sm" />
        <button className="btn btn-gold py-2.5">Search</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-teal/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-secondary text-left text-ink-muted">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">City</th>
              <th className="p-3">Nationality</th>
              <th className="p-3">Joined</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal/10">
            {profs.map((p) => {
              const c = cmap.get(p.id);
              return (
                <tr key={p.id}>
                  <td className="p-3 font-medium">{p.full_name || "—"}</td>
                  <td className="p-3">{p.email}</td>
                  <td className="p-3">{p.phone ?? "—"}</td>
                  <td className="p-3">{c?.city ?? "—"}</td>
                  <td className="p-3">{c?.nationality ?? "—"}</td>
                  <td className="p-3">{formatDate(p.created_at)}</td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/customers/${p.id}`} className="text-gold hover:underline">View</Link>
                  </td>
                </tr>
              );
            })}
            {profs.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-ink-muted">No customers found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
