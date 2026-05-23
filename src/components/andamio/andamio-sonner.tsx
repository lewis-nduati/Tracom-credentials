/**
 * Andamio wrapper for shadcn/ui Sonner
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioSonner } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioSonner } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/sonner";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Sonner component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Sonner } from "~/components/ui/sonner";
// import { cn } from "~/lib/utils";
//
// export const AndamioSonner = React.forwardRef<
//   React.ElementRef<typeof Sonner>,
//   React.ComponentPropsWithoutRef<typeof Sonner>
// >(({ className, ...props }, ref) => {
//   return (
//     <Sonner
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
// AndamioSonner.displayName = "AndamioSonner";
