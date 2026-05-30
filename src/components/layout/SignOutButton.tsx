import { LogOut } from "lucide-react";

/** Posts to the signout route handler and clears the session. */
export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={`inline-flex items-center gap-2 text-sm text-ink-muted transition hover:text-spice ${className}`}
      >
        <LogOut size={16} /> Sign out
      </button>
    </form>
  );
}
