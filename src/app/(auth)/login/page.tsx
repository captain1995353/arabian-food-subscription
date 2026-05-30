"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Message } from "@/components/ui/Toast";

function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "";
  const confirmed = params.get("confirm");
  const [state, action] = useActionState<AuthState, FormData>(loginAction, {});

  return (
    <div className="card">
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-muted">Log in to manage your subscription.</p>

      {confirmed && (
        <div className="mt-4">
          <Message type="info">
            Account created! Please confirm your email, then log in. (If email
            confirmation is off, just log in now.)
          </Message>
        </div>
      )}

      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="redirect" value={redirect} />
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {state.error && <Message type="error">{state.error}</Message>}
        <SubmitButton className="w-full" pendingText="Logging in…">Login</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-ink-muted">
        No account?{" "}
        <Link href="/register" className="font-semibold text-gold hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
