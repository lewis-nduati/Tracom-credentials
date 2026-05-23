/**
 * Andamio wrapper for shadcn/ui ContextMenu
 *
 * Usage:
 * import { AndamioContextMenu, AndamioContextMenuContent } from "~/components/andamio";
 */

// Re-export with Andamio prefix
export {
  ContextMenu as AndamioContextMenu,
  ContextMenuCheckboxItem as AndamioContextMenuCheckboxItem,
  ContextMenuContent as AndamioContextMenuContent,
  ContextMenuGroup as AndamioContextMenuGroup,
  ContextMenuItem as AndamioContextMenuItem,
  ContextMenuLabel as AndamioContextMenuLabel,
  ContextMenuPortal as AndamioContextMenuPortal,
  ContextMenuRadioGroup as AndamioContextMenuRadioGroup,
  ContextMenuRadioItem as AndamioContextMenuRadioItem,
  ContextMenuSeparator as AndamioContextMenuSeparator,
  ContextMenuShortcut as AndamioContextMenuShortcut,
  ContextMenuSub as AndamioContextMenuSub,
  ContextMenuSubContent as AndamioContextMenuSubContent,
  ContextMenuSubTrigger as AndamioContextMenuSubTrigger,
  ContextMenuTrigger as AndamioContextMenuTrigger,
} from "~/components/ui/context-menu";

// This file serves as a placeholder for future Andamio-specific
// customizations to the ContextMenu component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { ContextMenu } from "~/components/ui/context-menu";
// import { cn } from "~/lib/utils";
//
// export const AndamioContextMenu = React.forwardRef<
//   React.ElementRef<typeof ContextMenu>,
//   React.ComponentPropsWithoutRef<typeof ContextMenu>
// >(({ className, ...props }, ref) => {
//   return (
//     <ContextMenu
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
// AndamioContextMenu.displayName = "AndamioContextMenu";
