/**
 * Andamio wrapper for shadcn/ui Chart
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioChart } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioChart } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/chart";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Chart component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Chart } from "~/components/ui/chart";
// import { cn } from "~/lib/utils";
//
// export const AndamioChart = React.forwardRef<
//   React.ElementRef<typeof Chart>,
//   React.ComponentPropsWithoutRef<typeof Chart>
// >(({ className, ...props }, ref) => {
//   return (
//     <Chart
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
// AndamioChart.displayName = "AndamioChart";
