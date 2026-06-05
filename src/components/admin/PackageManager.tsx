"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { savePlan, deletePlan, togglePlanActive, type AdminState } from "@/lib/actions/admin";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Message } from "@/components/ui/Toast";
import { formatKRW } from "@/lib/utils";
import type { SubscriptionPlan } from "@/lib/types";

export function PackageManager({ plans }: { plans: SubscriptionPlan[] }) {
  const [editing, setEditing] = useState<SubscriptionPlan | "new" | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plans &amp; Packages</h1>
          <p className="mt-1 text-sm text-ink-muted">
            A <strong>package</strong> = pick exactly N items for a flat price. Set item count to 0 for pay-per-dish.
          </p>
        </div>
        <button onClick={() => setEditing("new")} className="btn btn-gold py-2"><Plus size={16} /> New plan</button>
      </div>

      {editing && <PlanForm plan={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}

      <div className="overflow-x-auto rounded-2xl border border-teal/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-secondary text-left text-ink-muted">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Items</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal/10">
            {plans.map((p) => (
              <tr key={p.id}>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 capitalize">{p.plan_type} ({p.weeks_count}w)</td>
                <td className="p-3">{p.item_count > 0 ? `${p.item_count} / week` : "Pay per dish"}</td>
                <td className="p-3">{p.item_count > 0 ? `${formatKRW(p.base_price)} / week` : "—"}</td>
                <td className="p-3">
                  <button
                    onClick={() => start(() => togglePlanActive(p.id, !p.is_active))}
                    className={`badge ${p.is_active ? "border-teal/40 bg-teal/20 text-teal-light" : "border-ink-muted/30 bg-ink-muted/15 text-ink-muted"}`}
                  >
                    {p.is_active ? "Active" : "Hidden"}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(p)} className="text-ink-muted hover:text-gold"><Pencil size={16} /></button>
                    <button
                      disabled={pending}
                      onClick={() => { if (confirm(`Delete "${p.name}"?`)) start(() => deletePlan(p.id)); }}
                      className="text-ink-muted hover:text-spice"
                    ><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {plans.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-ink-muted">No plans yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanForm({ plan, onDone }: { plan: SubscriptionPlan | null; onDone: () => void }) {
  const [state, action] = useActionState<AdminState, FormData>(savePlan, {});
  useEffect(() => { if (state.success) onDone(); }, [state.success, onDone]);

  return (
    <form action={action} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{plan ? "Edit plan" : "New plan / package"}</h2>
        <button type="button" onClick={onDone} className="text-sm text-ink-muted hover:text-gold">Close</button>
      </div>
      {plan && <input type="hidden" name="id" defaultValue={plan.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label>Name</label>
          <input name="name" defaultValue={plan?.name ?? ""} placeholder="e.g. Weekly Package (6 items)" required />
        </div>
        <div>
          <label>Type</label>
          <select name="plan_type" defaultValue={plan?.plan_type ?? "weekly"}>
            <option value="weekly">Weekly (1 delivery)</option>
            <option value="monthly">Monthly (4 weekly deliveries)</option>
          </select>
        </div>
        <div>
          <label>Items per week (0 = pay per dish)</label>
          <input type="number" name="item_count" min={0} defaultValue={plan?.item_count ?? 6} />
        </div>
        <div>
          <label>Flat price per week (₩)</label>
          <input type="number" name="base_price" min={0} defaultValue={plan?.base_price ?? 0} />
          <p className="mt-1 text-xs text-ink-muted">Only used when items per week &gt; 0. Monthly total = price × 4.</p>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_active" defaultChecked={plan ? plan.is_active : true} className="h-4 w-4" />
            <span className="!mb-0">Active (visible to customers)</span>
          </label>
        </div>
      </div>
      <div>
        <label>Description</label>
        <textarea name="description" rows={2} defaultValue={plan?.description ?? ""} />
      </div>
      {state.error && <Message type="error">{state.error}</Message>}
      <SubmitButton pendingText="Saving…">{plan ? "Save plan" : "Create plan"}</SubmitButton>
    </form>
  );
}
