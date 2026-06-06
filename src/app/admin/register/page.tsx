"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ShieldPlus } from "lucide-react";
import { adminRegisterAction, type AuthState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Message } from "@/components/ui/Toast";

export default function AdminRegisterPage() {
  const [state, action] = useActionState<AuthState, FormData>(adminRegisterAction, {});

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="mb-4 flex items-center gap-2 text-gold">
            <ShieldPlus size={22} />
            <h1 className="text-2xl font-bold">Create Admin Account</h1>
          </div>
          <p className="text-sm text-ink-muted">
            Staff only. You need the secret invite code to register as an admin.
          </p>

          <form action={action} className="mt-6 space-y-4">
            <div>
              <label htmlFor="full_name">Full name</label>
              <input id="full_name" name="full_name" required placeholder="e.g. Arabiana Manager" />
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
            <div>
              <label htmlFor="phone">Phone (optional)</label>
              <input id="phone" name="phone" placeholder="010-0000-0000" />
            </div>
            <div>
              <label htmlFor="invite_code">Admin invite code</label>
              <input id="invite_code" name="invite_code" required placeholder="Enter the staff invite code" />
            </div>

            {state.error && <Message type="error">{state.error}</Message>}
            <SubmitButton className="w-full" pendingText="Creating admin…">
              Create admin account
            </SubmitButton>
          </form>

          <p className="mt-5 text-center text-sm text-ink-muted">
            Already an admin?{" "}
            <Link href="/admin/login" className="font-semibold text-gold hover:underline">
              Admin login
            </Link>
          </p>
        </div>
        <Link href="/" className="mt-6 block text-center text-sm text-ink-muted hover:text-gold">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
