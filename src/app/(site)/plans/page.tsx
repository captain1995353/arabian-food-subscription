import Link from "next/link";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";
import type { SubscriptionPlan } from "@/lib/types";

export const metadata = { title: "Subscription Plans | Arabian Food Subscription" };

export default async function PlansPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("weeks_count");
  const plans = (data as SubscriptionPlan[]) ?? [];

  const perks: Record<string, string[]> = {
    weekly: [
      "1 weekly delivery",
      "Choose your dishes each week",
      "Great way to try our Deshi food",
      "Pause or cancel any time",
    ],
    monthly: [
      "4 weekly deliveries",
      "Choose dishes for every week",
      "Best value per meal",
      "Priority delivery slots",
      "Pause or cancel any time",
    ],
  };

  return (
    <div className="container-x py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">Pricing</p>
        <h1 className="mt-2 text-4xl font-bold md:text-5xl">Choose your plan</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
          Pay only for the food you choose — the plan sets how many weekly
          deliveries you get. Your meal total is calculated when you check out.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
        {plans.map((plan) => {
          const featured = plan.plan_type === "monthly";
          return (
            <div
              key={plan.id}
              className={`card relative ${featured ? "border-gold/50 ring-1 ring-gold/30" : ""}`}
            >
              {featured && (
                <span className="badge absolute -top-3 left-1/2 -translate-x-1/2 border-gold/40 bg-gold text-bg">
                  Best value
                </span>
              )}
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="mt-1 text-sm text-ink-muted">{plan.description}</p>
              <div className="mt-4">
                <span className="font-display text-4xl font-bold text-gold">
                  {plan.weeks_count}
                </span>
                <span className="ml-2 text-ink-secondary">
                  weekly {plan.weeks_count === 1 ? "delivery" : "deliveries"}
                </span>
              </div>
              {plan.base_price > 0 && (
                <p className="mt-1 text-sm text-ink-muted">
                  Plan fee: {formatKRW(plan.base_price)}
                </p>
              )}
              <ul className="mt-5 space-y-2">
                {(perks[plan.plan_type] ?? []).map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink-secondary">
                    <Check size={16} className="mt-0.5 flex-shrink-0 text-teal-light" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href={`/register?plan=${plan.plan_type}`}
                className={`btn mt-6 w-full ${featured ? "btn-gold" : "btn-outline"}`}
              >
                Choose {plan.name}
              </Link>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <p className="mt-10 text-center text-ink-muted">
          Plans are being set up. Please check back soon.
        </p>
      )}
    </div>
  );
}
