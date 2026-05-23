/**
 * Andamio wrapper for shadcn/ui Avatar
 *
 * Usage:
 * import { AndamioAvatar, AndamioAvatarImage } from "~/components/andamio";
 */

// Re-export with Andamio prefix
export {
  Avatar as AndamioAvatar,
  AvatarFallback as AndamioAvatarFallback,
  AvatarImage as AndamioAvatarImage,
} from "~/components/ui/avatar";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Avatar component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Avatar } from "~/components/ui/avatar";
// import { cn } from "~/lib/utils";
//
// export const AndamioAvatar = React.forwardRef<
//   React.ElementRef<typeof Avatar>,
//   React.ComponentPropsWithoutRef<typeof Avatar>
// >(({ className, ...props }, ref) => {
//   return (
//     <Avatar
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
// AndamioAvatar.displayName = "AndamioAvatar";
