import * as React from "react";
import { cn } from "~/lib/utils";

interface AndamioTableContainerProps {
  /**
   * Table content (AndamioTable component)
   */
  children: React.ReactNode;
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * AndamioTableContainer - Responsive table wrapper component
 *
 * Wraps table components with proper responsive behavior including
 * horizontal scrolling on mobile devices. Use this instead of
 * raw `<div className="border rounded-md">` wrappers.
 *
 * @example
 * ```tsx
 * <AndamioTableContainer>
 *   <AndamioTable>
 *     <AndamioTableHeader>...</AndamioTableHeader>
 *     <AndamioTableBody>...</AndamioTableBody>
 *   </AndamioTable>
 * </AndamioTableContainer>
 * ```
 */
export function AndamioTableContainer({
  children,
  className,
}: AndamioTableContainerProps) {
  return (
    <div className={cn("border rounded-md overflow-x-auto", className)}>
      {children}
    </div>
  );
}
