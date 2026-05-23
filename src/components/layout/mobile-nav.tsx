"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { MenuIcon, ModuleIcon } from "~/components/icons";
import { getNavigationSections, isNavItemActive, BRANDING } from "~/config";
import { SidebarNavList } from "./sidebar-nav-section";
import { SidebarUserSection } from "./sidebar-user-section";

/**
 * Mobile navigation drawer for small screens (< md).
 *
 * Displays as hamburger menu in status bar.
 * Uses the same centralized navigation config as AppSidebar.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAndamioAuth();
  const [open, setOpen] = useState(false);

  // Get navigation sections filtered by auth state (same as desktop)
  const navigationSections = getNavigationSections(isAuthenticated);

  const handleNavigate = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <AndamioButton
          variant="ghost"
          size="sm"
          className="text-primary-foreground/80 hover:text-primary-foreground h-10 w-10 p-0 md:hidden"
          aria-label="Open navigation menu"
        >
          <MenuIcon className="h-4 w-4" />
        </AndamioButton>
      </SheetTrigger>

      <SheetContent side="left" className="flex flex-col gap-0 p-0">
        {/* Header with branding */}
        <SheetHeader className="border-border gap-0 border-b py-4">
          <div className="flex items-center gap-3 px-4">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
              <ModuleIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <SheetTitle>{BRANDING.name}</SheetTitle>
              <span className="text-muted-foreground text-[10px]">
                {BRANDING.tagline}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNavList
            sections={navigationSections}
            pathname={pathname}
            variant="mobile"
            showDescriptions
            onNavigate={handleNavigate}
            isItemActive={isNavItemActive}
          />
        </nav>

        {/* User Section */}
        <SheetFooter className="border-border block gap-0 border-t p-0">
          <SidebarUserSection
            variant="expanded"
            showDisconnect
            onDisconnect={handleNavigate}
            className="border-t-0"
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
