/**
 * Shared Course UI Components
 *
 * Reusable components extracted from course view components
 * to eliminate duplication and ensure consistency.
 */

"use client";

import React from "react";
import Link from "next/link";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { SuccessIcon, LessonIcon, ModuleIcon, SettingsIcon } from "~/components/icons";

/**
 * CourseStatusBadge - Shows Published/Draft status
 *
 * @example
 * ```tsx
 * <CourseStatusBadge isPublished={!!course.course_nft_policy_id} />
 * ```
 */
export interface CourseStatusBadgeProps {
  isPublished: boolean;
  showIcon?: boolean;
  className?: string;
}

export function CourseStatusBadge({
  isPublished,
  showIcon = false,
  className,
}: CourseStatusBadgeProps) {
  if (isPublished) {
    return (
      <AndamioBadge variant="outline" className={`text-primary border-primary ${className ?? ""}`}>
        {showIcon && <SuccessIcon className="h-3 w-3 mr-1" />}
        Published
      </AndamioBadge>
    );
  }

  return (
    <AndamioBadge variant="outline" className={`text-muted-foreground ${className ?? ""}`}>
      {showIcon && <LessonIcon className="h-3 w-3 mr-1" />}
      Draft
    </AndamioBadge>
  );
}

/**
 * CourseStatusIcon - Icon-only status indicator
 *
 * @example
 * ```tsx
 * <CourseStatusIcon isPublished={!!course.course_nft_policy_id} />
 * ```
 */
export interface CourseStatusIconProps {
  isPublished: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function CourseStatusIcon({
  isPublished,
  size = "md",
  className,
}: CourseStatusIconProps) {
  const sizeClass = iconSizes[size];

  if (isPublished) {
    return <SuccessIcon className={`${sizeClass} text-primary ${className ?? ""}`} />;
  }

  return <LessonIcon className={`${sizeClass} text-muted-foreground ${className ?? ""}`} />;
}

/**
 * CourseModuleCount - Badge showing number of modules
 *
 * @example
 * ```tsx
 * <CourseModuleCount count={moduleCounts[courseCode]} />
 * ```
 */
export interface CourseModuleCountProps {
  count: number | undefined;
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function CourseModuleCount({
  count,
  showIcon = true,
  showLabel = false,
  className,
}: CourseModuleCountProps) {
  if (count === undefined) {
    return null;
  }

  return (
    <AndamioBadge variant="secondary" className={className}>
      {showIcon && <ModuleIcon className="h-3 w-3 mr-1" />}
      {count}
      {showLabel && ` module${count !== 1 ? "s" : ""}`}
    </AndamioBadge>
  );
}

/**
 * CourseManageButton - Consistent "Manage Course" action button
 *
 * @example
 * ```tsx
 * <CourseManageButton
 *   courseId={course.course_nft_policy_id}
 *   variant="outline"
 * />
 * ```
 */
export interface CourseManageButtonProps {
  courseId: string | null;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function CourseManageButton({
  courseId,
  variant = "outline",
  size = "sm",
  showLabel = true,
  label = "Manage",
  className,
}: CourseManageButtonProps) {
  if (!courseId) {
    return null;
  }

  return (
    <Link href={`/studio/course/${courseId}`}>
      <AndamioButton variant={variant} size={size} className={className}>
        <SettingsIcon className={`h-4 w-4 ${showLabel ? "mr-2" : ""}`} />
        {showLabel && label}
      </AndamioButton>
    </Link>
  );
}

/**
 * CourseCodeDisplay - Consistent code display with optional label
 *
 * @example
 * ```tsx
 * <CourseCodeDisplay code="CS101" showLabel />
 * ```
 */
export interface CourseCodeDisplayProps {
  code: string;
  showLabel?: boolean;
  className?: string;
}

export function CourseCodeDisplay({
  code,
  showLabel = false,
  className,
}: CourseCodeDisplayProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {showLabel && (
        <span className="text-xs text-muted-foreground">Code:</span>
      )}
      <code className="text-xs font-mono">{code}</code>
    </div>
  );
}
