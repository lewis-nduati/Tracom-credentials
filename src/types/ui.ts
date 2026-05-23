/**
 * Shared UI Types
 *
 * Common type definitions for UI components, especially those involving
 * Lucide icons and navigation patterns.
 *
 * @example
 * ```tsx
 * import type { IconComponent, NavItem } from "~/types/ui";
 *
 * const navigation: NavItem[] = [
 *   { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview" },
 * ];
 * ```
 */

import type { LucideIcon } from "~/components/icons";

/**
 * Type alias for Lucide icon components.
 * Use this instead of importing LucideIcon directly for consistency.
 */
export type IconComponent = LucideIcon;

/**
 * Navigation item for sidebar and mobile navigation.
 */
export interface NavItem {
  /** Display name shown in the navigation */
  name: string;
  /** Route path */
  href: string;
  /** Lucide icon component */
  icon: IconComponent;
  /** Optional description shown below the name */
  description?: string;
}

/**
 * Generic item with an icon, useful for feature lists, value props, etc.
 */
export interface IconListItem {
  /** Lucide icon component */
  icon: IconComponent;
  /** Title/heading text */
  title: string;
  /** Description text */
  description: string;
}

/**
 * Step item for onboarding flows and progress indicators.
 */
export interface StepItem {
  /** Unique identifier */
  id: string;
  /** Step title */
  title: string;
  /** Whether this step is completed */
  completed: boolean;
  /** Lucide icon component */
  icon: IconComponent;
  /** Optional link to navigate when clicking the step */
  link?: string;
}

/**
 * Route category for sitemap and documentation pages.
 */
export interface RouteCategory {
  /** Category name */
  category: string;
  /** Category icon */
  icon: IconComponent;
  /** Routes within this category */
  routes: RouteInfo[];
}

/**
 * Individual route information.
 */
export interface RouteInfo {
  /** Route path */
  path: string;
  /** Display label */
  label: string;
  /** Route description */
  description: string;
  /** Whether authentication is required */
  requiresAuth: boolean;
  /** Whether this is a dynamic route */
  dynamic?: boolean;
  /** Parameter names for dynamic routes */
  params?: string[];
}

/**
 * Tab definition for tabbed interfaces.
 */
export interface TabItem {
  /** Unique tab identifier */
  value: string;
  /** Tab icon */
  icon: IconComponent;
  /** Tab label */
  label: string;
  /** Tab content (React node) */
  content: React.ReactNode;
}

/**
 * Navigation section for grouped sidebar navigation.
 */
export interface NavSection {
  /** Section title (displayed as header) */
  title: string;
  /** Items in this section */
  items: NavItem[];
  /** Whether this section requires authentication to show */
  requiresAuth?: boolean;
  /** Whether to render section in a smaller/muted style (e.g., dev tools) */
  muted?: boolean;
}
