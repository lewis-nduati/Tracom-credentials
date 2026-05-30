"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshIcon } from "~/components/icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-sm space-y-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
          Tracom Credentials
        </p>
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
          Something went wrong
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/40">
            {error.digest}
          </p>
        )}
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <RefreshIcon className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
