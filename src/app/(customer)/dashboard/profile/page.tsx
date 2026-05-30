import { requireCustomer } from "@/lib/auth";
import { ProfileForm } from "@/components/customer/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { profile, customer } = await requireCustomer();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile &amp; Address</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Keep your delivery details up to date so your food always reaches you.
        </p>
      </div>
      <ProfileForm profile={profile} customer={customer} />
    </div>
  );
}
