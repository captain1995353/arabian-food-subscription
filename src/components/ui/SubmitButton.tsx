"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  pendingText,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn("btn btn-gold", className)}
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? pendingText ?? "Please wait…" : children}
    </button>
  );
}
