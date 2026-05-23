"use client";

import * as React from "react";
import { AndamioButton, type AndamioButtonProps } from "./andamio-button";
import { CloseIcon } from "~/components/icons";

export interface AndamioRemoveButtonProps
  extends Omit<AndamioButtonProps, "variant" | "size" | "children"> {
  /** Click handler for removing the item */
  onClick: () => void;
  /** Optional label (default: icon-only) */
  label?: string;
  /** Accessibility label (default: "Remove") */
  ariaLabel?: string;
}

/**
 * AndamioRemoveButton - Standardized remove/close button for list items
 *
 * Used for removing items from in-page lists (no confirmation needed).
 * For destructive database operations, use AndamioDeleteButton instead.
 *
 * @example
 * // Icon-only (default) - for list items
 * {items.length > 1 && (
 *   <AndamioRemoveButton onClick={() => removeItem(index)} />
 * )}
 *
 * @example
 * // With label
 * <AndamioRemoveButton onClick={handleClose} label="Close" />
 */
const AndamioRemoveButton = React.forwardRef<HTMLButtonElement, AndamioRemoveButtonProps>(
  ({ onClick, label, ariaLabel = "Remove", className, disabled, ...props }, ref) => {
    return (
      <AndamioButton
        ref={ref}
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={className}
        {...props}
      >
        <CloseIcon className={`h-4 w-4${label ? " mr-1" : ""}`} />
        {label}
      </AndamioButton>
    );
  }
);
AndamioRemoveButton.displayName = "AndamioRemoveButton";

export { AndamioRemoveButton };
