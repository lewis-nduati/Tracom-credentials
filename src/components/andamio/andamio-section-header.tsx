import * as React from "react";
import { cn } from "~/lib/utils";
import { AndamioText } from "./andamio-text";

interface AndamioSectionHeaderProps {
  /**
   * Section title (h2)
   */
  title: string;
  /**
   * Optional section description
   */
  description?: string;
  /**
   * Optional action element (button, link, etc.) displayed on the right
   */
  action?: React.ReactNode;
  /**
   * Optional badge or indicator displayed next to the title
   */
  badge?: React.ReactNode;
  /**
   * Optional icon displayed before the title
   */
  icon?: React.ReactNode;
  /**
   * Additional className for the container
   */
  className?: string;
  /**
   * Heading level - defaults to h2, can be h3 for subsections
   */
  as?: "h2" | "h3";
}

/**
 * AndamioSectionHeader - Responsive section header component
 *
 * Provides consistent, responsive section headers (h2/h3) across the application.
 * Handles title, description, icons, badges, and action buttons with proper
 * stacking behavior on mobile devices.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AndamioSectionHeader title="Student Learning Targets" />
 *
 * // With description
 * <AndamioSectionHeader
 *   title="Module Assignment"
 *   description="Complete this to demonstrate your understanding"
 * />
 *
 * // With icon and badge
 * <AndamioSectionHeader
 *   title="On-Chain Status"
 *   icon={<Blocks className="h-5 w-5" />}
 *   badge={<Badge>Verified</Badge>}
 * />
 *
 * // With action button
 * <AndamioSectionHeader
 *   title="Tasks"
 *   action={<Button>Add Task</Button>}
 * />
 *
 * // As h3 for subsections
 * <AndamioSectionHeader
 *   title="Lesson Details"
 *   as="h3"
 * />
 * ```
 */
export function AndamioSectionHeader({
  title,
  description,
  action,
  badge,
  icon,
  className,
  as = "h2",
}: AndamioSectionHeaderProps) {
  const Heading = as;
  const headingClasses = as === "h2"
    ? "text-xl sm:text-2xl font-semibold"
    : "text-lg sm:text-xl font-semibold";

  // Layout with action: flex container that stacks on mobile
  if (action) {
    return (
      <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4", className)}>
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {icon && <span className="shrink-0">{icon}</span>}
            <Heading className={headingClasses}>
              {title}
            </Heading>
            {badge}
          </div>
          {description && (
            <AndamioText variant="small">
              {description}
            </AndamioText>
          )}
        </div>
        <div className="shrink-0">
          {action}
        </div>
      </div>
    );
  }

  // Simple layout without action
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        <Heading className={headingClasses}>
          {title}
        </Heading>
        {badge}
      </div>
      {description && (
        <AndamioText variant="small">
          {description}
        </AndamioText>
      )}
    </div>
  );
}
