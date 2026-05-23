"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { AndamioCardTitle } from "./andamio-card";
import { AndamioCardDescription } from "./andamio-card";
import type { IconComponent } from "~/types/ui";

export interface AndamioCardIconHeaderProps {
  /** Icon component from ~/components/icons */
  icon: IconComponent;
  /** Card title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Icon color class (defaults to text-muted-foreground) */
  iconColor?: string;
  /** Optional element rendered inline with the title (e.g. a status badge) */
  titleBadge?: React.ReactNode;
  /** HTML tag for the title element. Defaults to "div" (AndamioCardTitle's own tag). Use "h2"/"h3"/etc. when the header should participate in the page heading outline. */
  titleAs?: "h2" | "h3" | "h4" | "h5" | "h6" | "div";
  /** Additional className for the container */
  className?: string;
}

/**
 * Card header with icon and title
 *
 * Use inside AndamioCardHeader for consistent card header styling.
 *
 * @example
 * ```tsx
 * <AndamioCardHeader>
 *   <AndamioCardIconHeader
 *     icon={DatabaseIcon}
 *     title="On-Chain Data"
 *   />
 * </AndamioCardHeader>
 * ```
 *
 * @example With description
 * ```tsx
 * <AndamioCardHeader>
 *   <AndamioCardIconHeader
 *     icon={CourseIcon}
 *     title="Course Progress"
 *     description="Track your learning journey"
 *   />
 * </AndamioCardHeader>
 * ```
 */
export function AndamioCardIconHeader({
  icon: Icon,
  title,
  description,
  iconColor = "text-muted-foreground",
  titleBadge,
  titleAs = "div",
  className,
}: AndamioCardIconHeaderProps) {
  const TitleTag = titleAs;
  const titleElement =
    titleAs === "div" ? (
      <AndamioCardTitle className="text-base">{title}</AndamioCardTitle>
    ) : (
      <TitleTag className="text-base font-semibold leading-none m-0">
        {title}
      </TitleTag>
    );

  const hasBadge = titleBadge != null;
  const titleNode = hasBadge ? (
    <div className="flex items-center gap-2 flex-wrap">
      {titleElement}
      {titleBadge}
    </div>
  ) : (
    titleElement
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon className={cn("h-5 w-5 shrink-0", iconColor)} />
      {description ? (
        <div>
          {titleNode}
          <AndamioCardDescription>{description}</AndamioCardDescription>
        </div>
      ) : (
        titleNode
      )}
    </div>
  );
}
