import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarRange,
  Users,
  CreditCard,
  Truck,
  ShoppingBag,
  BarChart3,
  Package,
  Settings,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { SidebarNav, type NavItem } from "@/components/layout/SidebarNav";
import { SignOutButton } from "@/components/layout/SignOutButton";

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/food", label: "Food Items", icon: <UtensilsCrossed size={18} /> },
  { href: "/admin/menus", label: "Weekly Menus", icon: <CalendarRange size={18} /> },
  { href: "/admin/packages", label: "Plans & Packages", icon: <Package size={18} /> },
  { href: "/admin/orders", label: "Orders", icon: <ShoppingBag size={18} /> },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: <CalendarRange size={18} /> },
  { href: "/admin/customers", label: "Customers", icon: <Users size={18} /> },
  { href: "/admin/deliveries", label: "Deliveries", icon: <Truck size={18} /> },
  { href: "/admin/payments", label: "Payments", icon: <CreditCard size={18} /> },
  { href: "/admin/reports", label: "Reports", icon: <BarChart3 size={18} /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings size={18} /> },
];

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex flex-col gap-5 border-b border-teal/15 bg-bg-secondary p-5 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="badge border-gold/40 bg-gold/15 text-gold">Admin</span>
        </div>
        <SidebarNav items={NAV} />
        <div className="mt-auto hidden border-t border-teal/15 pt-4 lg:block">
          <p className="truncate text-sm font-medium text-ink">{profile.full_name || "Admin"}</p>
          <p className="truncate text-xs text-ink-muted">{profile.email}</p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>
      <main className="flex-1 bg-bg p-5 sm:p-8">{children}</main>
    </div>
  );
}
