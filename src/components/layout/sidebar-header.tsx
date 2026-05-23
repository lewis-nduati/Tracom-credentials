"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch - theme is undefined on server
  useEffect(() => {
    setMounted(true);
  }, []);

  // Select logo based on theme (default to light for SSR)
  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? BRANDING.logo.horizontalDark
      : BRANDING.logo.horizontal;

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
          <span className="text-[9px] text-muted-foreground truncate leading-tight">
            {subtitle}
          </span>
        </Link>
      </div>
    );
  }

  // Default: logo variant
  return (
    <div
      className={cn(
        "flex items-center border-b border-sidebar-border px-3",
        headerHeight,
        className
      )}
    >
      <Link href={linkHref}>
        <Image
          src={logoSrc}
          alt={BRANDING.name}
          width={120}
          height={28}
          priority
          className="h-7 w-auto"
        />
      </Link>
    </div>
  );
}
