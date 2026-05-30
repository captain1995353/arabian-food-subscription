"use client";

import { useState } from "react";
import { FoodCard } from "@/components/ui/FoodCard";
import { cn } from "@/lib/utils";
import { FOOD_CATEGORIES, type WeeklyMenuItem } from "@/lib/types";

/** Read-only weekly menu browser with category filter tabs. */
export function MenuBrowser({ items }: { items: WeeklyMenuItem[] }) {
  const [filter, setFilter] = useState<string>("all");

  const present = FOOD_CATEGORIES.filter((c) =>
    items.some((i) => i.food_item?.category === c)
  );
  const shown =
    filter === "all"
      ? items
      : items.filter((i) => i.food_item?.category === filter);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {["all", ...present].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              filter === c
                ? "border-gold bg-gold text-bg"
                : "border-teal/25 text-ink-muted hover:border-gold hover:text-gold"
            )}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map(
          (item) =>
            item.food_item && (
              <FoodCard
                key={item.id}
                food={item.food_item}
                price={item.price}
                stock={item.available_quantity}
              />
            )
        )}
      </div>
    </div>
  );
}
