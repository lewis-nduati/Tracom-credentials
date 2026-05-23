"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertIcon, RefreshIcon, CourseIcon } from "~/components/icons";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioButton } from "~/components/andamio/andamio-button";

/**
 * Course route error boundary
 *
 * Catches unhandled errors within the /course route tree.
 * Renders inside the app layout (sidebar preserved).
 */
export default function CourseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Course route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertIcon className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <AndamioHeading level={1} size="xl">Something went wrong</AndamioHeading>
          <AndamioText variant="muted">
            {error.message || "An unexpected error occurred while loading this course."}
          </AndamioText>
        </div>

        {error.digest && (
          <AndamioText variant="small" className="text-muted-foreground">
            Error ID: {error.digest}
          </AndamioText>
        )}

        <div className="flex justify-center gap-3">
          <AndamioButton onClick={reset} variant="outline">
            <RefreshIcon className="mr-2 h-4 w-4" />
            Try again
          </AndamioButton>
          <Link href="/course">
            <AndamioButton>
              <CourseIcon className="mr-2 h-4 w-4" />
              All Courses
            </AndamioButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
