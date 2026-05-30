"use client";

import { useTransition } from "react";
import { markOrderPaid } from "@/lib/actions/admin";
import type { PaymentMethod } from "@/lib/types";

export function MarkPaidButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        const method = (prompt("Payment method? (bank_transfer / kakaopay / cash)", "bank_transfer") || "bank_transfer") as PaymentMethod;
        const note = prompt("Transaction note (optional)") || undefined;
        start(() => markOrderPaid(orderId, method, note));
      }}
      className="btn btn-gold py-1.5 text-xs"
    >
      {pending ? "…" : "Mark paid"}
    </button>
  );
}
