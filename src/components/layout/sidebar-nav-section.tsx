"use client";

import React from "react";
import Link from "next/link";
import { NextIcon } from "~/components/icons";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { SIDEBAR_DESKTOP, SIDEBAR_MOBILE } from "~/config";
import { cn } from "~/lib/utils";
import type { NavSection, NavItem } from "~/types/ui";

interface SidebarNavSectionProps {
  /**
   * Navigation section to render.
   */
  section: NavSection;

  /**
   * Current pathname for active state detection.
   */
  pathname: string;

  /**
   * Styling variant:
   * - "desktop": Smaller text and icons, tighter spacing
   * - "mobile": Larger touch targets, bigger text
   */
  variant?: "desktop" | "mobile";

  /**
   * Callback when navigating (useful for closing mobile drawer).
   */
  onNavigate?: () => void;

  /**
   * Whether to show item descriptions (typically for mobile).
   */
  showDescriptions?: boolean;

  /**
   * Custom function to check if an item is active.
   * Defaults to exact match or starts with href + "/".
   */
  isItemActive?: (pathname: string, itemHref: string) => boolean;
}

/**
 * Renders a navigation section with header and items.
 *
 * Supports desktop (compact) and mobile (larger touch targets) variants.
 */
export function SidebarNavSection({
  section,
  pathname,
  variant = "desktop",
  onNavigate,
  showDescriptions = false,
  isItemActive,
}: SidebarNavSectionProps) {
  const styles = variant === "desktop" ? SIDEBAR_DESKTOP : SIDEBAR_MOBILE;
  const isMobile = variant === "mobile";

  // Default active check: exact match or prefix match
  const checkActive =
    isItemActive ??
    ((path: string, href: string) =>
      path === href || path.startsWith(href + "/"));

  return (
    <div className="space-y-0.5">
      {/* Section Header */}
      <AndamioHeading
        level={3}
        size="base"
        className={cn(
          "px-2 font-medium uppercase tracking-wider mb-1",
          styles.sectionHeaderSize,
          section.muted ? "text-muted-foreground/50" : "text-muted-foreground/70"
        )}
      >
        {section.title}
      </AndamioHeading>

      {/* Section Items */}
      {section.items.map((item) => (
        <SidebarNavItem
          key={item.href}
          item={item}
          isActive={checkActive(pathname, item.href)}
          variant={variant}
          muted={section.muted}
          showDescription={showDescriptions || isMobile}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  variant: "desktop" | "mobile";
  muted?: boolean;
  showDescription?: boolean;
  onNavigate?: () => void;
}

/**
 * Individual navigation item.
 */
function SidebarNavItem({
  item,
  isActive,
  variant,
  muted,
  showDescription,
  onNavigate,
}: SidebarNavItemProps) {
  const styles = variant === "desktop" ? SIDEBAR_DESKTOP : SIDEBAR_MOBILE;
  const Icon = item.icon;

  const content = (
    <div
      className={cn(
        "group flex items-center rounded-md transition-standard cursor-pointer select-none",
        styles.itemPadding,
        styles.fontSize,
        styles.gap,
        variant === "mobile" && "rounded-lg",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        muted && !isActive && "opacity-60"
      )}
    >
      <Icon
        className={cn(
          "flex-shrink-0",
          styles.iconSize,
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-sidebar-foreground"
        )}
      />

      {showDescription ? (
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "block truncate",
              isActive && "font-medium text-sidebar-foreground"
            )}
          >
            {item.name}
          </span>
          {item.description && (
            <span className="block text-[11px] text-muted-foreground truncate">
              {item.description}
            </span>
          )}
        </div>
      ) : (
        <span
          className={cn(
            "truncate",
            isActive && "font-medium text-sidebar-foreground",
            muted && !isActive && "font-normal"
          )}
        >
          {item.name}
        </span>
      )}

      {isActive && (
        <NextIcon
          className={cn(
            "text-muted-foreground flex-shrink-0 ml-auto",
            variant === "desktop" ? "h-3 w-3" : "h-4 w-4"
          )}
        />
      )}
    </div>
  );

  // Wrap with Link and optional onNavigate callback
  if (onNavigate) {
    return (
      <Link href={item.href} onClick={onNavigate}>
        {content}
      </Link>
    );
  }

  return <Link href={item.href}>{content}</Link>;
}

interface SidebarNavListProps {
  /**
   * Array of navigation sections to render.
   */
  sections: NavSection[];

  /**
   * Current pathname for active state detection.
   */
  pathname: string;

  /**
   * Styling variant.
   */
  variant?: "desktop" | "mobile";

  /**
   * Callback when navigating.
   */
  onNavigate?: () => void;

  /**
   * Whether to show descriptions for all items.
   */
  showDescriptions?: boolean;

  /**
   * Custom active item check function.
   */
  isItemActive?: (pathname: string, itemHref: string) => boolean;
}

/**
 * Renders multiple navigation sections with spacing.
 */
export function SidebarNavList({
  sections,
  pathname,
  variant = "desktop",
  onNavigate,
  showDescriptions,
  isItemActive,
}: SidebarNavListProps) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <SidebarNavSection
          key={section.title}
          section={section}
          pathname={pathname}
          variant={variant}
          onNavigate={onNavigate}
          showDescriptions={showDescriptions}
          isItemActive={isItemActive}
        />
      ))}
    </div>
  );
}
