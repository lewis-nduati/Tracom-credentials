/**
 * Andamio wrapper for shadcn/ui HoverCard
 *
 * Usage:
 * import { AndamioHoverCard, AndamioHoverCardContent } from "~/components/andamio";
 */

// Re-export with Andamio prefix
export {
  HoverCard as AndamioHoverCard,
  HoverCardContent as AndamioHoverCardContent,
  HoverCardTrigger as AndamioHoverCardTrigger,
} from "~/components/ui/hover-card";

// This file serves as a placeholder for future Andamio-specific
// customizations to the HoverCard component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { HoverCard } from "~/components/ui/hover-card";
// import { cn } from "~/lib/utils";
//
// export const AndamioHoverCard = React.forwardRef<
//   React.ElementRef<typeof HoverCard>,
//   React.ComponentPropsWithoutRef<typeof HoverCard>
// >(({ className, ...props }, ref) => {
//   return (
//     <HoverCard
//       ref={ref}
//       className={cn(
//         // Add Andamio-specific default classes here
//         className
//       )}
//       {...props}
//     />
//   );
// });
//
// AndamioHoverCard.displayName = "AndamioHoverCard";
