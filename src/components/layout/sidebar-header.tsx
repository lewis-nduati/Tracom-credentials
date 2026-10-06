import React from "react";
import Link from "next/link";
import { ModuleIcon } from "~/components/icons";
import { BRANDING, SIDEBAR_LAYOUT } from "~/config";
import { cn } from "~/lib/utils";

interface SidebarHeaderProps {
  /**
   * Header variant:
   * - "logo": Shows the horizontal brand logo image
   * - "studio": Shows ModuleIcon badge with text
   */
  variant?: "logo" | "studio";

  /**
   * Subtitle text (used with "studio" variant).
   * Defaults to "Studio".
   */
  subtitle?: string;

  /**
   * Link destination when clicking the header.
   * Defaults to "/" for logo variant, "/dashboard" for studio.
   */
  href?: string;

  /**
   * Additional class names for the container.
   */
  className?: string;
}

/**
 * Consistent sidebar header component.
 *
 * Supports two variants:
 * - "logo" (default): Displays the brand logo image, theme-aware
 * - "studio": Displays a ModuleIcon badge with app name and subtitle
 */
export function SidebarHeader({
  variant = "logo",
  subtitle = "Studio",
  href,
  className,
}: SidebarHeaderProps) {
  const linkHref = href ?? (variant === "logo" ? "/" : "/dashboard");
  const headerHeight =
    variant === "logo"
      ? SIDEBAR_LAYOUT.headerHeight
      : SIDEBAR_LAYOUT.compactHeaderHeight;

  if (variant === "studio") {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 border-b border-sidebar-border px-3",
          headerHeight,
          className
        )}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground flex-shrink-0">
          <ModuleIcon className="h-3.5 w-3.5" />
        </div>
        <Link href={linkHref} className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-sidebar-foreground truncate">
            {BRANDING.name}
          </span>
          <span className="text-[9px] text-sidebar-foreground/50 truncate leading-tight">
            {subtitle}
          </span>
        </Link>
      </div>
    );
  }

  // Default: serif wordmark
  return (
    <div className={cn("flex items-center border-b border-sidebar-border px-4", headerHeight, className)}>
      <Link
        href={linkHref}
        className="flex flex-col leading-none outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <span className="font-serif text-xl font-medium text-sidebar-foreground">Tracom</span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">
          Credentials
        </span>
      </Link>
    </div>
  );
}
