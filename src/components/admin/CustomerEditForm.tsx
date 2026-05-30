"use client";

import { useActionState } from "react";
import { adminUpdateCustomer, type AdminState } from "@/lib/actions/admin";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Message } from "@/components/ui/Toast";
import { PREFERRED_DAYS } from "@/lib/validations";
import type { Customer, Profile } from "@/lib/types";

export function CustomerEditForm({ profile, customer }: { profile: Profile; customer: Customer | null }) {
  const [state, action] = useActionState<AdminState, FormData>(adminUpdateCustomer, {});
  return (
    <form action={action} className="card space-y-4">
      <h2 className="text-lg font-semibold">Edit customer</h2>
      <input type="hidden" name="id" defaultValue={profile.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label>Full name</label><input name="full_name" defaultValue={profile.full_name} /></div>
        <div><label>Phone</label><input name="phone" defaultValue={profile.phone ?? ""} /></div>
        <div><label>Nationality</label><input name="nationality" defaultValue={customer?.nationality ?? ""} /></div>
        <div>
          <label>Preferred delivery day</label>
          <select name="preferred_delivery_day" defaultValue={customer?.preferred_delivery_day ?? "Saturday"}>
            {PREFERRED_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div><label>City</label><input name="city" defaultValue={customer?.city ?? ""} /></div>
        <div><label>Zip code</label><input name="zip_code" defaultValue={customer?.zip_code ?? ""} /></div>
      </div>
      <div><label>Address</label><input name="address" defaultValue={customer?.address ?? ""} /></div>
      <div><label>Room / building</label><input name="room_building" defaultValue={customer?.room_building ?? ""} /></div>
      <div><label>Allergy / note</label><textarea name="allergy_note" rows={2} defaultValue={customer?.allergy_note ?? ""} /></div>
      {state.error && <Message type="error">{state.error}</Message>}
      {state.success && <Message type="success">Customer updated.</Message>}
      <SubmitButton pendingText="Saving…">Save</SubmitButton>
    </form>
  );
}
