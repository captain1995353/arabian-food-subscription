import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <Link href="/" className="mt-8 text-sm text-ink-muted hover:text-gold">
        ← Back to home
      </Link>
    </div>
  );
}
