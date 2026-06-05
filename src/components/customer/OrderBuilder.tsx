"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Check, Copy } from "lucide-react";
import { placeOrder, type PlaceOrderInput } from "@/lib/actions/orders";
import { formatKRW, formatDate, addDays, cn } from "@/lib/utils";
import { Message } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import type { PaymentMethod, SubscriptionPlan, WeeklyMenuItem } from "@/lib/types";

interface Props {
  menu: { id: string; title: string; delivery_date: string };
  items: WeeklyMenuItem[];
  plans: SubscriptionPlan[];
  defaultPlanId?: string;
  prefill: { name: string; phone: string; city: string; address: string; zip: string; room: string };
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: "bank_transfer", label: "Bank Transfer", hint: "Transfer to our bank account, then we confirm." },
  { value: "kakaopay", label: "KakaoPay", hint: "Send via KakaoPay to @arabianfood." },
  { value: "cash", label: "Cash on Delivery", hint: "Pay the driver in cash on delivery." },
];

type WeekQty = Record<number, Record<string, number>>;

export function OrderBuilder({ menu, items, plans, defaultPlanId, prefill }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [planId, setPlanId] = useState<string>(defaultPlanId ?? plans[0]?.id ?? "");
  const [qty, setQty] = useState<WeekQty>({});
  const [activeWeek, setActiveWeek] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("bank_transfer");
  const [note, setNote] = useState("");
  const [delivery, setDelivery] = useState(prefill);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const plan = plans.find((p) => p.id === planId);
  const weeks = plan ? plan.weeks_count : 1;
  const itemCount = plan?.item_count ?? 0; // > 0 => fixed package
  const isPackage = itemCount > 0;

  const priceOf = (id: string) => Number(items.find((i) => i.food_item_id === id)?.price ?? 0);
  const weekMap = (w: number) => qty[w] ?? {};
  const setItemQty = (w: number, id: string, n: number) =>
    setQty((q) => ({ ...q, [w]: { ...(q[w] ?? {}), [id]: Math.max(0, n) } }));

  const weekQtyTotal = (w: number) => Object.values(weekMap(w)).reduce((a, b) => a + b, 0);
  const weekPriceSum = (w: number) =>
    Object.entries(weekMap(w)).reduce((s, [id, n]) => s + n * priceOf(id), 0);
  // Per-week charge: flat package price, or sum of item prices.
  const weekCharge = (w: number) => (isPackage ? Number(plan!.base_price) : weekPriceSum(w));

  const grandTotal = useMemo(() => {
    let t = 0;
    for (let w = 0; w < weeks; w++) t += weekCharge(w);
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty, weeks, planId]);

  const maxOf = (id: string) => Number(items.find((i) => i.food_item_id === id)?.food_item?.max_per_week ?? 0);
  const isRequired = (id: string) =>
    isPackage && !!items.find((i) => i.food_item_id === id)?.food_item?.package_required;

  // Auto-include required items (locked at qty 1) for every week of a package.
  useEffect(() => {
    if (!isPackage) return;
    setQty((q) => {
      let changed = false;
      const next: WeekQty = { ...q };
      for (let w = 0; w < weeks; w++) {
        const wk = { ...(next[w] ?? {}) };
        for (const it of items) {
          if (it.food_item?.package_required && !(wk[it.food_item_id] > 0)) {
            wk[it.food_item_id] = 1;
            changed = true;
          }
        }
        next[w] = wk;
      }
      return changed ? next : q;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, isPackage, weeks]);

  const weekValid = (w: number) => (isPackage ? weekQtyTotal(w) === itemCount : weekQtyTotal(w) > 0);
  const allWeeksValid = Array.from({ length: weeks }, (_, w) => weekValid(w)).every(Boolean);

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
      Object.entries(weekMap(w))
        .filter(([, n]) => n > 0)
        .map(([foodItemId, quantity]) => ({ foodItemId, quantity }))
    );
    const payload: PlaceOrderInput = {
      weeklyMenuId: menu.id,
      planId,
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

      {/* STEP 1 — choose plan / package */}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((p) => {
            const pkg = p.item_count > 0;
            return (
              <button
                key={p.id}
                onClick={() => setPlanId(p.id)}
                className={cn("rounded-xl border p-5 text-left transition", planId === p.id ? "border-gold bg-gold/10 ring-1 ring-gold/30" : "border-teal/20 hover:border-gold/50")}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{p.name}</span>
                  {pkg ? <Badge>Package</Badge> : <span className="text-xs text-ink-muted capitalize">{p.plan_type}</span>}
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-gold">
                  {pkg ? formatKRW(p.base_price) : "Pay per dish"}
                  {pkg && <span className="text-sm text-ink-muted"> / week</span>}
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  {pkg ? `Pick exactly ${p.item_count} dishes each week · ${p.weeks_count} ${p.weeks_count === 1 ? "delivery" : "weekly deliveries"}.` : p.description}
                </p>
                {pkg && p.weeks_count > 1 && (
                  <p className="mt-1 text-xs text-ink-muted">Month total: {formatKRW(p.base_price * p.weeks_count)}</p>
                )}
              </button>
            );
          })}
          {plans.length === 0 && <p className="text-ink-muted">No plans available right now.</p>}
        </div>
      )}

      {/* STEP 2 — select food */}
      {step === 2 && (
        <div className="space-y-4">
          {isPackage && (
            <Message type="info">
              This is a fixed package: pick <strong>exactly {itemCount} dishes</strong>{weeks > 1 ? " for each week" : ""} for {formatKRW(plan!.base_price)}/week.
            </Message>
          )}

          {weeks > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: weeks }, (_, w) => (
                <button key={w} onClick={() => setActiveWeek(w)}
                  className={cn("rounded-full border px-4 py-1.5 text-sm transition", activeWeek === w ? "border-gold bg-gold text-bg" : "border-teal/25 text-ink-muted hover:border-gold hover:text-gold")}>
                  Week {w + 1}
                  <span className={cn("ml-2 text-xs", weekValid(w) ? "opacity-90" : "text-spice")}>
                    {isPackage ? `${weekQtyTotal(w)}/${itemCount}` : `${weekQtyTotal(w)}`}
                  </span>
                </button>
              ))}
              <button onClick={copyWeekToAll} className="ml-auto inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
                <Copy size={14} /> Copy Week {activeWeek + 1} to all
              </button>
            </div>
          )}

          <p className="text-sm text-ink-muted">
            {weeks > 1 && <>Week {activeWeek + 1} · delivers {formatDate(addDays(new Date(menu.delivery_date), activeWeek * 7))} · </>}
            {isPackage ? (
              <span className={weekValid(activeWeek) ? "text-teal-light" : "text-gold"}>
                {weekQtyTotal(activeWeek)} of {itemCount} selected
              </span>
            ) : (
              <>{weekQtyTotal(activeWeek)} selected · {formatKRW(weekPriceSum(activeWeek))}</>
            )}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => {
              const f = it.food_item!;
              const id = it.food_item_id;
              const count = weekMap(activeWeek)[id] ?? 0;
              const sold = it.available_quantity <= 0;
              const max = maxOf(id);
              const required = isRequired(id);
              const weekFull = isPackage && weekQtyTotal(activeWeek) >= itemCount;
              const atItemCap = max > 0 && count >= max;
              const canInc = !weekFull && !atItemCap;
              const canDec = required ? count > 1 : count > 0; // required locked at min 1
              return (
                <div key={it.id} className="card flex flex-col overflow-hidden p-0">
                  <div className="relative h-36">
                    {f.image_url ? <Image src={f.image_url} alt={f.name} fill className="object-cover" /> : <div className="h-full bg-bg-surface" />}
                    <div className="absolute left-2 top-2 flex gap-1.5">
                      {f.is_halal && <Badge className="bg-teal text-white">Halal</Badge>}
                      {required && <span className="badge border-gold/40 bg-gold text-bg">Always included</span>}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex justify-between gap-2">
                      <h3 className="text-sm font-semibold">{f.name}</h3>
                      {/* Packages are a flat price, so per-item prices are hidden. */}
                      {!isPackage && <span className="font-display text-sm font-bold text-gold">{formatKRW(it.price)}</span>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{f.description}</p>
                    {max > 0 && <p className="mt-1 text-xs text-ink-muted">Max {max} per week</p>}
                    <div className="mt-3 flex items-center justify-between">
                      {sold ? (
                        <span className="text-xs text-spice">Sold out</span>
                      ) : count === 0 ? (
                        <button
                          disabled={!canInc}
                          onClick={() => setItemQty(activeWeek, id, 1)}
                          className={cn("btn btn-outline w-full py-1.5 text-xs", !canInc && "opacity-40")}
                        >
                          {weekFull ? `Limit ${itemCount}` : "Add"}
                        </button>
                      ) : (
                        <div className="flex w-full items-center justify-between rounded-full border border-gold/40 px-1">
                          <button disabled={!canDec} onClick={() => setItemQty(activeWeek, id, count - 1)} className="p-1.5 text-gold disabled:opacity-30"><Minus size={14} /></button>
                          <span className="text-sm font-semibold">{count}{required && <span className="ml-1 text-[10px] text-ink-muted">locked</span>}</span>
                          <button disabled={!canInc} onClick={() => setItemQty(activeWeek, id, count + 1)} className="p-1.5 text-gold disabled:opacity-30"><Plus size={14} /></button>
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
            <p className="mt-1 text-sm text-ink-muted">
              {plan?.name} · {weeks} {weeks === 1 ? "delivery" : "deliveries"}{isPackage ? ` · ${itemCount} items/week` : ""}
            </p>
            <div className="mt-3 space-y-2">
              {Array.from({ length: weeks }, (_, w) => (
                <div key={w} className="flex justify-between text-sm">
                  <span className="text-ink-secondary">
                    Week {w + 1} · {formatDate(addDays(new Date(menu.delivery_date), w * 7))}
                    <span className="text-ink-muted"> ({weekQtyTotal(w)} item{weekQtyTotal(w) === 1 ? "" : "s"})</span>
                  </span>
                  <span>{formatKRW(weekCharge(w))}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-teal/15 pt-3 text-base font-bold">
              <span>Total</span><span className="text-gold">{formatKRW(grandTotal)}</span>
            </div>
            <Message type="info">Payment is confirmed manually by our team after you order.</Message>
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
          {step === 1 && <button onClick={() => setStep(2)} disabled={!plan} className="btn btn-gold py-2">Continue</button>}
          {step === 2 && (
            <button onClick={() => setStep(3)} disabled={!allWeeksValid} className="btn btn-gold py-2">
              {allWeeksValid ? "Continue" : isPackage ? `Pick ${itemCount} per week` : "Pick food for every week"}
            </button>
          )}
          {step === 3 && (
            <button onClick={submit} disabled={pending || !allWeeksValid} className="btn btn-gold py-2">
              {pending ? "Placing order…" : "Place order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
