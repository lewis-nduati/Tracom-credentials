"use client";

import React, { useState, useCallback } from "react";
import { AuthStatusBar } from "./auth-status-bar";
import { AppSidebar } from "./app-sidebar";
import {
  StudioHeader,
  StudioHeaderContext,
  type StudioHeaderContextValue,
} from "./studio-header";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface StudioLayoutProps {
  children: React.ReactNode;
  /** Initial breadcrumbs (can be updated by child pages) */
  initialBreadcrumbs?: BreadcrumbItem[];
  /** Initial title (can be updated by child pages) */
  initialTitle?: string;
  /** Initial status (can be updated by child pages) */
  initialStatus?: string;
  /** Initial status variant */
  initialStatusVariant?: "default" | "secondary" | "destructive" | "outline";
  /** Initial actions (can be updated by child pages) */
  initialActions?: React.ReactNode;
}

/**
 * Focused full-screen layout for studio/content creation
 *
 * Structure (unified app shell):
 * - AuthStatusBar at top (same as main app)
 * - AppSidebar on left (SAME navigation as main app - unified shell)
 * - Full-height content area with StudioHeader for context
 *
 * Features:
 * - Unified navigation shell - sidebar never changes across app
 * - StudioHeader provides context (breadcrumbs, actions)
 * - Context provider allows child pages to update header
 * - Responsive: sidebar hidden on mobile
 * - Full-height content for editor panels
 * - Pages control their own centering/max-width
 */
export function StudioLayout({
  children,
  initialBreadcrumbs,
  initialTitle,
  initialStatus,
  initialStatusVariant = "secondary",
  initialActions,
}: StudioLayoutProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[] | undefined>(
    initialBreadcrumbs
  );
  const [title, setTitle] = useState<string | undefined>(initialTitle);
  const [status, setStatusState] = useState<string | undefined>(initialStatus);
  const [statusVariant, setStatusVariant] = useState<
    "default" | "secondary" | "destructive" | "outline"
  >(initialStatusVariant);
  const [actions, setActions] = useState<React.ReactNode>(initialActions);

  const setStatus = useCallback(
    (
      newStatus: string,
      variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
    ) => {
      setStatusState(newStatus);
      setStatusVariant(variant);
    },
    []
  );

  const contextValue: StudioHeaderContextValue = {
    setBreadcrumbs,
    setTitle,
    setStatus,
    setActions,
  };

  return (
    <StudioHeaderContext.Provider value={contextValue}>
      <div className="flex h-screen w-full flex-col overflow-hidden overscroll-none bg-background">
        {/* Status Bar - Same as main app */}
        <AuthStatusBar />

        {/* Main Container */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* App Sidebar - Unified navigation shell (same as main app) */}
          <div className="hidden md:flex md:flex-shrink-0">
            <AppSidebar />
          </div>

          {/* Content Area - Full height for editor panels */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Studio Header - Breadcrumbs, title, actions */}
            <StudioHeader
              breadcrumbs={breadcrumbs}
              title={title}
              status={status}
              statusVariant={statusVariant}
              actions={actions}
            />

            {/* Main Content - Full height, pages control their own layout */}
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        </div>
      </div>
    </StudioHeaderContext.Provider>
  );
}
