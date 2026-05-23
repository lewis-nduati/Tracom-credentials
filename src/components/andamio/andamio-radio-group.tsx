/**
 * Andamio wrapper for shadcn/ui RadioGroup
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioRadioGroup } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioRadioGroup } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/radio-group";

// This file serves as a placeholder for future Andamio-specific
// customizations to the RadioGroup component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { RadioGroup } from "~/components/ui/radio-group";
// import { cn } from "~/lib/utils";
//
// export const AndamioRadioGroup = React.forwardRef<
//   React.ElementRef<typeof RadioGroup>,
//   React.ComponentPropsWithoutRef<typeof RadioGroup>
// >(({ className, ...props }, ref) => {
//   return (
//     <RadioGroup
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
// AndamioRadioGroup.displayName = "AndamioRadioGroup";
