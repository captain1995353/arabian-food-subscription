"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Settings2 } from "lucide-react";
import { saveMenu, setMenuStatus, deleteMenu, type AdminState } from "@/lib/actions/admin";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Message } from "@/components/ui/Toast";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { WeeklyMenu } from "@/lib/types";

export function MenuManager({ menus }: { menus: WeeklyMenu[] }) {
  const [editing, setEditing] = useState<WeeklyMenu | "new" | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weekly Menus</h1>
        <button onClick={() => setEditing("new")} className="btn btn-gold py-2">
          <Plus size={16} /> New menu
        </button>
      </div>

      {editing && <MenuForm menu={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}

      <div className="grid gap-4">
        {menus.map((m) => (
          <div key={m.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{m.title}</h2>
                  <StatusBadge status={m.status} />
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatDate(m.start_date)} – {formatDate(m.end_date)} · Delivery {formatDate(m.delivery_date)} · Order by {formatDateTime(m.order_deadline)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/menus/${m.id}`} className="btn btn-outline py-1.5 text-xs"><Settings2 size={14} /> Items</Link>
                {m.status !== "published" && (
                  <button onClick={() => start(() => setMenuStatus(m.id, "published"))} disabled={pending} className="btn btn-gold py-1.5 text-xs">Publish</button>
                )}
                {m.status === "published" && (
                  <button onClick={() => start(() => setMenuStatus(m.id, "closed"))} disabled={pending} className="btn btn-outline py-1.5 text-xs">Close</button>
                )}
                <button onClick={() => setEditing(m)} className="text-ink-muted hover:text-gold"><Pencil size={16} /></button>
                <button
                  onClick={() => { if (confirm(`Delete menu "${m.title}"?`)) start(() => deleteMenu(m.id)); }}
                  className="text-ink-muted hover:text-spice"
                ><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {menus.length === 0 && <p className="text-ink-muted">No menus yet. Create your first weekly menu.</p>}
      </div>
    </div>
  );
}

function MenuForm({ menu, onDone }: { menu: WeeklyMenu | null; onDone: () => void }) {
  const [state, action] = useActionState<AdminState, FormData>(saveMenu, {});
  useEffect(() => { if (state.success) onDone(); }, [state.success, onDone]);

  // datetime-local needs "yyyy-MM-ddTHH:mm"
  const deadline = menu?.order_deadline ? new Date(menu.order_deadline).toISOString().slice(0, 16) : "";

  return (
    <form action={action} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{menu ? "Edit menu" : "New weekly menu"}</h2>
        <button type="button" onClick={onDone} className="text-sm text-ink-muted hover:text-gold">Close</button>
      </div>
      {menu && <input type="hidden" name="id" defaultValue={menu.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label>Title</label>
          <input name="title" defaultValue={menu?.title ?? ""} placeholder="e.g. Week of June 2 – June 8" required />
        </div>
        <div>
          <label>Week number</label>
          <input type="number" name="week_number" defaultValue={menu?.week_number ?? ""} />
        </div>
        <div>
          <label>Status</label>
          <select name="status" defaultValue={menu?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label>Start date</label>
          <input type="date" name="start_date" defaultValue={menu?.start_date ?? ""} required />
        </div>
        <div>
          <label>End date</label>
          <input type="date" name="end_date" defaultValue={menu?.end_date ?? ""} required />
        </div>
        <div>
          <label>Delivery date</label>
          <input type="date" name="delivery_date" defaultValue={menu?.delivery_date ?? ""} required />
        </div>
        <div>
          <label>Order deadline</label>
          <input type="datetime-local" name="order_deadline" defaultValue={deadline} required />
        </div>
      </div>
      {state.error && <Message type="error">{state.error}</Message>}
      <SubmitButton pendingText="Saving…">{menu ? "Save menu" : "Create menu"}</SubmitButton>
    </form>
  );
}
