/**
 * Andamio wrapper for shadcn/ui Carousel
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioCarousel } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioCarousel } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/carousel";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Carousel component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Carousel } from "~/components/ui/carousel";
// import { cn } from "~/lib/utils";
//
// export const AndamioCarousel = React.forwardRef<
//   React.ElementRef<typeof Carousel>,
//   React.ComponentPropsWithoutRef<typeof Carousel>
// >(({ className, ...props }, ref) => {
//   return (
//     <Carousel
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
// AndamioCarousel.displayName = "AndamioCarousel";
