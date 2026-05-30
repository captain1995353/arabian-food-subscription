import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils";
import { MenuBrowser } from "@/components/customer/MenuBrowser";
import { Badge } from "@/components/ui/Badge";
import type { WeeklyMenu, WeeklyMenuItem } from "@/lib/types";

export const metadata = { title: "Weekly Menu | Arabian Food Subscription" };
export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const supabase = await createClient();

  const { data: menu } = await supabase
    .from("weekly_menus")
    .select("*")
    .eq("status", "published")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let items: WeeklyMenuItem[] = [];
  if (menu) {
    const { data } = await supabase
      .from("weekly_menu_items")
      .select("*, food_item:food_items(*)")
      .eq("weekly_menu_id", (menu as WeeklyMenu).id)
      .order("sort_order");
    items = (data as WeeklyMenuItem[]) ?? [];
  }

  return (
    <div className="container-x py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">This week</p>
        <h1 className="mt-2 text-4xl font-bold md:text-5xl">
          {menu ? (menu as WeeklyMenu).title : "Weekly Menu"}
        </h1>

        {menu ? (
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-ink-secondary">
            <Badge>Delivery: {formatDate((menu as WeeklyMenu).delivery_date)}</Badge>
            <Badge>Order by: {formatDateTime((menu as WeeklyMenu).order_deadline)}</Badge>
          </div>
        ) : (
          <p className="mt-4 text-ink-muted">
            No menu is published right now. Please check back soon!
          </p>
        )}
      </div>

      {items.length > 0 && (
        <>
          <div className="mt-12">
            <MenuBrowser items={items} />
          </div>

          <div className="mt-14 rounded-2xl border border-gold/30 bg-bg-card p-8 text-center">
            <h2 className="text-2xl font-bold">Ready to order this week&apos;s food?</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-secondary">
              {user
                ? "Head to food selection to pick your dishes and check out."
                : "Create a free account to select your dishes and subscribe."}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              {user ? (
                <Link href="/select-food" className="btn btn-gold">Select food</Link>
              ) : (
                <>
                  <Link href="/register" className="btn btn-gold">Create account</Link>
                  <Link href="/login" className="btn btn-outline">Login</Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
