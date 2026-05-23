/**
 * Andamio wrapper for shadcn/ui Popover
 *
 * Usage:
 * import { AndamioPopover, AndamioPopoverContent } from "~/components/andamio";
 */

// Re-export base components (for backwards compatibility)
export * from "~/components/ui/popover";

// Re-export with Andamio prefix
export {
  Popover as AndamioPopover,
  PopoverAnchor as AndamioPopoverAnchor,
  PopoverContent as AndamioPopoverContent,
  PopoverTrigger as AndamioPopoverTrigger,
} from "~/components/ui/popover";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Popover component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Popover } from "~/components/ui/popover";
// import { cn } from "~/lib/utils";
//
// export const AndamioPopover = React.forwardRef<
//   React.ElementRef<typeof Popover>,
//   React.ComponentPropsWithoutRef<typeof Popover>
// >(({ className, ...props }, ref) => {
//   return (
//     <Popover
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
// AndamioPopover.displayName = "AndamioPopover";
