"use client";

import { useTransition } from "react";
import { updateOrderStatus, markOrderPaid } from "@/lib/actions/admin";
import type { OrderStatus, PaymentMethod } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export function OrderControls({
  orderId,
  status,
  paid,
}: {
  orderId: string;
  status: OrderStatus;
  paid: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(e) => start(() => updateOrderStatus(orderId, e.target.value as OrderStatus))}
        className="w-auto py-1.5 text-xs"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
        ))}
      </select>
      {!paid && (
        <button
          disabled={pending}
          onClick={() => {
            const method = (prompt("Payment method? (bank_transfer / kakaopay / cash)", "bank_transfer") || "bank_transfer") as PaymentMethod;
            start(() => markOrderPaid(orderId, method));
          }}
          className="btn btn-gold py-1.5 text-xs"
        >
          Mark paid
        </button>
      )}
    </div>
  );
}
