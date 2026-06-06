"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteOrder } from "@/lib/actions/orders";

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      {err && <span className="text-xs text-spice">{err}</span>}
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this order? This cannot be undone.")) return;
          setErr("");
          start(async () => {
            const res = await deleteOrder(orderId);
            if (res.error) setErr(res.error);
          });
        }}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-spice"
      >
        <Trash2 size={15} /> {pending ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
