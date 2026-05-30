import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "About | Arabian Food Subscription" };

export default function AboutPage() {
  return (
    <div className="container-x py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">Our story</p>
        <h1 className="mt-2 text-4xl font-bold md:text-5xl">About Arabian</h1>
      </div>

      <div className="mt-12 grid items-center gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-teal/15">
          <Image src="/inside.jpeg" alt="Arabian kitchen" width={800} height={600} className="h-full w-full object-cover" />
        </div>
        <div className="space-y-4 text-ink-secondary">
          <p className="text-lg text-ink">
            <strong className="text-gold">Arabian</strong> started with a simple
            idea: foreigners living in South Korea deserve honest, home-style
            halal food without the hassle of shopping and cooking every day.
          </p>
          <p>
            Every week our chefs prepare fresh Arabian, Indian and Korean dishes —
            from fragrant Chicken Kabsa to crispy Korean fried chicken — all
            halal, all made with care. You pick what you want, choose a weekly or
            monthly plan, and we deliver to your door.
          </p>
          <p>
            We cook for students, workers and families across Korean cities who
            miss the taste of home. No contracts, no stress — pause or cancel any
            time.
          </p>
          <Link href="/register" className="btn btn-gold mt-2">Join Arabian today</Link>
        </div>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {[
          { t: "100% Halal", d: "Every dish is prepared halal — eat with confidence." },
          { t: "Made for foreigners", d: "Simple English ordering, built for the international community." },
          { t: "Weekly fresh delivery", d: "Cooked fresh and delivered to your address every week." },
        ].map((f) => (
          <div key={f.t} className="card">
            <h3 className="text-lg font-semibold text-gold">{f.t}</h3>
            <p className="mt-2 text-sm text-ink-muted">{f.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
