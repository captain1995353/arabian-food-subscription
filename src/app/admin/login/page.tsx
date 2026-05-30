"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { adminLoginAction, type AuthState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Message } from "@/components/ui/Toast";

function AdminLoginForm() {
  const params = useSearchParams();
  const notAdmin = params.get("error") === "not_admin";
  const confirmed = params.get("confirm");
  const [state, action] = useActionState<AuthState, FormData>(adminLoginAction, {});

  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-2 text-gold">
        <ShieldCheck size={22} />
        <h1 className="text-2xl font-bold">Admin Login</h1>
      </div>
      <p className="text-sm text-ink-muted">Restricted area — staff only.</p>

      {notAdmin && (
        <div className="mt-4">
          <Message type="error">That account is not an admin.</Message>
        </div>
      )}
      {confirmed && (
        <div className="mt-4">
          <Message type="info">Admin account created. Confirm your email if required, then log in.</Message>
        </div>
      )}

      <form action={action} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />
        </div>
        {state.error && <Message type="error">{state.error}</Message>}
        <SubmitButton className="w-full" pendingText="Verifying…">Login as Admin</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-ink-muted">
        Need an admin account?{" "}
        <Link href="/admin/register" className="font-semibold text-gold hover:underline">
          Register with invite code
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="card">Loading…</div>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
