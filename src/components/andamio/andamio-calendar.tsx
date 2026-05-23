/**
 * Andamio wrapper for shadcn/ui Calendar
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioCalendar } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioCalendar } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/calendar";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Calendar component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Calendar } from "~/components/ui/calendar";
// import { cn } from "~/lib/utils";
//
// export const AndamioCalendar = React.forwardRef<
//   React.ElementRef<typeof Calendar>,
//   React.ComponentPropsWithoutRef<typeof Calendar>
// >(({ className, ...props }, ref) => {
//   return (
//     <Calendar
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
// AndamioCalendar.displayName = "AndamioCalendar";
