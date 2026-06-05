"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Minus, Plus, Check } from "lucide-react";
import { saveOfflineSubscriber, type OfflineInput } from "@/lib/actions/offline";
import { Message } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { WeeklyMenuItem } from "@/lib/types";

const TARGET = 6; // weekly package size

export function OfflineForm({
  menuId,
  items,
}: {
  menuId: string;
  items: WeeklyMenuItem[];
}) {
  const [form, setForm] = useState({
    full_name: "", phone: "", passport_no: "", nationality: "", city: "",
    address: "", zip_code: "", room_building: "", special_note: "",
  });
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const maxOf = (id: string) => Number(items.find((i) => i.food_item_id === id)?.food_item?.max_per_week ?? 0);
  const total = Object.values(qty).reduce((a, b) => a + b, 0);

  function submit() {
    setError("");
    if (!form.full_name.trim() || !form.phone.trim()) { setError("Name and phone are required."); return; }
    if (total !== TARGET) { setError(`Please select exactly ${TARGET} items (you have ${total}).`); return; }
    const payload: OfflineInput = {
      ...form,
      weeklyMenuId: menuId,
      items: Object.entries(qty).filter(([, n]) => n > 0).map(([foodItemId, quantity]) => ({ foodItemId, quantity })),
    };
    start(async () => {
      const res = await saveOfflineSubscriber(payload);
      if (res.error) setError(res.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <div className="card text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white"><Check /></div>
        <h2 className="mt-4 text-xl font-bold">Thank you, {form.full_name.split(" ")[0]}!</h2>
        <p className="mt-2 text-ink-secondary">Your weekly order is saved. We&apos;ll be in touch about delivery.</p>
        <button onClick={() => { setDone(false); setQty({}); setForm({ ...form, special_note: "" }); }} className="btn btn-outline mt-5">Submit another</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">Your details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label>Full name *</label><input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required /></div>
          <div><label>Phone *</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} required /></div>
          <div><label>Passport number</label><input value={form.passport_no} onChange={(e) => set("passport_no", e.target.value)} /></div>
          <div><label>Nationality</label><input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label>City in Korea</label><input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
          <div><label>Zip code</label><input value={form.zip_code} onChange={(e) => set("zip_code", e.target.value)} /></div>
        </div>
        <div><label>Full delivery address</label><input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
        <div><label>Room / building</label><input value={form.room_building} onChange={(e) => set("room_building", e.target.value)} /></div>
        <div><label>Allergy / special note</label><textarea rows={2} value={form.special_note} onChange={(e) => set("special_note", e.target.value)} /></div>
      </div>

      {/* Items */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Choose your 6 items</h2>
          <span className={cn("font-semibold", total === TARGET ? "text-teal-light" : "text-gold")}>{total} / {TARGET}</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const f = it.food_item!;
            const id = it.food_item_id;
            const count = qty[id] ?? 0;
            const max = maxOf(id);
            const full = total >= TARGET;
            const atCap = max > 0 && count >= max;
            const canInc = !full && !atCap;
            return (
              <div key={it.id} className="card flex flex-col overflow-hidden p-0">
                <div className="relative h-32">
                  {f.image_url ? <Image src={f.image_url} alt={f.name} fill className="object-cover" /> : <div className="h-full bg-bg-surface" />}
                  {f.is_halal && <Badge className="absolute left-2 top-2 bg-teal text-white">Halal</Badge>}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="text-sm font-semibold">{f.name}</h3>
                  {max > 0 && <p className="mt-0.5 text-xs text-ink-muted">Max {max} per week</p>}
                  <div className="mt-auto pt-3">
                    {count === 0 ? (
                      <button disabled={!canInc} onClick={() => setQty((q) => ({ ...q, [id]: 1 }))}
                        className={cn("btn btn-outline w-full py-1.5 text-xs", !canInc && "opacity-40")}>
                        {full ? "Limit 6" : "Add"}
                      </button>
                    ) : (
                      <div className="flex w-full items-center justify-between rounded-full border border-gold/40 px-1">
                        <button onClick={() => setQty((q) => ({ ...q, [id]: count - 1 }))} className="p-1.5 text-gold"><Minus size={14} /></button>
                        <span className="text-sm font-semibold">{count}</span>
                        <button disabled={!canInc} onClick={() => setQty((q) => ({ ...q, [id]: count + 1 }))} className="p-1.5 text-gold disabled:opacity-30"><Plus size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && <Message type="error">{error}</Message>}

      <button onClick={submit} disabled={pending || total !== TARGET} className="btn btn-gold w-full py-3">
        {pending ? "Saving…" : total === TARGET ? "Submit weekly order" : `Pick ${TARGET - total} more`}
      </button>
    </div>
  );
}
