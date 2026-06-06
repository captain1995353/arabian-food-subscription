import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card">
        <h2 className="text-lg font-semibold">Admin account</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
          <Info label="Name" value={admin.full_name || "—"} />
          <Info label="Email" value={admin.email} />
          <Info label="Role" value={admin.role} />
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold">Payment instructions</h2>
        <p className="mt-1 text-sm text-ink-muted">
          These are the manual payment details shared with customers at checkout.
          Update the values in the source (checkout payment hints / contact page)
          or wire them to a settings table later.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
          <li><strong className="text-gold">Bank transfer:</strong> Toss Bank · 1002-6091-5319 (Arabiana)</li>
          <li><strong className="text-gold">KakaoPay:</strong> @arabianfood</li>
          <li><strong className="text-gold">Cash:</strong> Pay the driver on delivery</li>
        </ul>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold">How the workflow runs</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink-secondary">
          <li>Create food items, then build a Weekly Menu and add dishes.</li>
          <li>Publish the menu so customers can order from it.</li>
          <li>Customers select food, pick a plan, and check out.</li>
          <li>Confirm payment (Payments) and advance order status (Orders).</li>
          <li>Generate the weekly Delivery list and update delivery status.</li>
        </ol>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-medium capitalize">{value}</p>
    </div>
  );
}
