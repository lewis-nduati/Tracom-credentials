"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
  const pathname = usePathname();

  return (
    <div className="bg-background flex h-screen w-full flex-col overflow-hidden overscroll-none">
      {/* Skip link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:rounded focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Status Bar */}
      <AuthStatusBar />

      {/* Main Container */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile, visible on desktop (md+) */}
        <div className="hidden md:flex md:flex-shrink-0">
          <AppSidebar />
        </div>

        {/* Content Area - Scrollable, full width on mobile */}
        <main id="main-content" className="bg-muted/30 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 has-[.full-bleed]:h-full has-[.full-bleed]:max-w-none has-[.full-bleed]:p-0 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
