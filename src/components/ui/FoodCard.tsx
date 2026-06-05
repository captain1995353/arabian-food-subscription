import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { SpiceLevel } from "@/components/ui/SpiceLevel";
import type { FoodItem } from "@/lib/types";

/**
 * Presentational food card. `price` and `stock` can be overridden (used by
 * weekly menus where the price is a per-week snapshot). `footer` lets callers
 * inject an add-to-cart control on the food-selection page.
 */
export function FoodCard({
  food,
  price,
  stock,
  footer,
}: {
  food: FoodItem;
  price?: number;
  stock?: number;
  footer?: React.ReactNode;
}) {
  const shownStock = stock ?? food.available_quantity;
  void price; // price intentionally not displayed (fixed-package pricing)
  return (
    <div className="card flex flex-col overflow-hidden p-0">
      <div className="relative h-44">
        {food.image_url ? (
          <Image src={food.image_url} alt={food.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-bg-surface text-ink-muted">
            No image
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {food.is_halal && <Badge className="bg-teal text-white">Halal</Badge>}
          {shownStock <= 0 && (
            <span className="badge border-spice/40 bg-spice/80 text-white">Sold out</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{food.name}</h3>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{food.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-ink-muted">{food.category}</span>
          {food.spicy_level > 0 && <SpiceLevel level={food.spicy_level} />}
        </div>
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}
