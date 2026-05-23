"use client";

import * as React from "react";
import { AndamioButton, type AndamioButtonProps } from "./andamio-button";
import { SaveIcon, LoadingIcon } from "~/components/icons";

/**
 * Standardized save button with consistent styling and loading states.
 *
 * @example
 * ```tsx
 * // Full save button
 * <AndamioSaveButton onClick={handleSave} isSaving={isPending} />
 *
 * // Compact save button (for tight spaces)
 * <AndamioSaveButton onClick={handleSave} isSaving={isPending} compact />
 *
 * // Custom labels
 * <AndamioSaveButton
 *   onClick={handleSave}
 *   isSaving={isPending}
 *   label="Save Draft"
 *   savingLabel="Saving Draft..."
 * />
 *
 * // Conditionally show only when there are unsaved changes
 * {hasUnsavedChanges && (
 *   <AndamioSaveButton onClick={handleSave} isSaving={isPending} compact />
 * )}
 * ```
 */

export interface AndamioSaveButtonProps extends Omit<AndamioButtonProps, "children"> {
  /** Whether the save operation is in progress */
  isSaving?: boolean;
  /** Use compact mode (smaller, just "Save" label) */
  compact?: boolean;
  /** Custom label for the button (default: "Save Changes" or "Save" in compact mode) */
  label?: string;
  /** Custom label shown while saving (default: "Saving...") */
  savingLabel?: string;
}

const AndamioSaveButton = React.forwardRef<HTMLButtonElement, AndamioSaveButtonProps>(
  (
    {
      isSaving = false,
      compact = false,
      label,
      savingLabel = "Saving...",
      disabled,
      size,
      ...props
    },
    ref
  ) => {
    const defaultLabel = compact ? "Save" : "Save Changes";
    const displayLabel = label ?? defaultLabel;
    const buttonSize = size ?? (compact ? "sm" : "default");
    const iconSpacing = compact ? "mr-1" : "mr-2";

    return (
      <AndamioButton
        ref={ref}
        size={buttonSize}
        disabled={disabled || isSaving}
        {...props}
      >
        {isSaving ? (
          <LoadingIcon className={`h-4 w-4 ${iconSpacing} animate-spin`} />
        ) : (
          <SaveIcon className={`h-4 w-4 ${iconSpacing}`} />
        )}
        {isSaving ? savingLabel : displayLabel}
      </AndamioButton>
    );
  }
);

AndamioSaveButton.displayName = "AndamioSaveButton";

export { AndamioSaveButton };
