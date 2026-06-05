import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OrderBuilder } from "@/components/customer/OrderBuilder";
import { formatDate } from "@/lib/utils";
import type { SubscriptionPlan, WeeklyMenu, WeeklyMenuItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SelectFoodPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { profile, customer } = await requireCustomer();
  const { plan } = await searchParams;

  const supabase = await createClient();
  const { data: menu } = await supabase
    .from("weekly_menus")
    .select("*")
    .eq("status", "published")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: planRows } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("plan_type")
    .order("item_count");
  const plans = (planRows as SubscriptionPlan[]) ?? [];
  // Preselect by ?plan=weekly|monthly if present (first matching plan).
  const defaultPlanId = plan ? plans.find((p) => p.plan_type === plan)?.id : undefined;

  let items: WeeklyMenuItem[] = [];
  if (menu) {
    const { data } = await supabase
      .from("weekly_menu_items")
      .select("*, food_item:food_items(*)")
      .eq("weekly_menu_id", (menu as WeeklyMenu).id)
      .order("sort_order");
    items = (data as WeeklyMenuItem[]) ?? [];
  }

  if (!menu || items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Select food</h1>
        <div className="card mt-6 text-center">
          <p className="text-ink-secondary">
            No weekly menu is open for orders right now. Please check back soon.
          </p>
          <Link href="/dashboard" className="btn btn-outline mt-4">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{(menu as WeeklyMenu).title}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        First delivery {formatDate((menu as WeeklyMenu).delivery_date)} · pick your
        dishes, choose a plan, and check out.
      </p>

      <div className="mt-6">
        <OrderBuilder
          menu={{
            id: (menu as WeeklyMenu).id,
            title: (menu as WeeklyMenu).title,
            delivery_date: (menu as WeeklyMenu).delivery_date,
          }}
          items={items}
          plans={plans}
          defaultPlanId={defaultPlanId}
          prefill={{
            name: profile.full_name,
            phone: profile.phone ?? "",
            city: customer?.city ?? "",
            address: customer?.address ?? "",
            zip: customer?.zip_code ?? "",
            room: customer?.room_building ?? "",
          }}
        />
      </div>
    </div>
  );
}
