import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MenuItemsEditor } from "@/components/admin/MenuItemsEditor";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { FoodItem, WeeklyMenu, WeeklyMenuItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MenuDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: menu } = await supabase.from("weekly_menus").select("*").eq("id", id).maybeSingle();
  if (!menu) notFound();

  const [{ data: items }, { data: foods }] = await Promise.all([
    supabase.from("weekly_menu_items").select("*, food_item:food_items(*)").eq("weekly_menu_id", id).order("sort_order"),
    supabase.from("food_items").select("*").eq("is_active", true).order("name"),
  ]);

  const m = menu as WeeklyMenu;

  return (
    <div className="space-y-6">
      <Link href="/admin/menus" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-gold">
        <ArrowLeft size={16} /> Back to menus
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{m.title}</h1>
        <StatusBadge status={m.status} />
      </div>
      <p className="text-sm text-ink-muted">Delivery {formatDate(m.delivery_date)}</p>

      <MenuItemsEditor
        menuId={id}
        items={(items as WeeklyMenuItem[]) ?? []}
        allFoods={(foods as FoodItem[]) ?? []}
      />
    </div>
  );
}
