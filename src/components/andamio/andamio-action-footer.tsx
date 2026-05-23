"use client";

import * as React from "react";
import { cn } from "~/lib/utils";

export interface AndamioActionFooterProps {
  /** Content to display (typically buttons) */
  children: React.ReactNode;
  /** Alignment of children */
  align?: "start" | "end" | "between" | "center";
  /** Show top border as divider */
  showBorder?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Standardized footer for action buttons in cards/forms
 *
 * Use at the bottom of cards or forms to provide consistent button placement.
 *
 * @example Basic right-aligned buttons
 * ```tsx
 * <AndamioActionFooter>
 *   <AndamioButton variant="outline">Cancel</AndamioButton>
 *   <AndamioSaveButton onClick={handleSave} isSaving={isSaving} />
 * </AndamioActionFooter>
 * ```
 *
 * @example With border divider (inside card content)
 * ```tsx
 * <AndamioCardContent>
 *   {/* form fields *\/}
 *   <AndamioActionFooter showBorder>
 *     <AndamioButton variant="outline">Cancel</AndamioButton>
 *     <AndamioButton>Submit</AndamioButton>
 *   </AndamioActionFooter>
 * </AndamioCardContent>
 * ```
 *
 * @example Split layout (destructive left, confirm right)
 * ```tsx
 * <AndamioActionFooter align="between">
 *   <AndamioDeleteButton onConfirm={handleDelete} itemName="item" />
 *   <div className="flex gap-2">
 *     <AndamioButton variant="outline">Cancel</AndamioButton>
 *     <AndamioButton>Confirm</AndamioButton>
 *   </div>
 * </AndamioActionFooter>
 * ```
 */
export function AndamioActionFooter({
  children,
  align = "end",
  showBorder = false,
  className,
}: AndamioActionFooterProps) {
  const alignClass = {
    start: "justify-start",
    end: "justify-end",
    between: "justify-between",
    center: "justify-center",
  }[align];

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        alignClass,
        showBorder && "pt-4 border-t",
        className
      )}
    >
      {children}
    </div>
  );
}
