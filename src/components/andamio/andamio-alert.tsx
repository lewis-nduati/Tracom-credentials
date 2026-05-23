/**
 * Andamio wrapper for shadcn/ui Alert
 *
 * Re-exports all Alert components with consistent naming.
 *
 * Usage:
 * import { AndamioAlert, AndamioAlertTitle, AndamioAlertDescription } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioAlert, AndamioAlertTitle, AndamioAlertDescription } from "@andamio/ui";
 */

// Re-export all alert components with Andamio prefix
export {
  Alert as AndamioAlert,
  AlertTitle as AndamioAlertTitle,
  AlertDescription as AndamioAlertDescription,
} from "~/components/ui/alert";
