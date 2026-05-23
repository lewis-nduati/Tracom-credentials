"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "~/lib/utils";
import { AndamioText } from "./andamio-text";
import { AndamioHeading } from "./andamio-heading";

interface AndamioPageHeaderProps {
  /**
   * Page title (h1)
   */
  title: string;
  /**
   * Optional page description
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
   * Additional className for the container
   */
  className?: string;
  /**
   * Center the header text (useful for landing pages)
   */
  centered?: boolean;
  /**
   * Cover image URL — enables hero banner mode.
   * When provided, the header renders as a 220px hero banner with the image
   * as background and a gradient overlay for text readability.
   * When absent, renders the standard text-only header (backward compatible).
   */
  imageUrl?: string;
  /**
   * Alt text for the cover image (defaults to title)
   */
  imageAlt?: string;
}

/**
 * AndamioPageHeader - Responsive page header component
 *
 * Provides consistent, responsive page headers across the application.
 * Supports an optional hero banner mode with cover images.
 *
 * @example
 * ```tsx
 * // Standard text header
 * <AndamioPageHeader
 *   title="Dashboard"
 *   description="Welcome to your personalized dashboard"
 * />
 *
 * // Hero banner with cover image
 * <AndamioPageHeader
 *   title="Andamio for Project Owners"
 *   description="Learn how to create and manage projects"
 *   imageUrl={course.imageUrl}
 *   badge={<Badge>12 SLTs</Badge>}
 *   action={<Button>Preview</Button>}
 * />
 * ```
 */
export function AndamioPageHeader({
  title,
  description,
  action,
  badge,
  className,
  centered = false,
  imageUrl,
  imageAlt,
}: AndamioPageHeaderProps) {
  const [imageError, setImageError] = React.useState(false);

  // Hero banner mode: when imageUrl prop is passed (even if empty string)
  if (imageUrl !== undefined) {
    const showImage = imageUrl && !imageError;

    return (
      <div
        className={cn(
          "relative h-40 sm:h-[220px] w-full overflow-hidden rounded-lg",
          className,
        )}
      >
        {/* Image or gradient fallback */}
        {showImage ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-accent/15" />
        )}

        {/* Gradient overlay for text readability (WCAG AA: ≥4.5:1 for white text) */}
        <div
          className={cn(
            "absolute inset-0",
            showImage
              ? "bg-gradient-to-t from-black/80 via-black/40 to-black/10"
              : "bg-gradient-to-t from-black/70 via-black/40 to-black/20",
          )}
        />

        {/* Content overlay — pinned to bottom */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {/* White text for WCAG AA contrast (4.5:1) against image/gradient overlays */}
                <h1
                  className="text-lg sm:text-2xl font-bold line-clamp-1 !m-0"
                  style={{ color: "white" }}
                >
                  {title}
                </h1>
                {badge}
              </div>
              {description && (
                <p className="text-xs sm:text-sm line-clamp-2 mt-1" style={{ color: "rgba(255,255,255,0.8)" }}>
                  {description}
                </p>
              )}
            </div>
            {action && (
              <div className="shrink-0">
                {action}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Standard text-only modes (unchanged) ---

  if (centered) {
    return (
      <div className={cn("text-center max-w-3xl mx-auto space-y-2 sm:space-y-4 px-4 sm:px-0", className)}>
        <AndamioHeading level={1} size="5xl">{title}</AndamioHeading>
        {description && (
          <AndamioText variant="lead">
            {description}
          </AndamioText>
        )}
        {action && (
          <div className="pt-2 sm:pt-4">
            {action}
          </div>
        )}
      </div>
    );
  }

  if (action) {
    return (
      <div className={cn("flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4", className)}>
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <AndamioHeading level={1} size="5xl">{title}</AndamioHeading>
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

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <AndamioHeading level={1} size="5xl">{title}</AndamioHeading>
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
