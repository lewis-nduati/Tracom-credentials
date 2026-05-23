"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { getNavigationSections, isNavItemActive, SIDEBAR_LAYOUT } from "~/config";
import { cn } from "~/lib/utils";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNavList } from "./sidebar-nav-section";
import { SidebarUserSection } from "./sidebar-user-section";

/**
 * Main application sidebar.
 *
 * Uses centralized navigation config and shared sidebar components
 * for consistency with StudioSidebar and MobileNav.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAndamioAuth();

  // Get navigation sections filtered by auth state
  const navigationSections = getNavigationSections(isAuthenticated);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar",
        SIDEBAR_LAYOUT.width
      )}
    >
      {/* Brand Header */}
      <SidebarHeader variant="logo" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <SidebarNavList
          sections={navigationSections}
          pathname={pathname}
          variant="desktop"
          isItemActive={isNavItemActive}
        />
      </nav>

      {/* User Section */}
      <SidebarUserSection variant="compact" showDisconnect />
    </div>
  );
}
