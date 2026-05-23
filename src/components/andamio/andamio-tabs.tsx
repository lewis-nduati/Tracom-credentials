/**
 * Andamio wrapper for shadcn/ui Tabs
 *
 * Re-exports all Tabs components with consistent naming.
 *
 * Usage:
 * import { AndamioTabs, AndamioTabsList, AndamioTabsTrigger } from "~/components/andamio";
 */

// Re-export all tabs components with Andamio prefix
export {
  Tabs as AndamioTabs,
  TabsList as AndamioTabsList,
  TabsTrigger as AndamioTabsTrigger,
  TabsContent as AndamioTabsContent,
} from "~/components/ui/tabs";
