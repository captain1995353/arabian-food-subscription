"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileState } from "@/lib/actions/profile";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Message } from "@/components/ui/Toast";
import { PREFERRED_DAYS } from "@/lib/validations";
import type { Customer, Profile } from "@/lib/types";

export function ProfileForm({
  profile,
  customer,
}: {
  profile: Profile;
  customer: Customer | null;
}) {
  const [state, action] = useActionState<ProfileState, FormData>(updateProfileAction, {});

  return (
    <form action={action} className="card space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name">Full name</label>
          <input id="full_name" name="full_name" defaultValue={profile.full_name} required />
        </div>
        <div>
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" defaultValue={profile.phone ?? ""} required />
        </div>
        <div>
          <label htmlFor="nationality">Nationality</label>
          <input id="nationality" name="nationality" defaultValue={customer?.nationality ?? ""} />
        </div>
        <div>
          <label htmlFor="preferred_delivery_day">Preferred delivery day</label>
          <select id="preferred_delivery_day" name="preferred_delivery_day" defaultValue={customer?.preferred_delivery_day ?? "Saturday"}>
            {PREFERRED_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <hr className="border-teal/15" />
      <p className="text-sm font-semibold text-gold">Delivery address</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city">City</label>
          <input id="city" name="city" defaultValue={customer?.city ?? ""} required />
        </div>
        <div>
          <label htmlFor="zip_code">Zip code</label>
          <input id="zip_code" name="zip_code" defaultValue={customer?.zip_code ?? ""} required />
        </div>
      </div>
      <div>
        <label htmlFor="address">Full address</label>
        <input id="address" name="address" defaultValue={customer?.address ?? ""} required />
      </div>
      <div>
        <label htmlFor="room_building">Room / building</label>
        <input id="room_building" name="room_building" defaultValue={customer?.room_building ?? ""} />
      </div>
      <div>
        <label htmlFor="allergy_note">Allergies / special notes</label>
        <textarea id="allergy_note" name="allergy_note" rows={2} defaultValue={customer?.allergy_note ?? ""} />
      </div>

      {state.error && <Message type="error">{state.error}</Message>}
      {state.success && <Message type="success">Profile updated.</Message>}
      <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}
