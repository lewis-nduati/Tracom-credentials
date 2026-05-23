/**
 * Andamio wrapper for shadcn/ui AspectRatio
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioAspectRatio } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioAspectRatio } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/aspect-ratio";

// This file serves as a placeholder for future Andamio-specific
// customizations to the AspectRatio component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { AspectRatio } from "~/components/ui/aspect-ratio";
// import { cn } from "~/lib/utils";
//
// export const AndamioAspectRatio = React.forwardRef<
//   React.ElementRef<typeof AspectRatio>,
//   React.ComponentPropsWithoutRef<typeof AspectRatio>
// >(({ className, ...props }, ref) => {
//   return (
//     <AspectRatio
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
// AndamioAspectRatio.displayName = "AndamioAspectRatio";
