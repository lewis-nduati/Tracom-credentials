/**
 * AndamioNotFoundCard - Reusable "Not Found" error display
 *
 * Provides consistent error/not-found states across the application.
 * Combines AndamioPageHeader with AndamioAlert for standardized error display.
 *
 * Usage:
 * import { AndamioNotFoundCard } from "~/components/andamio";
 *
 * @example
 * ```tsx
 * // Basic not found
 * <AndamioNotFoundCard title="Course Not Found" />
 *
 * // With custom error message
 * <AndamioNotFoundCard
 *   title="Module Not Found"
 *   message="The requested module could not be loaded"
 * />
 *
 * // With action button
 * <AndamioNotFoundCard
 *   title="Assignment Not Found"
 *   message="This assignment may have been deleted"
 *   action={<AndamioButton onClick={() => router.back()}>Go Back</AndamioButton>}
 * />
 * ```
 */

import * as React from "react";
import { AlertIcon } from "~/components/icons";
import { AndamioPageHeader } from "./andamio-page-header";
import { AndamioAlert, AndamioAlertTitle, AndamioAlertDescription } from "./andamio-alert";
import { cn } from "~/lib/utils";

export interface AndamioNotFoundCardProps {
  /**
   * Title displayed in the page header (e.g., "Course Not Found")
   */
  title: string;
  /**
   * Optional error message displayed in the alert
   * Defaults to "The requested resource could not be found"
   */
  message?: string;
  /**
   * Optional action element (button, link) displayed below the alert
   */
  action?: React.ReactNode;
  /**
   * Additional className for the container
   */
  className?: string;
}

export function AndamioNotFoundCard({
  title,
  message = "The requested resource could not be found",
  action,
  className,
}: AndamioNotFoundCardProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <AndamioPageHeader title={title} />

      <AndamioAlert variant="destructive">
        <AlertIcon className="h-4 w-4" />
        <AndamioAlertTitle>Error</AndamioAlertTitle>
        <AndamioAlertDescription>{message}</AndamioAlertDescription>
      </AndamioAlert>

      {action && <div>{action}</div>}
    </div>
  );
}
