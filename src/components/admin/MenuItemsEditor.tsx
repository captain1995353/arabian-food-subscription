"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Trash2, Plus } from "lucide-react";
import { addMenuItem, removeMenuItem } from "@/lib/actions/admin";
import { formatKRW } from "@/lib/utils";
import type { FoodItem, WeeklyMenuItem } from "@/lib/types";

export function MenuItemsEditor({
  menuId,
  items,
  allFoods,
}: {
  menuId: string;
  items: WeeklyMenuItem[];
  allFoods: FoodItem[];
}) {
  const [selected, setSelected] = useState("");
  const [pending, start] = useTransition();

  const inMenu = new Set(items.map((i) => i.food_item_id));
  const addable = allFoods.filter((f) => !inMenu.has(f.id));

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold">Add a dish to this menu</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="max-w-sm">
            <option value="">Select a food item…</option>
            {addable.map((f) => (
              <option key={f.id} value={f.id}>{f.name} — {formatKRW(f.price)}</option>
            ))}
          </select>
          <button
            disabled={!selected || pending}
            onClick={() => { if (selected) start(() => addMenuItem(menuId, selected)); setSelected(""); }}
            className="btn btn-gold py-2"
          >
            <Plus size={16} /> Add to menu
          </button>
        </div>
        {addable.length === 0 && <p className="mt-2 text-sm text-ink-muted">All active food items are already on this menu.</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.id} className="card flex items-center gap-3 p-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-md bg-bg-surface">
              {it.food_item?.image_url && <Image src={it.food_item.image_url} alt="" fill className="object-cover" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{it.food_item?.name}</p>
              <p className="text-xs text-ink-muted">{formatKRW(it.price)} · stock {it.available_quantity}</p>
            </div>
            <button
              disabled={pending}
              onClick={() => start(() => removeMenuItem(it.id, menuId))}
              className="text-ink-muted hover:text-spice"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-ink-muted">No dishes on this menu yet.</p>}
      </div>
    </div>
  );
}
