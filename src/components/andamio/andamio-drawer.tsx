/**
 * Andamio wrapper for shadcn/ui Drawer
 *
 * Re-exports all Drawer components with consistent Andamio naming.
 *
 * Usage:
 * import { AndamioDrawer, AndamioDrawerContent } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioDrawer, AndamioDrawerContent } from "@andamio/ui";
 */

// Re-export all drawer components with Andamio prefix
export {
  Drawer as AndamioDrawer,
  DrawerClose as AndamioDrawerClose,
  DrawerContent as AndamioDrawerContent,
  DrawerDescription as AndamioDrawerDescription,
  DrawerFooter as AndamioDrawerFooter,
  DrawerHeader as AndamioDrawerHeader,
  DrawerOverlay as AndamioDrawerOverlay,
  DrawerPortal as AndamioDrawerPortal,
  DrawerTitle as AndamioDrawerTitle,
  DrawerTrigger as AndamioDrawerTrigger,
} from "~/components/ui/drawer";
