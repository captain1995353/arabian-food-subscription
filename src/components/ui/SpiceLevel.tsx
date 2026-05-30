import { cn, spiceLabel } from "@/lib/utils";

export function SpiceLevel({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-muted" title={spiceLabel(level)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full",
            i < level ? "bg-spice shadow-[0_0_6px_rgba(196,69,54,0.5)]" : "bg-teal/25"
          )}
        />
      ))}
      <span className="ml-1">{spiceLabel(level)}</span>
    </span>
  );
}
