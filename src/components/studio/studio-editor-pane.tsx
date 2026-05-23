"use client";

import React from "react";
import { AndamioScrollArea } from "~/components/andamio/andamio-scroll-area";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { cn } from "~/lib/utils";

interface StudioEditorPaneProps {
  children: React.ReactNode;
  /** Optional header content (sticky at top) */
  header?: React.ReactNode;
  /** Optional footer content (sticky at bottom) */
  footer?: React.ReactNode;
  /** Additional className for the content area */
  className?: string;
  /** Padding variant */
  padding?: "none" | "tight" | "normal";
}

/**
 * Dense editor pane wrapper for studio pages
 * - Reduced padding for content density
 * - Optional sticky header and footer
 * - Scrollable content area
 */
export function StudioEditorPane({
  children,
  header,
  footer,
  className,
  padding = "tight",
}: StudioEditorPaneProps) {
  const paddingClass = {
    none: "",
    tight: "p-3",
    normal: "p-4 sm:p-6",
  }[padding];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Sticky Header */}
      {header && (
        <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {header}
        </div>
      )}

      {/* Scrollable Content */}
      <AndamioScrollArea className="flex-1">
        <div className={cn(paddingClass, className)}>{children}</div>
      </AndamioScrollArea>

      {/* Sticky Footer */}
      {footer && (
        <div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * Compact form section for dense layouts
 */
interface StudioFormSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function StudioFormSection({
  children,
  title,
  description,
  className,
}: StudioFormSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {(title || description) && (
        <div className="space-y-0.5">
          {title && (
            <AndamioHeading level={3} size="base" className="text-sm leading-none">{title}</AndamioHeading>
          )}
          {description && (
            <AndamioText variant="small" className="text-xs">{description}</AndamioText>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Inline form row for putting multiple inputs side by side
 */
interface StudioFormRowProps {
  children: React.ReactNode;
  className?: string;
}

export function StudioFormRow({ children, className }: StudioFormRowProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>{children}</div>
  );
}

/**
 * Action bar for form actions (save, cancel, etc.)
 */
interface StudioActionBarProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "between";
}

export function StudioActionBar({
  children,
  className,
  align = "right",
}: StudioActionBarProps) {
  const alignClass = {
    left: "justify-start",
    right: "justify-end",
    between: "justify-between",
  }[align];

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2", alignClass, className)}>
      {children}
    </div>
  );
}
