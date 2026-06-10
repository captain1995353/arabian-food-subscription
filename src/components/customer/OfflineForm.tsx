"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Minus, Plus, Check, Upload, Loader2, CheckCircle2, MapPin } from "lucide-react";
import { saveOfflineSubscriber, uploadOfflineReceipt, type OfflineInput } from "@/lib/actions/offline";
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
  const [amount, setAmount] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const maxOf = (id: string) => Number(items.find((i) => i.food_item_id === id)?.food_item?.max_per_week ?? 0);
  const total = Object.values(qty).reduce((a, b) => a + b, 0);

  // Browser geolocation -> reverse-geocode (free OpenStreetMap) -> fill address.
  function useMyLocation() {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("Location is not supported on this device. Please type your address.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Exact pin — accurate for delivery. Only the zip code is filled.
          setCoords({ lat: latitude, lng: longitude });
          try {
            const r = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`
            );
            const j = await r.json();
            const a = j.address ?? {};
            if (a.postcode) setForm((f) => ({ ...f, zip_code: a.postcode }));
          } catch {
            /* zip lookup is best-effort; the pin is what matters */
          }
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location. Allow location access or type your address.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function onReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    start(async () => {
      try {
        const res = await uploadOfflineReceipt(fd);
        setUploading(false);
        if (res.error) setError(res.error);
        else if (res.url) setReceiptUrl(res.url);
      } catch {
        setUploading(false);
        setError("Upload failed. Please try again.");
      }
    });
  }

  function submit() {
    setError("");
    if (!form.full_name.trim() || !form.phone.trim()) { setError("Name and phone are required."); return; }
    if (total !== TARGET) { setError(`Please select exactly ${TARGET} items (you have ${total}).`); return; }
    const mapLink = coords ? `https://map.kakao.com/link/map/Delivery,${coords.lat},${coords.lng}` : "";
    const payload: OfflineInput = {
      ...form,
      paymentAmount: Number(amount) || 0,
      receiptUrl,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      mapLink,
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
        <button onClick={() => { setDone(false); setQty({}); setAmount(""); setReceiptUrl(""); setCoords(null); setForm({ ...form, special_note: "" }); }} className="btn btn-outline mt-5">Submit another</button>
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
          <div><label>Zip code</label><input value={form.zip_code} onChange={(e) => set("zip_code", e.target.value)} placeholder="Auto-filled from location" /></div>
        </div>

        {/* Location pin */}
        <div className="rounded-lg border border-teal/15 bg-bg-surface p-3">
          <button type="button" onClick={useMyLocation} disabled={locating}
            className="btn btn-outline py-2 text-sm">
            {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
            {locating ? "Locating…" : "Use my current location"}
          </button>
          {coords ? (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-teal-light">
              <CheckCircle2 size={14} /> Location pinned for delivery.
              <a href={`https://map.kakao.com/link/map/Delivery,${coords.lat},${coords.lng}`} target="_blank" rel="noreferrer" className="text-gold underline">
                Open in KakaoMap
              </a>
            </p>
          ) : (
            <p className="mt-2 text-xs text-ink-muted">Tap to pin your exact location (allow location access). Best on your phone.</p>
          )}
        </div>

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

      {/* Payment */}
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Payment</h2>
        <p className="text-sm text-ink-muted">
          Pay by Toss Bank · <span className="text-gold">1002-6091-5319</span> (UDDIN AZHAR), then enter the amount and upload your receipt.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label>Payment amount (₩)</label>
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 57000" />
          </div>
          <div>
            <label>Payment receipt</label>
            <input ref={fileRef} type="file" onChange={onReceipt} className="hidden" />
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-outline py-2.5 text-sm">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Uploading…" : receiptUrl ? "Replace receipt" : "Upload receipt"}
              </button>
              {receiptUrl && (
                <a href={receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-teal-light">
                  <CheckCircle2 size={16} /> Uploaded
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <Message type="error">{error}</Message>}

      <button onClick={submit} disabled={pending || total !== TARGET} className="btn btn-gold w-full py-3">
        {pending ? "Saving…" : total === TARGET ? "Submit weekly order" : `Pick ${TARGET - total} more`}
      </button>
    </div>
  );
}
