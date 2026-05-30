import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names safely (clsx + tailwind-merge). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Korean Won, e.g. 12000 -> "₩12,000". */
export function formatKRW(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return "₩" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** Format an ISO date string as e.g. "Jun 2, 2026". */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format an ISO datetime string as e.g. "Jun 2, 2026, 8:00 PM". */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Human-friendly label for an enum-style value: "out_for_delivery" -> "Out For Delivery". */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Tailwind color classes for an order/payment/delivery status badge. */
export function statusColor(status: string): string {
  switch (status) {
    case "paid":
    case "delivered":
    case "active":
    case "confirmed":
      return "bg-teal/20 text-teal-light border-teal/40";
    case "pending":
    case "unpaid":
    case "scheduled":
    case "draft":
      return "bg-gold/15 text-gold border-gold/30";
    case "preparing":
    case "out_for_delivery":
    case "partial":
    case "published":
      return "bg-saffron/15 text-saffron border-saffron/30";
    case "cancelled":
    case "failed":
    case "expired":
      return "bg-spice/15 text-spice border-spice/40";
    case "paused":
    case "closed":
      return "bg-ink-muted/15 text-ink-muted border-ink-muted/30";
    default:
      return "bg-ink-muted/15 text-ink-secondary border-ink-muted/30";
  }
}

const SPICE_LABELS = ["Not spicy", "Mild", "Medium", "Hot", "Very hot", "Extreme"];
export function spiceLabel(level: number): string {
  return SPICE_LABELS[Math.max(0, Math.min(5, level))];
}

/** Add days to a date and return ISO date (yyyy-mm-dd). */
export function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
