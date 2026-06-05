import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Soup, CalendarCheck, Truck, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import type { WeeklyMenuItem } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();

  // Pull a few items from the current published weekly menu as a preview.
  const { data: menu } = await supabase
    .from("weekly_menus")
    .select("id, title, delivery_date")
    .eq("status", "published")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let preview: WeeklyMenuItem[] = [];
  if (menu) {
    const { data } = await supabase
      .from("weekly_menu_items")
      .select("*, food_item:food_items(*)")
      .eq("weekly_menu_id", menu.id)
      .order("sort_order")
      .limit(4);
    preview = (data as WeeklyMenuItem[]) ?? [];
  }

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <Image
          src="/images/hero-spread.png"
          alt="Deshi home-style food spread"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/85 to-bg" />
        <div className="container-x relative py-24 text-center md:py-32">
          <Badge className="mx-auto mb-5">Halal • Weekly delivery • Made for foreigners in Korea</Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Home-style <span className="text-gradient-gold">Deshi food</span>,
            <br /> delivered to your door every week
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-secondary">
            Living in South Korea and missing real halal home cooking? Subscribe
            weekly or monthly and we deliver fresh, home-style Deshi meals —
            no shopping, no cooking, no stress.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn btn-gold">
              Start your subscription <ChevronRight size={18} />
            </Link>
            <Link href="/menu" className="btn btn-outline">
              See this week&apos;s menu
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-x py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">How it works</p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Four simple steps</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarCheck, title: "Create account", desc: "Register with your delivery address and preferences in Korea." },
            { icon: Soup, title: "Pick your meals", desc: "Choose dishes from the published weekly menu." },
            { icon: ShieldCheck, title: "Choose a plan", desc: "Weekly to try, or monthly for the best value." },
            { icon: Truck, title: "We deliver", desc: "Fresh halal food arrives at your door every week." },
          ].map((s, i) => (
            <div key={s.title} className="card text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-warm text-white">
                <s.icon size={22} />
              </div>
              <div className="mt-3 text-xs font-semibold text-gold">STEP {i + 1}</div>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED MENU */}
      {preview.length > 0 && (
        <section className="bg-bg-secondary py-20">
          <div className="container-x">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-gold">On the menu</p>
                <h2 className="mt-2 text-3xl font-bold md:text-4xl">{menu?.title}</h2>
              </div>
              <Link href="/menu" className="hidden text-sm font-semibold text-gold hover:underline sm:block">
                View full menu →
              </Link>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {preview.map((item) => (
                <div key={item.id} className="card overflow-hidden p-0">
                  <div className="relative h-40">
                    {item.food_item?.image_url ? (
                      <Image src={item.food_item.image_url} alt={item.food_item.name} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full bg-bg-surface" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{item.food_item?.name}</h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-ink-muted">{item.food_item?.category}</span>
                      {item.food_item?.is_halal && <Badge>Halal</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PLANS CTA */}
      <section className="container-x py-20">
        <div className="card grid items-center gap-8 bg-gradient-teal p-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-white">Weekly or Monthly — your choice</h2>
            <p className="mt-4 text-white/85">
              Weekly plan: pay for one week, delivered once. Monthly plan: pay once
              for the month and get fresh food delivered every week. Cancel or
              pause any time.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/plans" className="btn btn-gold">Compare plans</Link>
              <Link href="/register" className="btn btn-outline border-white/60 text-white hover:bg-white/10">
                Sign up free
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-bg/40 p-5 text-center">
              <div className="text-sm text-white/70">Weekly</div>
              <div className="mt-1 font-display text-2xl font-bold text-gold">1 delivery</div>
              <div className="text-xs text-white/60">per week</div>
            </div>
            <div className="rounded-xl bg-bg/40 p-5 text-center">
              <div className="text-sm text-white/70">Monthly</div>
              <div className="mt-1 font-display text-2xl font-bold text-gold">4 deliveries</div>
              <div className="text-xs text-white/60">best value</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
