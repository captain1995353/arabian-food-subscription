import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { OfflineForm } from "@/components/customer/OfflineForm";
import type { WeeklyMenu, WeeklyMenuItem } from "@/lib/types";

export const metadata = { title: "Weekly Order Form | Arabian Food" };
export const dynamic = "force-dynamic";

export default async function OfflinePage() {
  const supabase = await createClient();

  const { data: menu } = await supabase
    .from("weekly_menus")
    .select("*")
    .eq("status", "published")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

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
    <div className="min-h-screen">
      <header className="border-b border-teal/15 bg-bg-secondary">
        <div className="container-x flex h-16 items-center justify-between">
          <Logo />
          <span className="text-sm text-ink-muted">Weekly Order Form</span>
        </div>
      </header>

      <main className="container-x max-w-3xl py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Weekly Order Form</h1>
          <p className="mt-2 text-ink-secondary">
            Fill in your details and choose your 6 dishes for this week. No account needed.
          </p>
        </div>

        {!menu || items.length === 0 ? (
          <div className="card mt-8 text-center">
            <p className="text-ink-secondary">No menu is open for orders right now. Please check back soon.</p>
            <Link href="/" className="btn btn-outline mt-4">Back to home</Link>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-xl border border-gold/30 bg-bg-card p-4 text-center text-sm text-ink-secondary">
              <strong className="text-gold">{(menu as WeeklyMenu).title}</strong> · delivery {formatDate((menu as WeeklyMenu).delivery_date)}
            </div>
            <div className="mt-6">
              <OfflineForm menuId={(menu as WeeklyMenu).id} items={items} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
