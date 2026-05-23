"use client";

import { useEffect } from "react";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioPageHeader } from "~/components/andamio";
import { AlertIcon, RefreshIcon } from "~/components/icons";

/**
 * Error boundary for studio course pages
 *
 * Catches unhandled errors when editing a specific course in the studio.
 * Users can attempt to recover by clicking the retry button.
 */
export default function StudioCourseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Studio course error boundary caught:", error);
  }, [error]);

  return (
    <div className="space-y-6 p-6">
      <AndamioPageHeader
        title="Course error"
        description="An unexpected error occurred while loading this course"
      />

      <AndamioAlert variant="destructive">
        <AlertIcon className="h-4 w-4" />
        <AndamioAlertTitle>Error</AndamioAlertTitle>
        <AndamioAlertDescription>
          {error.message || "Failed to load course data"}
          {error.digest && (
            <span className="block mt-1 text-xs text-muted-foreground">
              Error ID: {error.digest}
            </span>
          )}
        </AndamioAlertDescription>
      </AndamioAlert>

      <AndamioButton onClick={reset} variant="outline">
        <RefreshIcon className="h-4 w-4 mr-2" />
        Try again
      </AndamioButton>
    </div>
  );
}
