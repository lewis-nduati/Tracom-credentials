/**
 * Andamio wrapper for shadcn/ui DropdownMenu
 *
 * Usage:
 * import { AndamioDropdownMenu, AndamioDropdownMenuContent } from "~/components/andamio";
 */

// Re-export with Andamio prefix
export {
  DropdownMenu as AndamioDropdownMenu,
  DropdownMenuCheckboxItem as AndamioDropdownMenuCheckboxItem,
  DropdownMenuContent as AndamioDropdownMenuContent,
  DropdownMenuGroup as AndamioDropdownMenuGroup,
  DropdownMenuItem as AndamioDropdownMenuItem,
  DropdownMenuLabel as AndamioDropdownMenuLabel,
  DropdownMenuPortal as AndamioDropdownMenuPortal,
  DropdownMenuRadioGroup as AndamioDropdownMenuRadioGroup,
  DropdownMenuRadioItem as AndamioDropdownMenuRadioItem,
  DropdownMenuSeparator as AndamioDropdownMenuSeparator,
  DropdownMenuShortcut as AndamioDropdownMenuShortcut,
  DropdownMenuSub as AndamioDropdownMenuSub,
  DropdownMenuSubContent as AndamioDropdownMenuSubContent,
  DropdownMenuSubTrigger as AndamioDropdownMenuSubTrigger,
  DropdownMenuTrigger as AndamioDropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

// This file serves as a placeholder for future Andamio-specific
// customizations to the DropdownMenu component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { DropdownMenu } from "~/components/ui/dropdown-menu";
// import { cn } from "~/lib/utils";
//
// export const AndamioDropdownMenu = React.forwardRef<
//   React.ElementRef<typeof DropdownMenu>,
//   React.ComponentPropsWithoutRef<typeof DropdownMenu>
// >(({ className, ...props }, ref) => {
//   return (
//     <DropdownMenu
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
// AndamioDropdownMenu.displayName = "AndamioDropdownMenu";
