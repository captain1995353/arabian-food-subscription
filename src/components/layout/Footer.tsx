import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-teal/15 bg-bg-secondary">
      <div className="container-x grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
            Fresh halal home-style Deshi meals delivered weekly to foreigners
            living across South Korea. Subscribe weekly or monthly — we cook,
            we deliver, you enjoy.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">Explore</h4>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li><Link href="/menu" className="hover:text-gold">Weekly Menu</Link></li>
            <li><Link href="/plans" className="hover:text-gold">Subscription Plans</Link></li>
            <li><Link href="/about" className="hover:text-gold">About Arabiana</Link></li>
            <li><Link href="/contact" className="hover:text-gold">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">Account</h4>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li><Link href="/register" className="hover:text-gold">Create Account</Link></li>
            <li><Link href="/login" className="hover:text-gold">Login</Link></li>
            <li><Link href="/dashboard" className="hover:text-gold">My Dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-teal/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-4 text-xs text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Arabiana Food Subscription. All rights reserved.</p>
          <p>Halal • Fresh • Delivered weekly across Korea</p>
        </div>
      </div>
    </footer>
  );
}
