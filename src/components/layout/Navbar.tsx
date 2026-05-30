"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Weekly Menu" },
  { href: "/plans", label: "Plans" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-teal/15 bg-bg/90 backdrop-blur-xl">
      <nav className="container-x flex h-16 items-center justify-between">
        <Logo />

        <ul className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-sm font-medium text-ink-secondary transition hover:text-gold"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn btn-gold py-2">
              My Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-ink-secondary hover:text-gold">
                Login
              </Link>
              <Link href="/register" className="btn btn-gold py-2">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="text-gold md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={cn("md:hidden", open ? "block" : "hidden")}>
        <ul className="container-x flex flex-col gap-1 pb-4">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-ink-secondary hover:bg-bg-card hover:text-gold"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="mt-2 flex gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn btn-gold flex-1" onClick={() => setOpen(false)}>
                My Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-outline flex-1" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="btn btn-gold flex-1" onClick={() => setOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </li>
        </ul>
      </div>
    </header>
  );
}
