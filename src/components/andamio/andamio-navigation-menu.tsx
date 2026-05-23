/**
 * Andamio wrapper for shadcn/ui NavigationMenu
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioNavigationMenu } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioNavigationMenu } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/navigation-menu";

// This file serves as a placeholder for future Andamio-specific
// customizations to the NavigationMenu component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { NavigationMenu } from "~/components/ui/navigation-menu";
// import { cn } from "~/lib/utils";
//
// export const AndamioNavigationMenu = React.forwardRef<
//   React.ElementRef<typeof NavigationMenu>,
//   React.ComponentPropsWithoutRef<typeof NavigationMenu>
// >(({ className, ...props }, ref) => {
//   return (
//     <NavigationMenu
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
// AndamioNavigationMenu.displayName = "AndamioNavigationMenu";
