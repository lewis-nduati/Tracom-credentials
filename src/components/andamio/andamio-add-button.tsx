"use client";

import * as React from "react";
import { AndamioButton, type AndamioButtonProps } from "./andamio-button";
import { AddIcon, LoadingIcon } from "~/components/icons";

export interface AndamioAddButtonProps extends Omit<AndamioButtonProps, "children"> {
  /** Show loading state */
  isLoading?: boolean;
  /** Compact mode for toolbars (smaller size, tighter spacing) */
  compact?: boolean;
  /** Button label (default: "Add" for compact, "Create" for full) */
  label?: string;
  /** Loading label (default: "Creating...") */
  loadingLabel?: string;
}

/**
 * AndamioAddButton - Standardized add/create button
 *
 * Use for creating new items. Includes built-in loading state.
 *
 * @example
 * // Basic usage
 * <AndamioAddButton onClick={handleCreate} isLoading={isCreating} />
 *
 * @example
 * // Compact for toolbars
 * <AndamioAddButton onClick={handleAdd} compact />
 *
 * @example
 * // Custom label
 * <AndamioAddButton onClick={handleCreate} label="Create Task" loadingLabel="Creating..." />
 */
const AndamioAddButton = React.forwardRef<HTMLButtonElement, AndamioAddButtonProps>(
  (
    {
      isLoading = false,
      compact = false,
      label,
      loadingLabel = "Creating...",
      disabled,
      size,
      ...props
    },
    ref
  ) => {
    const defaultLabel = compact ? "Add" : "Create";
    const displayLabel = label ?? defaultLabel;
    const buttonSize = size ?? (compact ? "sm" : "default");
    const iconSpacing = compact ? "mr-1" : "mr-2";

    return (
      <AndamioButton
        ref={ref}
        size={buttonSize}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <LoadingIcon className={`h-4 w-4 ${iconSpacing} animate-spin`} />
        ) : (
          <AddIcon className={`h-4 w-4 ${iconSpacing}`} />
        )}
        {isLoading ? loadingLabel : displayLabel}
      </AndamioButton>
    );
  }
);
AndamioAddButton.displayName = "AndamioAddButton";

export { AndamioAddButton };
