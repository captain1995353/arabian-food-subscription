"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Check, Copy } from "lucide-react";
import { placeOrder, type PlaceOrderInput } from "@/lib/actions/orders";
import { formatKRW, formatDate, addDays, cn } from "@/lib/utils";
import { Message } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import type { PaymentMethod, PlanType, WeeklyMenuItem } from "@/lib/types";

interface Props {
  menu: { id: string; title: string; delivery_date: string };
  items: WeeklyMenuItem[];
  defaultPlan: PlanType;
  prefill: {
    name: string;
    phone: string;
    city: string;
    address: string;
    zip: string;
    room: string;
  };
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: "bank_transfer", label: "Bank Transfer", hint: "Transfer to our bank account, then we confirm." },
  { value: "kakaopay", label: "KakaoPay", hint: "Send via KakaoPay to @arabianfood." },
  { value: "cash", label: "Cash on Delivery", hint: "Pay the driver in cash on delivery." },
];

// qty state: { [weekIndex]: { [foodItemId]: count } }
type WeekQty = Record<number, Record<string, number>>;

export function OrderBuilder({ menu, items, defaultPlan, prefill }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [planType, setPlanType] = useState<PlanType>(defaultPlan);
  const [qty, setQty] = useState<WeekQty>({});
  const [activeWeek, setActiveWeek] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("bank_transfer");
  const [note, setNote] = useState("");
  const [delivery, setDelivery] = useState(prefill);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const weeks = planType === "monthly" ? 4 : 1;

  const priceOf = (foodId: string) =>
    Number(items.find((i) => i.food_item_id === foodId)?.price ?? 0);

  const weekCount = (w: number) => qty[w] ?? {};
  const setItemQty = (w: number, id: string, n: number) =>
    setQty((q) => ({ ...q, [w]: { ...(q[w] ?? {}), [id]: Math.max(0, n) } }));

  const weekTotal = (w: number) =>
    Object.entries(weekCount(w)).reduce((s, [id, n]) => s + n * priceOf(id), 0);
  const weekItemCount = (w: number) =>
    Object.values(weekCount(w)).reduce((a, b) => a + b, 0);

  const grandTotal = useMemo(() => {
    let t = 0;
    for (let w = 0; w < weeks; w++) t += weekTotal(w);
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty, weeks]);

  const allWeeksHaveItems = Array.from({ length: weeks }, (_, w) => weekItemCount(w) > 0).every(Boolean);

  // Copy active week's selection to every week (handy for monthly).
  function copyWeekToAll() {
    setQty((q) => {
      const src = { ...(q[activeWeek] ?? {}) };
      const next: WeekQty = { ...q };
      for (let w = 0; w < weeks; w++) next[w] = { ...src };
      return next;
    });
  }

  function submit() {
    setError("");
    const weeklySelections = Array.from({ length: weeks }, (_, w) =>
      Object.entries(weekCount(w))
        .filter(([, n]) => n > 0)
        .map(([foodItemId, quantity]) => ({ foodItemId, quantity }))
    );
    const payload: PlaceOrderInput = {
      weeklyMenuId: menu.id,
      planType,
      weeklySelections,
      paymentMethod: payment,
      specialNote: note,
      delivery,
    };
    startTransition(async () => {
      const res = await placeOrder(payload);
      if (res.error) setError(res.error);
      else router.push("/dashboard/orders?success=1");
    });
  }

  return (
    <div className="space-y-6">
      {/* Steps header */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {["Choose plan", "Select food", "Delivery & payment"].map((label, i) => {
          const n = i + 1;
          return (
            <div key={label} className="flex items-center gap-2">
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", step >= n ? "bg-gold text-bg" : "bg-bg-card text-ink-muted")}>
                {step > n ? <Check size={14} /> : n}
              </span>
              <span className={cn(step >= n ? "text-ink" : "text-ink-muted")}>{label}</span>
              {n < 3 && <span className="mx-1 h-px w-6 bg-teal/20" />}
            </div>
          );
        })}
      </div>

      {/* STEP 1 — plan */}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(["weekly", "monthly"] as PlanType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlanType(p)}
              className={cn(
                "rounded-xl border p-5 text-left transition",
                planType === p ? "border-gold bg-gold/10 ring-1 ring-gold/30" : "border-teal/20 hover:border-gold/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold capitalize">{p} plan</span>
                {p === "monthly" && <Badge>Best value</Badge>}
              </div>
              <p className="mt-1 text-2xl font-display font-bold text-gold">
                {p === "weekly" ? "1 delivery" : "4 weekly deliveries"}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {p === "weekly"
                  ? "Pay for one week, delivered once. Pick your dishes."
                  : "Choose different dishes for each of the 4 weeks. Fresh delivery every week."}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* STEP 2 — select food (per-week for monthly) */}
      {step === 2 && (
        <div className="space-y-4">
          {weeks > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: weeks }, (_, w) => (
                <button
                  key={w}
                  onClick={() => setActiveWeek(w)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm transition",
                    activeWeek === w ? "border-gold bg-gold text-bg" : "border-teal/25 text-ink-muted hover:border-gold hover:text-gold"
                  )}
                >
                  Week {w + 1}
                  <span className="ml-2 text-xs opacity-80">
                    {weekItemCount(w)} · {formatKRW(weekTotal(w))}
                  </span>
                </button>
              ))}
              <button onClick={copyWeekToAll} className="ml-auto inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
                <Copy size={14} /> Copy Week {activeWeek + 1} to all weeks
              </button>
            </div>
          )}
          {weeks > 1 && (
            <p className="text-sm text-ink-muted">
              Choosing dishes for <span className="font-semibold text-ink">Week {activeWeek + 1}</span> ·
              delivers {formatDate(addDays(new Date(menu.delivery_date), activeWeek * 7))}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => {
              const f = it.food_item!;
              const count = weekCount(activeWeek)[it.food_item_id] ?? 0;
              const sold = it.available_quantity <= 0;
              return (
                <div key={it.id} className="card flex flex-col overflow-hidden p-0">
                  <div className="relative h-36">
                    {f.image_url ? <Image src={f.image_url} alt={f.name} fill className="object-cover" /> : <div className="h-full bg-bg-surface" />}
                    {f.is_halal && <Badge className="absolute left-2 top-2 bg-teal text-white">Halal</Badge>}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex justify-between gap-2">
                      <h3 className="text-sm font-semibold">{f.name}</h3>
                      <span className="font-display text-sm font-bold text-gold">{formatKRW(it.price)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{f.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      {sold ? (
                        <span className="text-xs text-spice">Sold out</span>
                      ) : count === 0 ? (
                        <button onClick={() => setItemQty(activeWeek, it.food_item_id, 1)} className="btn btn-outline w-full py-1.5 text-xs">Add</button>
                      ) : (
                        <div className="flex w-full items-center justify-between rounded-full border border-gold/40 px-1">
                          <button onClick={() => setItemQty(activeWeek, it.food_item_id, count - 1)} className="p-1.5 text-gold"><Minus size={14} /></button>
                          <span className="text-sm font-semibold">{count}</span>
                          <button onClick={() => setItemQty(activeWeek, it.food_item_id, count + 1)} className="p-1.5 text-gold"><Plus size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3 — delivery & payment */}
      {step === 3 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Delivery details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label>Name</label><input value={delivery.name} onChange={(e) => setDelivery({ ...delivery, name: e.target.value })} /></div>
              <div><label>Phone</label><input value={delivery.phone} onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })} /></div>
              <div><label>City</label><input value={delivery.city} onChange={(e) => setDelivery({ ...delivery, city: e.target.value })} /></div>
              <div><label>Zip code</label><input value={delivery.zip} onChange={(e) => setDelivery({ ...delivery, zip: e.target.value })} /></div>
            </div>
            <div><label>Address</label><input value={delivery.address} onChange={(e) => setDelivery({ ...delivery, address: e.target.value })} /></div>
            <div><label>Room / building</label><input value={delivery.room} onChange={(e) => setDelivery({ ...delivery, room: e.target.value })} /></div>
            <div><label>Special note / allergy</label><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></div>

            <h2 className="pt-2 text-lg font-semibold">Payment method</h2>
            {PAYMENT_METHODS.map((m) => (
              <button key={m.value} onClick={() => setPayment(m.value)}
                className={cn("w-full rounded-xl border p-3 text-left transition", payment === m.value ? "border-gold bg-gold/10" : "border-teal/20 hover:border-gold/50")}>
                <span className="font-semibold">{m.label}</span>
                <p className="mt-0.5 text-xs text-ink-muted">{m.hint}</p>
              </button>
            ))}
          </div>

          <div className="card h-fit">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <p className="mt-1 text-sm capitalize text-ink-muted">{planType} plan · {weeks} {weeks === 1 ? "delivery" : "deliveries"}</p>
            <div className="mt-3 space-y-2">
              {Array.from({ length: weeks }, (_, w) => (
                <div key={w} className="flex justify-between text-sm">
                  <span className="text-ink-secondary">
                    Week {w + 1} · {formatDate(addDays(new Date(menu.delivery_date), w * 7))}
                    <span className="text-ink-muted"> ({weekItemCount(w)} item{weekItemCount(w) === 1 ? "" : "s"})</span>
                  </span>
                  <span>{formatKRW(weekTotal(w))}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-teal/15 pt-3 text-base font-bold">
              <span>Total</span><span className="text-gold">{formatKRW(grandTotal)}</span>
            </div>
            <Message type="info">
              Payment is confirmed manually by our team. After ordering, send your payment and we&apos;ll mark it paid.
            </Message>
          </div>
        </div>
      )}

      {error && <Message type="error">{error}</Message>}

      {/* Action bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-xl border border-teal/15 bg-bg-secondary/95 p-4 backdrop-blur">
        <div className="text-sm">
          <span className="font-display font-bold text-gold">{formatKRW(grandTotal)}</span>
          <span className="text-ink-muted"> total · {weeks} {weeks === 1 ? "week" : "weeks"}</span>
        </div>
        <div className="flex gap-2">
          {step > 1 && <button onClick={() => setStep((s) => s - 1)} className="btn btn-outline py-2">Back</button>}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 2 && !allWeeksHaveItems}
              className="btn btn-gold py-2"
            >
              {step === 2 && !allWeeksHaveItems ? "Pick food for every week" : "Continue"}
            </button>
          ) : (
            <button onClick={submit} disabled={pending || !allWeeksHaveItems} className="btn btn-gold py-2">
              {pending ? "Placing order…" : "Place order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
