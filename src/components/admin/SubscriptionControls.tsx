"use client";

import { useTransition } from "react";
import { adminUpdateSubscription, extendSubscription } from "@/lib/actions/admin";
import type { SubscriptionStatus } from "@/lib/types";

const STATUSES: SubscriptionStatus[] = ["active", "paused", "cancelled", "expired"];

export function SubscriptionControls({
  id,
  status,
}: {
  id: string;
  status: SubscriptionStatus;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(e) => start(() => adminUpdateSubscription(id, e.target.value as SubscriptionStatus))}
        className="w-auto py-1.5 text-xs"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button
        disabled={pending}
        onClick={() => {
          const w = Number(prompt("Extend by how many weeks?", "1"));
          if (w > 0) start(() => extendSubscription(id, w));
        }}
        className="btn btn-outline py-1.5 text-xs"
      >
        Extend
      </button>
    </div>
  );
}
