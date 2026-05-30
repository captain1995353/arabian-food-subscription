"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import { registerAction, type AuthState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Message } from "@/components/ui/Toast";
import { PREFERRED_DAYS } from "@/lib/validations";

function RegisterForm() {
  const [state, action] = useActionState<AuthState, FormData>(registerAction, {});

  return (
    <div className="card">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Tell us where to deliver your weekly food in Korea.
      </p>

      <form action={action} className="mt-6 space-y-5">
        {/* Account */}
        <div className="space-y-4">
          <div>
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" name="full_name" required placeholder="e.g. Mohammed Ali" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" minLength={6} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone">Phone number</label>
              <input id="phone" name="phone" required placeholder="010-0000-0000" />
            </div>
            <div>
              <label htmlFor="nationality">Nationality</label>
              <input id="nationality" name="nationality" required placeholder="e.g. Bangladesh" />
            </div>
          </div>
        </div>

        <hr className="border-teal/15" />

        {/* Delivery */}
        <p className="text-sm font-semibold text-gold">Delivery details</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="city">City in Korea</label>
            <input id="city" name="city" required placeholder="e.g. Seoul" />
          </div>
          <div>
            <label htmlFor="zip_code">Zip code</label>
            <input id="zip_code" name="zip_code" required placeholder="e.g. 06236" />
          </div>
        </div>
        <div>
          <label htmlFor="address">Full delivery address</label>
          <input id="address" name="address" required placeholder="Street, district, gu, dong…" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="room_building">Room number / building</label>
            <input id="room_building" name="room_building" placeholder="e.g. Bldg 3, Room 502" />
          </div>
          <div>
            <label htmlFor="preferred_delivery_day">Preferred delivery day</label>
            <select id="preferred_delivery_day" name="preferred_delivery_day" defaultValue="Saturday">
              {PREFERRED_DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="allergy_note">Allergies / special food notes (optional)</label>
          <textarea id="allergy_note" name="allergy_note" rows={2} placeholder="e.g. no nuts, less spicy" />
        </div>

        {state.error && <Message type="error">{state.error}</Message>}
        <SubmitButton className="w-full" pendingText="Creating account…">
          Create account
        </SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-gold hover:underline">Login</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="card">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
