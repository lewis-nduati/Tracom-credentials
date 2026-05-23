/**
 * Andamio wrapper for shadcn/ui Menubar
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioMenubar } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioMenubar } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/menubar";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Menubar component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Menubar } from "~/components/ui/menubar";
// import { cn } from "~/lib/utils";
//
// export const AndamioMenubar = React.forwardRef<
//   React.ElementRef<typeof Menubar>,
//   React.ComponentPropsWithoutRef<typeof Menubar>
// >(({ className, ...props }, ref) => {
//   return (
//     <Menubar
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
// AndamioMenubar.displayName = "AndamioMenubar";
