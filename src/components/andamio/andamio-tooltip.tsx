/**
 * Andamio wrapper for shadcn/ui Tooltip
 *
 * Re-exports all Tooltip components with consistent Andamio naming.
 *
 * Usage:
 * import { AndamioTooltip, AndamioTooltipContent } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioTooltip, AndamioTooltipContent } from "@andamio/ui";
 */

// Re-export all tooltip components with Andamio prefix
export {
  Tooltip as AndamioTooltip,
  TooltipContent as AndamioTooltipContent,
  TooltipProvider as AndamioTooltipProvider,
  TooltipTrigger as AndamioTooltipTrigger,
} from "~/components/ui/tooltip";
