"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NextIcon } from "~/components/icons";
import { AndamioBadge } from "~/components/andamio/andamio-badge";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface StudioHeaderProps {
  /** Breadcrumb items to display */
  breadcrumbs?: BreadcrumbItem[];
  /** Title to display (optional, shown when no breadcrumbs) */
  title?: string;
  /** Status badge to display next to title */
  status?: string;
  /** Status variant for badge styling */
  statusVariant?: "default" | "secondary" | "destructive" | "outline";
  /** Action buttons to display on the right */
  actions?: React.ReactNode;
}

/**
 * Compact header for studio pages
 * - Left: Breadcrumb trail
 * - Right: Action buttons
 * - Height: 44px fixed
 */
export function StudioHeader({
  breadcrumbs,
  title,
  status,
  statusVariant = "secondary",
  actions,
}: StudioHeaderProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const displayBreadcrumbs = breadcrumbs ?? generateBreadcrumbs(pathname);

  return (
    <header className="h-11 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
      <div className="h-full px-4">
        <div className="flex h-full items-center justify-between gap-4">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {displayBreadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                {displayBreadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <NextIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="text-[15px] text-muted-foreground hover:text-foreground truncate max-w-[150px] sm:max-w-[200px]"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-[15px] font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px]">
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Title + Status (if no breadcrumbs) */}
            {title && displayBreadcrumbs.length === 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {title}
                </span>
                {status && (
                  <AndamioBadge variant={statusVariant} className="text-[10px] h-5">
                    {status}
                  </AndamioBadge>
                )}
              </div>
            )}
          </div>

          {/* Right: Actions */}
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Generate breadcrumbs from pathname
 * /studio/course → [{ label: "Course Studio" }]
 * /studio/course/abc123 → [{ label: "Course Studio", href: "/studio/course" }, { label: "Course" }]
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Build breadcrumbs based on path structure
  if (segments[0] === "studio") {
    if (segments[1] === "course") {
      if (segments.length === 2) {
        // /studio/course - redirects to /studio
        breadcrumbs.push({ label: "Studio" });
      } else if (segments.length === 3) {
        // /studio/course/[coursenft]
        breadcrumbs.push({ label: "Studio", href: "/studio" });
        breadcrumbs.push({ label: "Course" });
      } else if (segments.length >= 4) {
        // /studio/course/[coursenft]/[something] or deeper
        breadcrumbs.push({ label: "Studio", href: "/studio" });
        breadcrumbs.push({
          label: "Course",
          href: `/studio/course/${segments[2]}`,
        });
        // Determine label based on the route segment
        const subRoute = segments[3];
        if (subRoute === "teacher") {
          breadcrumbs.push({ label: "Teacher" });
        } else if (subRoute === "new") {
          breadcrumbs.push({ label: "New Credential" });
        } else {
          breadcrumbs.push({ label: "Credential" });
        }
      }
    } else if (segments[1] === "project") {
      if (segments.length === 2) {
        // /studio/project - redirects to /studio
        breadcrumbs.push({ label: "Studio" });
      } else {
        breadcrumbs.push({ label: "Studio", href: "/studio" });
        breadcrumbs.push({ label: "Project" });
      }
    } else if (segments.length === 1) {
      // /studio root
      breadcrumbs.push({ label: "Studio" });
    }
  }

  return breadcrumbs;
}

/**
 * Context-aware header that can be used to update breadcrumbs from child pages
 */
export interface StudioHeaderContextValue {
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  setTitle: (title: string) => void;
  setStatus: (status: string, variant?: StudioHeaderProps["statusVariant"]) => void;
  setActions: (actions: React.ReactNode) => void;
}

export const StudioHeaderContext = React.createContext<StudioHeaderContextValue | null>(null);

export function useStudioHeader() {
  const context = React.useContext(StudioHeaderContext);
  if (!context) {
    throw new Error("useStudioHeader must be used within StudioHeaderProvider");
  }
  return context;
}
