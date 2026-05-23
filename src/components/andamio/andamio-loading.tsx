/**
 * Andamio Loading Components
 *
 * Unified loading skeleton system with variants that match actual content.
 * Use these instead of inline skeletons for consistency.
 *
 * @example
 * ```tsx
 * // Page loading
 * if (isLoading) return <AndamioPageLoading variant="list" />;
 *
 * // Studio/workspace loading
 * if (isLoading) return <AndamioStudioLoading variant="centered" />;
 *
 * // Card loading
 * if (isLoading) return <AndamioCardLoading title="My Learning" />;
 *
 * // List loading
 * if (isLoading) return <AndamioListLoading count={5} />;
 * ```
 */

import * as React from "react";
import { AndamioSkeleton } from "./andamio-skeleton";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "./andamio-card";
import { AndamioHeading } from "./andamio-heading";
import { cn } from "~/lib/utils";

// =============================================================================
// Page Loading - Full page skeleton
// =============================================================================

export interface AndamioPageLoadingProps {
  /**
   * Layout variant:
   * - "list": Header + list items (default)
   * - "detail": Header + description + content blocks
   * - "content": Header + large content area
   * - "table": Header + table rows
   * - "cards": Header + card grid
   */
  variant?: "list" | "detail" | "content" | "table" | "cards";
  /** Number of skeleton items */
  itemCount?: number;
  /** Additional className */
  className?: string;
}

