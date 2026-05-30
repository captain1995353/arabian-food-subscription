import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Image
        src="/logo.jpeg"
        alt="Arabian logo"
        width={40}
        height={40}
        className="h-9 w-9 rounded-md object-cover"
      />
      {!compact && (
        <span className="font-display text-lg font-bold tracking-wide text-gold">
          ARABIAN
        </span>
      )}
    </Link>
  );
}
