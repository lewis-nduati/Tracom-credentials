/**
 * Andamio wrapper for shadcn/ui Badge
 *
 * Enhanced badge component with Andamio-specific status variants.
 *
 * Usage:
 * import { AndamioBadge } from "~/components/andamio";
 *
 * <AndamioBadge status="live">Live</AndamioBadge>
 * <AndamioBadge status="draft">Draft</AndamioBadge>
 */

import * as React from "react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

// Re-export base component
export { badgeVariants } from "~/components/ui/badge";

export interface AndamioBadgeProps
  extends React.ComponentPropsWithoutRef<typeof Badge> {
  /**
   * Predefined status variants using semantic colors
   */
  status?: "live" | "draft" | "archived" | "pending" | "success" | "error";
}

const statusStyles = {
  live: "bg-primary text-primary-foreground",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
  pending: "bg-secondary text-secondary-foreground",
  success: "bg-success text-success-foreground",
  error: "bg-destructive text-destructive-foreground",
};

export const AndamioBadge = React.forwardRef<
  HTMLDivElement,
  AndamioBadgeProps
>(({ className, status, variant, ...props }, ref) => {
  return (
    <Badge
      ref={ref}
      variant={variant}
      className={cn(status && statusStyles[status], className)}
      {...props}
    />
  );
});

AndamioBadge.displayName = "AndamioBadge";
