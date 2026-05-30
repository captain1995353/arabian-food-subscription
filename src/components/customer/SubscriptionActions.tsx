"use client";

import { useTransition } from "react";
import { pauseSubscription, resumeSubscription, cancelSubscription } from "@/lib/actions/orders";
import type { SubscriptionStatus } from "@/lib/types";

export function SubscriptionActions({
  id,
  status,
}: {
  id: string;
  status: SubscriptionStatus;
}) {
  const [pending, start] = useTransition();

  if (status === "cancelled" || status === "expired") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {status === "active" && (
        <button
          disabled={pending}
          onClick={() => start(() => pauseSubscription(id))}
          className="btn btn-outline py-2 text-sm"
        >
          Pause
        </button>
      )}
      {status === "paused" && (
        <button
          disabled={pending}
          onClick={() => start(() => resumeSubscription(id))}
          className="btn btn-gold py-2 text-sm"
        >
          Resume
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Cancel this subscription? Pending orders will be cancelled too."))
            start(() => cancelSubscription(id));
        }}
        className="btn btn-danger py-2 text-sm"
      >
        Cancel
      </button>
    </div>
  );
}
