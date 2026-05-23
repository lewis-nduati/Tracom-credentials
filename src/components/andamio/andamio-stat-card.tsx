/**
 * AndamioStatCard - Reusable statistic display card
 *
 * Provides consistent stat/metric display across the application.
 * Used for showing counts, totals, and other numeric data with icons.
 *
 * Usage:
 * import { AndamioStatCard } from "~/components/andamio";
 *
 * @example
 * ```tsx
 * // Basic stat
 * <AndamioStatCard
 *   icon={BookOpen}
 *   value={12}
 *   label="Courses"
 * />
 *
 * // With semantic color
 * <AndamioStatCard
 *   icon={Award}
 *   value={5}
 *   label="Credentials"
 *   iconColor="warning"
 * />
 *
 * // Grid of stats
 * <div className="grid grid-cols-2 gap-3">
 *   <AndamioStatCard icon={BookOpen} value={12} label="Courses" iconColor="info" />
 *   <AndamioStatCard icon={Award} value={5} label="Credentials" iconColor="warning" />
 * </div>
 * ```
 */

import * as React from "react";
import { cn } from "~/lib/utils";
import type { IconComponent } from "~/types/ui";
import { AndamioText } from "./andamio-text";

export interface AndamioStatCardProps {
  /**
   * Lucide icon component to display
   */
  icon: IconComponent;
  /**
   * The numeric or string value to display prominently
   */
  value: number | string;
  /**
   * Label describing the statistic
   */
  label: string;
  /**
   * Semantic color for the icon
   * @default "muted"
   */
  iconColor?: "muted" | "primary" | "success" | "warning" | "info" | "destructive";
  /**
   * Additional className for the container
   */
  className?: string;
}

const iconColorClasses = {
  muted: "text-muted-foreground",
  primary: "text-primary",
  success: "text-primary",
  warning: "text-muted-foreground",
  info: "text-secondary",
  destructive: "text-destructive",
};

export function AndamioStatCard({
  icon: Icon,
  value,
  label,
  iconColor = "muted",
  className,
}: AndamioStatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2",
        className
      )}
    >
      <Icon className={cn("h-4 w-4", iconColorClasses[iconColor])} />
      <div>
        <AndamioText className="text-lg font-semibold">{value}</AndamioText>
        <AndamioText variant="small" className="text-xs">{label}</AndamioText>
      </div>
    </div>
  );
}
