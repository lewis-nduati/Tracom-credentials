"use client";

import { useEffect } from "react";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { RefreshIcon } from "~/components/icons";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-sm space-y-4">
        <AndamioText variant="overline" className="text-muted-foreground/60">
          Error
        </AndamioText>
        <AndamioHeading level={1} size="3xl">
          Something went wrong
        </AndamioHeading>
        <AndamioText variant="muted" className="leading-relaxed">
          {error.message || "An unexpected error occurred while loading this page."}
        </AndamioText>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/40">
            {error.digest}
          </p>
        )}
        <div className="pt-2">
          <AndamioButton onClick={reset}>
            <RefreshIcon className="mr-2 h-4 w-4" />
            Try again
          </AndamioButton>
        </div>
      </div>
    </div>
  );
}
