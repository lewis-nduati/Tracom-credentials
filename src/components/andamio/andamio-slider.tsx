/**
 * Andamio wrapper for shadcn/ui Slider
 *
 * Usage:
 * import { AndamioSlider } from "~/components/andamio";
 */

// Re-export with Andamio prefix
export { Slider as AndamioSlider } from "~/components/ui/slider";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Slider component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Slider } from "~/components/ui/slider";
// import { cn } from "~/lib/utils";
//
// export const AndamioSlider = React.forwardRef<
//   React.ElementRef<typeof Slider>,
//   React.ComponentPropsWithoutRef<typeof Slider>
// >(({ className, ...props }, ref) => {
//   return (
//     <Slider
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
// AndamioSlider.displayName = "AndamioSlider";
