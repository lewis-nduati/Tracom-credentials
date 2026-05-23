"use client";

import { useEffect } from "react";
import { AlertIcon, RefreshIcon } from "~/components/icons";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioButton } from "~/components/andamio/andamio-button";

/**
 * Route-level error boundary
 *
 * Catches unhandled errors at the route level and displays a minimal error UI.
 * Note: For global errors (errors in root layout), use global-error.tsx.
 * This error boundary is rendered within the existing layout.
 */
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertIcon className="h-6 w-6" />
          <AndamioHeading level={1} size="xl">Something went wrong</AndamioHeading>
        </div>

        <AndamioText variant="muted">
          {error.message || "An unexpected error occurred"}
        </AndamioText>

        {error.digest && (
          <AndamioText variant="small" className="text-muted-foreground">
            Error ID: {error.digest}
          </AndamioText>
        )}

        <AndamioButton onClick={reset}>
          <RefreshIcon className="mr-2 h-4 w-4" />
          Try again
        </AndamioButton>
      </div>
    </div>
  );
}
