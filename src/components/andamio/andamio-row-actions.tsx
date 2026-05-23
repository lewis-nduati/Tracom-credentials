"use client";

import * as React from "react";
import { AndamioEditButton } from "./andamio-edit-button";
import { AndamioDeleteButton } from "./andamio-delete-button";

export interface AndamioRowActionsProps {
  /** Edit URL (optional - if not provided, no edit button) */
  editHref?: string;
  /** Delete confirmation handler (optional - if not provided, no delete button) */
  onDelete?: () => void | Promise<void>;
  /** Name of the item being deleted (for confirmation message) */
  itemName?: string;
  /** Custom delete dialog title */
  deleteTitle?: string;
  /** Custom delete dialog description */
  deleteDescription?: string;
  /** Loading state for delete operation */
  isDeleting?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Optional className for the container */
  className?: string;
}

/**
 * AndamioRowActions - Standardized action buttons for table rows
 *
 * Combines Edit and Delete buttons with consistent styling and spacing.
 * Commonly used in table cells for CRUD operations.
 *
 * @example
 * // Both edit and delete
 * <AndamioRowActions
 *   editHref={`/items/${id}/edit`}
 *   onDelete={() => handleDelete(id)}
 *   itemName="task"
 *   isDeleting={deletingId === id}
 * />
 *
 * @example
 * // Edit only
 * <AndamioRowActions editHref={`/items/${id}/edit`} />
 *
 * @example
 * // Delete only
 * <AndamioRowActions
 *   onDelete={() => handleDelete(id)}
 *   itemName="module"
 * />
 */
function AndamioRowActions({
  editHref,
  onDelete,
  itemName = "item",
  deleteTitle,
  deleteDescription,
  isDeleting = false,
  disabled = false,
  className,
}: AndamioRowActionsProps) {
  // Don't render anything if no actions provided
  if (!editHref && !onDelete) {
    return null;
  }

  return (
    <div className={`flex justify-end gap-1 ${className ?? ""}`}>
      {editHref && (
        <AndamioEditButton href={editHref} disabled={disabled} />
      )}
      {onDelete && (
        <AndamioDeleteButton
          onConfirm={onDelete}
          itemName={itemName}
          title={deleteTitle}
          description={deleteDescription}
          isLoading={isDeleting}
          disabled={disabled || isDeleting}
        />
      )}
    </div>
  );
}

export { AndamioRowActions };
