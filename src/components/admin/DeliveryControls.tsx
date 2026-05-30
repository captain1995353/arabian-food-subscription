"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateDeliveries, updateDeliveryStatus } from "@/lib/actions/admin";
import { Message } from "@/components/ui/Toast";
import type { DeliveryStatus } from "@/lib/types";

const STATUSES: DeliveryStatus[] = ["scheduled", "preparing", "out_for_delivery", "delivered", "failed"];

/** Date picker + button to build the delivery list for a given date. */
export function GenerateDeliveries({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const [date, setDate] = useState(defaultDate);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Build delivery list</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Pick a delivery date and generate delivery records from that day&apos;s orders.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label>Delivery date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await generateDeliveries(date);
              setMsg(res.error ?? "Delivery list generated.");
              router.push(`/admin/deliveries?date=${date}`);
            })
          }
          className="btn btn-gold py-2.5"
        >
          {pending ? "Working…" : "Generate"}
        </button>
        <a href={`/admin/deliveries?date=${date}`} className="btn btn-outline py-2.5">View date</a>
      </div>
      {msg && <div className="mt-3"><Message type="info">{msg}</Message></div>}
    </div>
  );
}

export function DeliveryStatusSelect({ id, status }: { id: string; status: DeliveryStatus }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => start(() => updateDeliveryStatus(id, e.target.value as DeliveryStatus))}
      className="w-auto py-1.5 text-xs"
    >
      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
    </select>
  );
}
