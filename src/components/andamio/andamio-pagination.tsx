/**
 * Andamio wrapper for shadcn/ui Pagination
 *
 * Usage:
 * import { AndamioPagination, AndamioPaginationContent } from "~/components/andamio";
 */

// Re-export with Andamio prefix
export {
  Pagination as AndamioPagination,
  PaginationContent as AndamioPaginationContent,
  PaginationEllipsis as AndamioPaginationEllipsis,
  PaginationItem as AndamioPaginationItem,
  PaginationLink as AndamioPaginationLink,
  PaginationNext as AndamioPaginationNext,
  PaginationPrevious as AndamioPaginationPrevious,
} from "~/components/ui/pagination";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Pagination component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Pagination } from "~/components/ui/pagination";
// import { cn } from "~/lib/utils";
//
// export const AndamioPagination = React.forwardRef<
//   React.ElementRef<typeof Pagination>,
//   React.ComponentPropsWithoutRef<typeof Pagination>
// >(({ className, ...props }, ref) => {
//   return (
//     <Pagination
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
// AndamioPagination.displayName = "AndamioPagination";
