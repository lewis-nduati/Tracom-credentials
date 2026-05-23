/**
 * Andamio wrapper for shadcn/ui Toggle
 *
 * Re-exports Toggle component with consistent naming.
 *
 * Usage:
 * import { AndamioToggle } from "~/components/andamio";
 */

// Re-export toggle component and variants with Andamio prefix
export {
  Toggle as AndamioToggle,
  toggleVariants as andamioToggleVariants,
} from "~/components/ui/toggle";
