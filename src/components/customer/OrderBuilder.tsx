"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Check } from "lucide-react";
import { placeOrder, type PlaceOrderInput } from "@/lib/actions/orders";
import { formatKRW, formatDate, cn } from "@/lib/utils";
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

export function OrderBuilder({ menu, items, defaultPlan, prefill }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [planType, setPlanType] = useState<PlanType>(defaultPlan);
  const [payment, setPayment] = useState<PaymentMethod>("bank_transfer");
  const [note, setNote] = useState("");
  const [delivery, setDelivery] = useState(prefill);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const setItemQty = (id: string, n: number) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, n) }));

  const perWeek = useMemo(
    () =>
      items.reduce((sum, it) => sum + (qty[it.food_item_id] ?? 0) * Number(it.price), 0),
    [items, qty]
  );
  const weeks = planType === "monthly" ? 4 : 1;
  const total = perWeek * weeks;
  const selectedCount = Object.values(qty).reduce((a, b) => a + b, 0);

  function submit() {
    setError("");
    const input: PlaceOrderInput = {
      weeklyMenuId: menu.id,
      planType,
      paymentMethod: payment,
      specialNote: note,
      delivery,
      items: items
        .filter((it) => (qty[it.food_item_id] ?? 0) > 0)
        .map((it) => ({ foodItemId: it.food_item_id, quantity: qty[it.food_item_id] })),
    };
    startTransition(async () => {
      const res = await placeOrder(input);
      if (res.error) setError(res.error);
      else router.push("/dashboard/orders?success=1");
    });
  }

  return (
    <div className="space-y-6">
      {/* Steps header */}
      <div className="flex items-center gap-2 text-sm">
        {["Select food", "Plan & delivery", "Payment"].map((label, i) => {
          const n = i + 1;
          return (
            <div key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  step >= n ? "bg-gold text-bg" : "bg-bg-card text-ink-muted"
                )}
              >
                {step > n ? <Check size={14} /> : n}
              </span>
              <span className={cn(step >= n ? "text-ink" : "text-ink-muted")}>{label}</span>
              {n < 3 && <span className="mx-1 h-px w-6 bg-teal/20" />}
            </div>
          );
        })}
      </div>

      {/* STEP 1 — select */}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const f = it.food_item!;
            const count = qty[it.food_item_id] ?? 0;
            const sold = it.available_quantity <= 0;
            return (
              <div key={it.id} className="card flex flex-col overflow-hidden p-0">
                <div className="relative h-36">
                  {f.image_url ? (
                    <Image src={f.image_url} alt={f.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full bg-bg-surface" />
                  )}
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
                      <button onClick={() => setItemQty(it.food_item_id, 1)} className="btn btn-outline w-full py-1.5 text-xs">
                        Add
                      </button>
                    ) : (
                      <div className="flex w-full items-center justify-between rounded-full border border-gold/40 px-1">
                        <button onClick={() => setItemQty(it.food_item_id, count - 1)} className="p-1.5 text-gold"><Minus size={14} /></button>
                        <span className="text-sm font-semibold">{count}</span>
                        <button onClick={() => setItemQty(it.food_item_id, count + 1)} className="p-1.5 text-gold"><Plus size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STEP 2 — plan & delivery */}
      {step === 2 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Choose your plan</h2>
            {(["weekly", "monthly"] as PlanType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlanType(p)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition",
                  planType === p ? "border-gold bg-gold/10" : "border-teal/20 hover:border-gold/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize">{p} plan</span>
                  <span className="text-sm text-ink-muted">
                    {p === "weekly" ? "1 delivery" : "4 weekly deliveries"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {p === "weekly"
                    ? "Pay for one week, delivered once."
                    : "Pay once, fresh food delivered every week for a month."}
                </p>
              </button>
            ))}
          </div>

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
          </div>
        </div>
      )}

      {/* STEP 3 — payment */}
      {step === 3 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Payment method</h2>
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setPayment(m.value)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition",
                  payment === m.value ? "border-gold bg-gold/10" : "border-teal/20 hover:border-gold/50"
                )}
              >
                <span className="font-semibold">{m.label}</span>
                <p className="mt-1 text-xs text-ink-muted">{m.hint}</p>
              </button>
            ))}
            <Message type="info">
              Payment is confirmed manually by our team. After ordering, send your
              payment and we&apos;ll mark it as paid — you can track status in your
              dashboard.
            </Message>
          </div>

          <div className="card h-fit">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Plan</dt><dd className="capitalize">{planType}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Deliveries</dt><dd>{weeks} {weeks === 1 ? "week" : "weeks"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">First delivery</dt><dd>{formatDate(menu.delivery_date)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Per week</dt><dd>{formatKRW(perWeek)}</dd></div>
              <div className="mt-2 flex justify-between border-t border-teal/15 pt-2 text-base font-bold">
                <dt>Total</dt><dd className="text-gold">{formatKRW(total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {error && <Message type="error">{error}</Message>}

      {/* Sticky action bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-xl border border-teal/15 bg-bg-secondary/95 p-4 backdrop-blur">
        <div className="text-sm">
          <span className="text-ink-muted">{selectedCount} item(s) · </span>
          <span className="font-display font-bold text-gold">{formatKRW(total)}</span>
          <span className="text-ink-muted"> total</span>
        </div>
        <div className="flex gap-2">
          {step > 1 && (
            <button onClick={() => setStep((s) => s - 1)} className="btn btn-outline py-2">Back</button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && selectedCount === 0}
              className="btn btn-gold py-2"
            >
              Continue
            </button>
          ) : (
            <button onClick={submit} disabled={pending || selectedCount === 0} className="btn btn-gold py-2">
              {pending ? "Placing order…" : "Place order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
