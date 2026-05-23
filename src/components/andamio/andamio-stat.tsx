import * as React from "react";
import { cn } from "~/lib/utils";
import type { IconComponent } from "~/types/ui";
import { AndamioText } from "./andamio-text";
import {
  AndamioCard,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioCardContent
} from "./andamio-card";

type StatVariant = "inline" | "card";
type StatColor = "muted" | "primary" | "success" | "warning" | "info" | "destructive";

export interface AndamioStatProps {
  /**
   * The display variant:
   * - "inline": Compact row with icon and small text (prev AndamioStatCard)
   * - "card": Full KPI card with large value (prev AndamioDashboardStat)
   */
  variant?: StatVariant;
  /**
   * Lucide icon component
   */
  icon: IconComponent;
  /**
   * Main label/title
   */
  label: string;
  /**
   * Prominent value to display
   */
  value: React.ReactNode;
  /**
   * Optional description (only for variant="card")
   */
  description?: string;
  /**
   * Semantic color for the icon and value
   */
  color?: StatColor;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Whether to apply hover effects (only for variant="card")
   */
  hoverable?: boolean;
}

const colorClasses: Record<StatColor, string> = {
  muted: "text-muted-foreground",
  primary: "text-primary",
  success: "text-primary",
  warning: "text-muted-foreground",
  info: "text-secondary",
  destructive: "text-destructive",
};

/**
 * Unified Statistic component for Andamio.
 * Consolidates AndamioStatCard and AndamioDashboardStat.
 */
export function AndamioStat({
  variant = "card",
  icon: Icon,
  label,
  value,
  description,
  color = "muted",
  className,
  hoverable,
}: AndamioStatProps) {
  const colorClass = colorClasses[color];

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 transition-standard hover:bg-muted/70",
          className
        )}
      >
        <Icon className={cn("h-4 w-4", colorClass)} />
        <div>
          <AndamioText className="text-lg font-semibold leading-tight">{value}</AndamioText>
          <AndamioText variant="small" className="text-xs">{label}</AndamioText>
        </div>
      </div>
    );
  }

  return (
    <AndamioCard hoverable={hoverable} className={className}>
      <AndamioCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <AndamioCardTitle className="text-sm font-medium">{label}</AndamioCardTitle>
        <Icon className={cn("h-4 w-4", colorClass)} />
      </AndamioCardHeader>
      <AndamioCardContent>
        <div className={cn("text-2xl font-bold tracking-tight", color !== "muted" && colorClass)}>
          {value}
        </div>
        {description && (
          <AndamioText variant="small" className="mt-1 opacity-80">{description}</AndamioText>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
