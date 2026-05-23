/**
 * AndamioDashboardStat - Dashboard KPI stat card
 *
 * Full card-based statistic display for dashboard KPI grids.
 * Shows a label with icon in the header and large value below.
 *
 * Usage:
 * ```tsx
 * import { AndamioDashboardStat } from "~/components/andamio";
 *
 * // Basic stat
 * <AndamioDashboardStat
 *   icon={ManagerIcon}
 *   label="Total Submissions"
 *   value={stats.total}
 * />
 *
 * // With description sub-text
 * <AndamioDashboardStat
 *   icon={CourseIcon}
 *   label="Total Courses"
 *   value={stats.total}
 *   description={`${stats.published} published, ${stats.draft} draft`}
 * />
 *
 * // With semantic color
 * <AndamioDashboardStat
 *   icon={SuccessIcon}
 *   label="Accepted"
 *   value={stats.accepted}
 *   valueColor="success"
 *   iconColor="success"
 * />
 *
 * // Grid of stats
 * <div className="grid gap-4 md:grid-cols-4">
 *   <AndamioDashboardStat icon={ManagerIcon} label="Total" value={10} />
 *   <AndamioDashboardStat icon={PendingIcon} label="Pending" value={5} />
 *   <AndamioDashboardStat icon={SuccessIcon} label="Accepted" value={3} valueColor="success" iconColor="success" />
 *   <AndamioDashboardStat icon={ErrorIcon} label="Denied" value={2} valueColor="destructive" iconColor="destructive" />
 * </div>
 * ```
 *
 * Note: For compact inline stats, use AndamioStatCard instead.
 */

import * as React from "react";
import { cn } from "~/lib/utils";
import type { IconComponent } from "~/types/ui";
import {
  AndamioCard,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioCardContent,
} from "./andamio-card";
import { AndamioText } from "./andamio-text";

export interface AndamioDashboardStatProps {
  /**
   * Lucide icon component to display in the header
   */
  icon: IconComponent;
  /**
   * Label describing the statistic
   */
  label: string;
  /**
   * The value to display prominently (number or string for formatted values)
   */
  value: React.ReactNode;
  /**
   * Optional description text shown below the value
   */
  description?: string;
  /**
   * Semantic color for the value text
   * @default undefined (uses default text color)
   */
  valueColor?: "success" | "warning" | "destructive" | "info" | "muted";
  /**
   * Semantic color for the icon
   * @default "muted"
   */
  iconColor?: "success" | "warning" | "destructive" | "info" | "muted";
  /**
   * Additional className for the card container
   */
  className?: string;
}

const valueColorClasses = {
  success: "text-primary",
  warning: "text-muted-foreground",
  destructive: "text-destructive",
  info: "text-secondary",
  muted: "text-muted-foreground",
};

const iconColorClasses = {
  success: "text-primary",
  warning: "text-muted-foreground",
  destructive: "text-destructive",
  info: "text-secondary",
  muted: "text-muted-foreground",
};

export function AndamioDashboardStat({
  icon: Icon,
  label,
  value,
  description,
  valueColor,
  iconColor = "muted",
  className,
}: AndamioDashboardStatProps) {
  return (
    <AndamioCard className={className}>
      <AndamioCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <AndamioCardTitle className="text-sm font-medium">{label}</AndamioCardTitle>
        <Icon className={cn("h-4 w-4", iconColorClasses[iconColor])} />
      </AndamioCardHeader>
      <AndamioCardContent>
        <div className={cn("text-2xl font-bold", valueColor && valueColorClasses[valueColor])}>
          {value}
        </div>
        {description && (
          <AndamioText variant="small" className="mt-1">{description}</AndamioText>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
