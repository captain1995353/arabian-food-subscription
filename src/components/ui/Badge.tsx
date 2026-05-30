import { cn, humanize, statusColor } from "@/lib/utils";

/** Coloured status pill for orders, payments, deliveries, subscriptions. */
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("badge", statusColor(status))}>{humanize(status)}</span>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("badge border-teal/30 bg-teal/10 text-teal-light", className)}>
      {children}
    </span>
  );
}
