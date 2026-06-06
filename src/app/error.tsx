"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console / Vercel logs for debugging.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-ink-secondary">
        Sorry, that didn&apos;t work. Please try again — your data is safe.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={() => reset()} className="btn btn-gold">Try again</button>
        <a href="/dashboard" className="btn btn-outline">Back to dashboard</a>
      </div>
    </div>
  );
}
