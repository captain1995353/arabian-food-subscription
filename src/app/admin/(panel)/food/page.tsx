import { createClient } from "@/lib/supabase/server";
import { FoodManager } from "@/components/admin/FoodManager";
import type { FoodItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminFoodPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("food_items")
    .select("*")
    .order("created_at", { ascending: false });
  return <FoodManager items={(data as FoodItem[]) ?? []} />;
}
