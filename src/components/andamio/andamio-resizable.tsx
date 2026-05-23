/**
 * Andamio wrapper for shadcn/ui Resizable
 *
 * Usage:
 * import { AndamioResizablePanelGroup, AndamioResizablePanel } from "~/components/andamio";
 */

// Re-export base components (for backwards compatibility)
export * from "~/components/ui/resizable";

// Re-export with Andamio prefix
export {
  ResizableHandle as AndamioResizableHandle,
  ResizablePanel as AndamioResizablePanel,
  ResizablePanelGroup as AndamioResizablePanelGroup,
} from "~/components/ui/resizable";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Resizable component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Resizable } from "~/components/ui/resizable";
// import { cn } from "~/lib/utils";
//
// export const AndamioResizable = React.forwardRef<
//   React.ElementRef<typeof Resizable>,
//   React.ComponentPropsWithoutRef<typeof Resizable>
// >(({ className, ...props }, ref) => {
//   return (
//     <Resizable
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
// AndamioResizable.displayName = "AndamioResizable";