export function AndamioPageLoading({
  variant = "list",
  itemCount = 5,
  className,
}: AndamioPageLoadingProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Page header skeleton */}
      <div className="space-y-2">
        <AndamioSkeleton className="h-8 w-48" />
        <AndamioSkeleton className="h-5 w-80" />
      </div>

      {/* Content skeleton based on variant */}
      {variant === "list" && (
        <div className="space-y-2">
          {Array.from({ length: itemCount }).map((_, i) => (
            <AndamioSkeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {variant === "detail" && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <AndamioSkeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <AndamioSkeleton className="h-6 w-3/4" />
              <AndamioSkeleton className="h-4 w-full" />
              <AndamioSkeleton className="h-4 w-2/3" />
            </div>
          </div>
          <AndamioSkeleton className="h-48 w-full rounded-lg" />
        </div>
      )}

      {variant === "content" && (
        <div className="space-y-4">
          <AndamioSkeleton className="h-6 w-32" />
          <AndamioSkeleton className="h-64 w-full rounded-lg" />
        </div>
      )}

      {variant === "table" && (
        <div className="border rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="flex gap-4 p-3 border-b bg-muted/30">
            <AndamioSkeleton className="h-4 w-1/4" />
            <AndamioSkeleton className="h-4 w-1/3" />
            <AndamioSkeleton className="h-4 w-1/4" />
          </div>
          {/* Table rows */}
          {Array.from({ length: itemCount }).map((_, i) => (
            <div key={i} className="flex gap-4 p-3 border-b last:border-0">
              <AndamioSkeleton className="h-5 w-1/4" />
              <AndamioSkeleton className="h-5 w-1/3" />
              <AndamioSkeleton className="h-5 w-1/4" />
            </div>
          ))}
        </div>
      )}

      {variant === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: itemCount }).map((_, i) => (
            <div key={i} className="border rounded-sm overflow-hidden">
              {/* Image placeholder */}
              <AndamioSkeleton className="h-32 sm:h-40 w-full rounded-none" />
              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <AndamioSkeleton className="h-5 w-3/4" />
                  <AndamioSkeleton className="h-3 w-1/2" />
                </div>
                <div className="space-y-2">
                  <AndamioSkeleton className="h-4 w-full" />
                  <AndamioSkeleton className="h-4 w-4/5" />
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <AndamioSkeleton className="h-4 w-20" />
                  <AndamioSkeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Studio Loading - For studio/workspace layouts
// =============================================================================

export interface AndamioStudioLoadingProps {
  /**
   * Layout variant:
   * - "centered": Centered skeleton for full-workspace loading
   * - "split-pane": Left list + right content
   * - "editor": Editor-focused with toolbar
   */
  variant?: "centered" | "split-pane" | "editor";
  /** Additional className */
  className?: string;
}

export function AndamioStudioLoading({
  variant = "centered",
  className,
}: AndamioStudioLoadingProps) {
  if (variant === "centered") {
    return (
      <div className={cn("flex h-full items-center justify-center", className)}>
        <div className="space-y-4 text-center">
          <AndamioSkeleton className="h-10 w-10 rounded-lg mx-auto" />
          <div className="space-y-2">
            <AndamioSkeleton className="h-5 w-32 mx-auto" />
            <AndamioSkeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "split-pane") {
    return (
      <div className={cn("flex h-full", className)}>
        {/* Left panel skeleton */}
        <div className="w-64 border-r p-3 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <AndamioSkeleton className="h-8 w-8 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <AndamioSkeleton className="h-4 w-24" />
                <AndamioSkeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
        {/* Right panel skeleton */}
        <div className="flex-1 p-4 space-y-4">
          <AndamioSkeleton className="h-8 w-48" />
          <AndamioSkeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Editor variant
  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-2 p-2 border-b">
        {Array.from({ length: 6 }).map((_, i) => (
          <AndamioSkeleton key={i} className="h-8 w-8 rounded" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="flex-1 p-4">
        <div className="space-y-3 max-w-2xl">
          <AndamioSkeleton className="h-8 w-3/4" />
          <AndamioSkeleton className="h-4 w-full" />
          <AndamioSkeleton className="h-4 w-full" />
          <AndamioSkeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Card Loading - Skeleton inside a card
// =============================================================================

export interface AndamioCardLoadingProps {
  /** Card title to show while loading */
  title: string;
  /** Number of skeleton lines in content */
  lines?: number;
  /** Show action button skeleton */
  showAction?: boolean;
  /** Additional className */
  className?: string;
}

export function AndamioCardLoading({
  title,
  lines = 3,
  showAction = false,
  className,
}: AndamioCardLoadingProps) {
  return (
    <AndamioCard className={className}>
      <AndamioCardHeader className="flex flex-row items-center justify-between">
        <AndamioCardTitle className="text-lg">{title}</AndamioCardTitle>
        {showAction && <AndamioSkeleton className="h-8 w-20 rounded" />}
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <AndamioSkeleton
            key={i}
            className={cn(
              "h-4",
              i === lines - 1 ? "w-2/3" : "w-full"
            )}
          />
        ))}
      </AndamioCardContent>
    </AndamioCard>
  );
}

// =============================================================================
// List Loading - Skeleton list items
// =============================================================================

export interface AndamioListLoadingProps {
  /** Number of skeleton items */
  count?: number;
  /** Show icon placeholder */
  showIcon?: boolean;
  /** Show status badge placeholder */
  showBadge?: boolean;
  /** Additional className for container */
  className?: string;
}

export function AndamioListLoading({
  count = 5,
  showIcon = true,
  showBadge = false,
  className,
}: AndamioListLoadingProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-sm border bg-muted/20"
        >
          {showIcon && (
            <AndamioSkeleton className="h-8 w-8 rounded-md flex-shrink-0" />
          )}
          <div className="flex-1 space-y-1.5">
            <AndamioSkeleton className="h-4 w-32" />
            <AndamioSkeleton className="h-3 w-24" />
          </div>
          {showBadge && (
            <AndamioSkeleton className="h-5 w-16 rounded-full flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Section Loading - For section within a page
// =============================================================================

export interface AndamioSectionLoadingProps {
  /** Section title to show */
  title?: string;
  /** Number of skeleton items */
  itemCount?: number;
  /** Additional className */
  className?: string;
}

export function AndamioSectionLoading({
  title,
  itemCount = 3,
  className,
}: AndamioSectionLoadingProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {title ? (
        <AndamioHeading level={3} size="lg">{title}</AndamioHeading>
      ) : (
        <AndamioSkeleton className="h-6 w-32" />
      )}
      <div className="space-y-2">
        {Array.from({ length: itemCount }).map((_, i) => (
          <AndamioSkeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Inline Loading - Minimal loading for small areas
// =============================================================================

export interface AndamioInlineLoadingProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
}

export function AndamioInlineLoading({
  size = "md",
  className,
}: AndamioInlineLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("flex items-center justify-center py-4", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-muted border-t-primary",
          sizeClasses[size]
        )}
      />
    </div>
  );
}
