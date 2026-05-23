/**
 * Andamio wrapper for shadcn/ui ScrollArea
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioScrollArea } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioScrollArea } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/scroll-area";

// Alias exports for Andamio naming convention
export { ScrollArea as AndamioScrollArea, ScrollBar as AndamioScrollBar } from "~/components/ui/scroll-area";

// This file serves as a placeholder for future Andamio-specific
// customizations to the ScrollArea component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { ScrollArea } from "~/components/ui/scroll-area";
// import { cn } from "~/lib/utils";
//
// export const AndamioScrollArea = React.forwardRef<
//   React.ElementRef<typeof ScrollArea>,
//   React.ComponentPropsWithoutRef<typeof ScrollArea>
// >(({ className, ...props }, ref) => {
//   return (
//     <ScrollArea
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
// AndamioScrollArea.displayName = "AndamioScrollArea";
