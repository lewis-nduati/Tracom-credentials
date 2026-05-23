import React from "react";
import { cn } from "~/lib/utils";
import {
  SuccessIcon,
  PendingIcon,
  AlertIcon,
  NeutralIcon,
  type LucideIcon,
} from "~/components/icons";

/**
 * Status variants for AndamioStatusIcon
 *
 * Each variant maps to a semantic meaning:
 * - success: Completed, on-chain, verified
 * - warning: Needs attention, ready to publish
 * - info: In progress, pending, syncing
 * - muted: Draft, inactive, default state
 * - destructive: Error, failed, archived
 */
export type StatusVariant = "success" | "warning" | "info" | "muted" | "destructive";

/**
 * Preset status configurations for common use cases
 */
export type StatusPreset =
  | "on-chain"
  | "synced"
  | "pending"
  | "syncing"
  | "draft"
  | "ready"
  | "needs-import"
  | "error"
  | "archived";

interface StatusConfig {
  icon: LucideIcon;
  variant: StatusVariant;
  animate?: boolean;
}

const presetConfig: Record<StatusPreset, StatusConfig> = {
  "on-chain": { icon: SuccessIcon, variant: "success" },
  synced: { icon: SuccessIcon, variant: "success" },
  pending: { icon: PendingIcon, variant: "info", animate: true },
  syncing: { icon: PendingIcon, variant: "info", animate: true },
  draft: { icon: NeutralIcon, variant: "muted" },
  ready: { icon: NeutralIcon, variant: "warning" },
  "needs-import": { icon: AlertIcon, variant: "warning" },
  error: { icon: AlertIcon, variant: "destructive" },
  archived: { icon: NeutralIcon, variant: "muted" },
};

const variantStyles: Record<StatusVariant, { bg: string; text: string }> = {
  success: { bg: "bg-primary/10", text: "text-primary" },
  warning: { bg: "bg-muted", text: "text-muted-foreground" },
  info: { bg: "bg-secondary/10", text: "text-secondary" },
  muted: { bg: "bg-muted", text: "text-muted-foreground" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive" },
};

export interface AndamioStatusIconProps {
  /**
   * Use a preset status configuration
   */
  status?: StatusPreset;
  /**
   * Or provide custom configuration
   */
  variant?: StatusVariant;
  /**
   * Custom icon (overrides preset)
   */
  icon?: LucideIcon;
  /**
   * Whether to animate the icon (pulse)
   */
  animate?: boolean;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Shape variant
   */
  shape?: "rounded" | "circle";
  /**
   * Additional className
   */
  className?: string;
  /**
   * Accessible label for screen readers
   */
  "aria-label"?: string;
}

const sizeConfig = {
  sm: { container: "h-6 w-6", icon: "h-3 w-3" },
  md: { container: "h-8 w-8", icon: "h-4 w-4" },
  lg: { container: "h-10 w-10", icon: "h-5 w-5" },
};

/**
 * AndamioStatusIcon
 *
 * Consistent status indicator with icon and semantic color background.
 *
 * @example
 * // Using presets
 * <AndamioStatusIcon status="on-chain" />
 * <AndamioStatusIcon status="pending" />
 * <AndamioStatusIcon status="draft" />
 *
 * @example
 * // Custom configuration
 * <AndamioStatusIcon variant="success" icon={Star} />
 * <AndamioStatusIcon variant="warning" icon={AlertTriangle} animate />
 *
 * @example
 * // Different sizes and shapes
 * <AndamioStatusIcon status="synced" size="sm" />
 * <AndamioStatusIcon status="synced" size="lg" shape="circle" />
 */
export function AndamioStatusIcon({
  status,
  variant,
  icon,
  animate,
  size = "md",
  shape = "rounded",
  className,
  "aria-label": ariaLabel,
}: AndamioStatusIconProps) {
  // Resolve configuration
  const preset = status ? presetConfig[status] : null;
  const resolvedVariant = variant ?? preset?.variant ?? "muted";
  const resolvedIcon = icon ?? preset?.icon ?? NeutralIcon;
  const shouldAnimate = animate ?? preset?.animate ?? false;

  const styles = variantStyles[resolvedVariant];
  const sizes = sizeConfig[size];
  const Icon = resolvedIcon;

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        sizes.container,
        shape === "circle" ? "rounded-full" : "rounded-md",
        styles.bg,
        className
      )}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      <Icon
        className={cn(
          sizes.icon,
          styles.text,
          shouldAnimate && "animate-pulse"
        )}
      />
    </div>
  );
}

/**
 * Helper to get status from hybrid course data
 */
export function getCourseStatus(course: {
  inDb: boolean;
  onChain: boolean;
}): StatusPreset {
  if (course.inDb && course.onChain) return "synced";
  if (course.inDb && !course.onChain) return "syncing";
  return "needs-import";
}

/**
 * Helper to get status from module status string
 */
export function getModuleStatus(status: string): StatusPreset {
  switch (status) {
    case "ON_CHAIN":
      return "on-chain";
    case "PENDING_TX":
      return "pending";
    case "APPROVED":
      return "ready";
    case "DRAFT":
    case "BACKLOG":
      return "draft";
    case "ARCHIVED":
    case "DEPRECATED":
      return "archived";
    default:
      return "draft";
  }
}
