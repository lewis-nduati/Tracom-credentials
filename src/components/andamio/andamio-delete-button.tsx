"use client";

import * as React from "react";
import { AndamioButton } from "./andamio-button";
import { AndamioConfirmDialog } from "./andamio-confirm-dialog";
import { DeleteIcon } from "~/components/icons";

export interface AndamioDeleteButtonProps {
  /** Callback when deletion is confirmed */
  onConfirm: () => void | Promise<void>;
  /** Name of the item being deleted (for confirmation message) */
  itemName?: string;
  /** Custom dialog title */
  title?: string;
  /** Custom dialog description */
  description?: string;
  /** Loading state (during async delete) */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Optional className for the trigger button */
  className?: string;
}

/**
 * AndamioDeleteButton - Standardized delete button with confirmation
 *
 * Renders a ghost button with DeleteIcon that triggers a destructive
 * confirmation dialog before calling onConfirm.
 *
 * @example
 * // Basic usage
 * <AndamioDeleteButton
 *   onConfirm={() => handleDelete(item.id)}
 *   itemName="task"
 *   isLoading={isDeleting}
 * />
 *
 * @example
 * // Custom confirmation text
 * <AndamioDeleteButton
 *   onConfirm={handleDelete}
 *   title="Remove Module"
 *   description="This will permanently delete the module and all its lessons."
 * />
 */
function AndamioDeleteButton({
  onConfirm,
  itemName = "item",
  title,
  description,
  isLoading = false,
  disabled = false,
  className,
}: AndamioDeleteButtonProps) {
  const dialogTitle = title ?? `Delete ${itemName}?`;
  const dialogDescription =
    description ??
    `Are you sure you want to delete this ${itemName}? This action cannot be undone.`;

  return (
    <AndamioConfirmDialog
      trigger={
        <AndamioButton
          variant="ghost"
          size="sm"
          disabled={disabled || isLoading}
          className={className}
        >
          <DeleteIcon className="h-4 w-4 text-destructive" />
        </AndamioButton>
      }
      title={dialogTitle}
      description={dialogDescription}
      confirmText="Delete"
      variant="destructive"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}

export { AndamioDeleteButton };
