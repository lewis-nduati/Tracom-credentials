/**
 * Andamio wrapper for shadcn/ui InputOtp
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioInputOtp } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioInputOtp } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/input-otp";

// This file serves as a placeholder for future Andamio-specific
// customizations to the InputOtp component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { InputOtp } from "~/components/ui/input-otp";
// import { cn } from "~/lib/utils";
//
// export const AndamioInputOtp = React.forwardRef<
//   React.ElementRef<typeof InputOtp>,
//   React.ComponentPropsWithoutRef<typeof InputOtp>
// >(({ className, ...props }, ref) => {
//   return (
//     <InputOtp
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
// AndamioInputOtp.displayName = "AndamioInputOtp";
