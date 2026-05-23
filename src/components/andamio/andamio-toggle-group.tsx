/**
 * Andamio wrapper for shadcn/ui ToggleGroup
 *
 * Usage:
 * import { AndamioToggleGroup, AndamioToggleGroupItem } from "~/components/andamio";
 */

// Re-export with Andamio prefix
export {
  ToggleGroup as AndamioToggleGroup,
  ToggleGroupItem as AndamioToggleGroupItem,
} from "~/components/ui/toggle-group";

// This file serves as a placeholder for future Andamio-specific
// customizations to the ToggleGroup component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { ToggleGroup } from "~/components/ui/toggle-group";
// import { cn } from "~/lib/utils";
//
// export const AndamioToggleGroup = React.forwardRef<
//   React.ElementRef<typeof ToggleGroup>,
//   React.ComponentPropsWithoutRef<typeof ToggleGroup>
// >(({ className, ...props }, ref) => {
//   return (
//     <ToggleGroup
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
// AndamioToggleGroup.displayName = "AndamioToggleGroup";
