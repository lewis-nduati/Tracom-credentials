"use client";

import React from "react";
import { AppSidebar } from "./app-sidebar";
import { AuthStatusBar } from "./auth-status-bar";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Professional full-screen app layout with responsive design
 * - Mobile: Hamburger menu in status bar, full-width content
 * - Desktop (md+): Sidebar on left, content on right
 * - Minimal status bar at top
 * - Spacious main content area with refined padding
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="bg-background flex h-screen w-full flex-col overflow-hidden overscroll-none">
      {/* Status Bar - Minimal height */}
      <AuthStatusBar />

      {/* Main Container */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile, visible on desktop (md+) */}
        <div className="hidden md:flex md:flex-shrink-0">
          <AppSidebar />
        </div>

        {/* Content Area - Scrollable, full width on mobile */}
        <main className="bg-muted/30 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 has-[.full-bleed]:h-full has-[.full-bleed]:max-w-none has-[.full-bleed]:p-0 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
