/**
 * Andamio wrapper for shadcn/ui Command
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioCommand } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioCommand } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/command";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Command component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Command } from "~/components/ui/command";
// import { cn } from "~/lib/utils";
//
// export const AndamioCommand = React.forwardRef<
//   React.ElementRef<typeof Command>,
//   React.ComponentPropsWithoutRef<typeof Command>
// >(({ className, ...props }, ref) => {
//   return (
//     <Command
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
// AndamioCommand.displayName = "AndamioCommand";
