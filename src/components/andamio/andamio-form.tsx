/**
 * Andamio wrapper for shadcn/ui Form
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioForm } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioForm } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/form";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Form component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Form } from "~/components/ui/form";
// import { cn } from "~/lib/utils";
//
// export const AndamioForm = React.forwardRef<
//   React.ElementRef<typeof Form>,
//   React.ComponentPropsWithoutRef<typeof Form>
// >(({ className, ...props }, ref) => {
//   return (
//     <Form
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
// AndamioForm.displayName = "AndamioForm";
