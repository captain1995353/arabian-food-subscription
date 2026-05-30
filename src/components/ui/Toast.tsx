"use client";

import { cn } from "@/lib/utils";

/** Lightweight inline message banner used in forms. */
export function Message({
  type = "info",
  children,
}: {
  type?: "info" | "error" | "success";
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        type === "error" && "border-spice/40 bg-spice/10 text-spice",
        type === "success" && "border-teal/40 bg-teal/10 text-teal-light",
        type === "info" && "border-gold/30 bg-gold/10 text-gold"
      )}
    >
      {children}
    </div>
  );
}
