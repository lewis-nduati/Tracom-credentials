/**
 * Andamio wrapper for shadcn/ui Sheet
 *
 * Usage:
 * import { AndamioSheet, AndamioSheetContent } from "~/components/andamio";
 */

// Re-export with Andamio prefix
export {
  Sheet as AndamioSheet,
  SheetClose as AndamioSheetClose,
  SheetContent as AndamioSheetContent,
  SheetDescription as AndamioSheetDescription,
  SheetFooter as AndamioSheetFooter,
  SheetHeader as AndamioSheetHeader,
  SheetTitle as AndamioSheetTitle,
  SheetTrigger as AndamioSheetTrigger,
} from "~/components/ui/sheet";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Sheet component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Sheet } from "~/components/ui/sheet";
// import { cn } from "~/lib/utils";
//
// export const AndamioSheet = React.forwardRef<
//   React.ElementRef<typeof Sheet>,
//   React.ComponentPropsWithoutRef<typeof Sheet>
// >(({ className, ...props }, ref) => {
//   return (
//     <Sheet
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
// AndamioSheet.displayName = "AndamioSheet";
