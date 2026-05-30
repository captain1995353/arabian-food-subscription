import { createClient } from "@/lib/supabase/server";
import { MenuManager } from "@/components/admin/MenuManager";
import type { WeeklyMenu } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminMenusPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_menus")
    .select("*")
    .order("start_date", { ascending: false });
  return <MenuManager menus={(data as WeeklyMenu[]) ?? []} />;
}
