/**
 * Andamio wrapper for shadcn/ui Breadcrumb
 *
 * Re-exports all Breadcrumb components with consistent Andamio naming.
 *
 * Usage:
 * import {
 *   AndamioBreadcrumb,
 *   AndamioBreadcrumbList,
 *   AndamioBreadcrumbItem,
 *   AndamioBreadcrumbLink,
 *   AndamioBreadcrumbPage,
 *   AndamioBreadcrumbSeparator,
 * } from "~/components/andamio";
 */

// Re-export all breadcrumb components with Andamio prefix
export {
  Breadcrumb as AndamioBreadcrumb,
  BreadcrumbList as AndamioBreadcrumbList,
  BreadcrumbItem as AndamioBreadcrumbItem,
  BreadcrumbLink as AndamioBreadcrumbLink,
  BreadcrumbPage as AndamioBreadcrumbPage,
  BreadcrumbSeparator as AndamioBreadcrumbSeparator,
  BreadcrumbEllipsis as AndamioBreadcrumbEllipsis,
} from "~/components/ui/breadcrumb";
