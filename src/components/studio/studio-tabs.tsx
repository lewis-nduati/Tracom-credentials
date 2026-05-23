"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  AndamioTabs,
  AndamioTabsContent,
  AndamioTabsList,
  AndamioTabsTrigger,
} from "~/components/andamio/andamio-tabs";
import type { TabItem, IconComponent } from "~/types/ui";

// Re-export types for consumers of this component
export type { IconComponent, TabItem as StudioTab };

interface StudioTabsProps {
  /** Array of tab definitions */
  tabs: TabItem[];
  /** Default tab to show (defaults to first tab) */
  defaultValue?: string;
  /** Whether to persist tab state in URL (default: true) */
  persistInUrl?: boolean;
  /** URL parameter name for tab state (default: "tab") */
  urlParam?: string;
  /** Additional className for the tabs container */
  className?: string;
}

/**
 * Reusable tabbed interface component for studio pages.
 *
 * Features:
 * - Consistent 4-column grid layout
 * - Responsive: icons only on mobile, icons + labels on desktop
 * - URL-based tab persistence for shareable links
 * - Type-safe tab definitions
 *
 * @example
 * ```tsx
 * <StudioTabs
 *   tabs={[
 *     { value: "details", icon: FileText, label: "Details", content: <DetailsTab /> },
 *     { value: "content", icon: BookOpen, label: "Content", content: <ContentTab /> },
 *   ]}
 *   defaultValue="details"
 * />
 * ```
 */
export function StudioTabs({
  tabs,
  defaultValue,
  persistInUrl = true,
  urlParam = "tab",
  className,
}: StudioTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial tab from URL or default
  const urlTab = searchParams.get(urlParam);
  const initialTab = urlTab && tabs.some((t) => t.value === urlTab)
    ? urlTab
    : defaultValue ?? tabs[0]?.value ?? "";

  const handleTabChange = (value: string) => {
    if (!persistInUrl) return;

    // Update URL without navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set(urlParam, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Calculate grid columns based on number of tabs
  const gridCols = tabs.length <= 2
    ? "grid-cols-2"
    : tabs.length === 3
      ? "grid-cols-3"
      : tabs.length === 4
        ? "grid-cols-4"
        : tabs.length === 5
          ? "grid-cols-5"
          : "grid-cols-6";

  return (
    <AndamioTabs
      defaultValue={initialTab}
      onValueChange={handleTabChange}
      className={className ?? "w-full"}
    >
      <AndamioTabsList className={`grid w-full ${gridCols}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <AndamioTabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </AndamioTabsTrigger>
          );
        })}
      </AndamioTabsList>

      {tabs.map((tab) => (
        <AndamioTabsContent
          key={tab.value}
          value={tab.value}
          className="mt-6"
        >
          {tab.content}
        </AndamioTabsContent>
      ))}
    </AndamioTabs>
  );
}
