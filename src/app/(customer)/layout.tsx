import Link from "next/link";
import { LayoutDashboard, CalendarRange, ShoppingBag, UserCog, UtensilsCrossed } from "lucide-react";
import { requireCustomer } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { SidebarNav, type NavItem } from "@/components/layout/SidebarNav";
import { SignOutButton } from "@/components/layout/SignOutButton";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: <LayoutDashboard size={18} /> },
  { href: "/dashboard/subscription", label: "Subscription", icon: <CalendarRange size={18} /> },
  { href: "/dashboard/orders", label: "Orders", icon: <ShoppingBag size={18} /> },
  { href: "/dashboard/profile", label: "Profile & Address", icon: <UserCog size={18} /> },
];

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireCustomer();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="flex flex-col gap-6 border-b border-teal/15 bg-bg-secondary p-5 lg:w-64 lg:border-b-0 lg:border-r">
        <Logo />
        <SidebarNav items={NAV} />
        <Link href="/select-food" className="btn btn-gold mt-2 text-sm">
          <UtensilsCrossed size={16} /> Order food
        </Link>
        <div className="mt-auto hidden border-t border-teal/15 pt-4 lg:block">
          <p className="truncate text-sm font-medium text-ink">{profile.full_name}</p>
          <p className="truncate text-xs text-ink-muted">{profile.email}</p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-bg p-5 sm:p-8">{children}</main>
    </div>
  );
}
