import { createClient } from "@/lib/supabase/server";
import { PackageManager } from "@/components/admin/PackageManager";
import type { SubscriptionPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("plan_type")
    .order("item_count");
  return <PackageManager plans={(data as SubscriptionPlan[]) ?? []} />;
}
