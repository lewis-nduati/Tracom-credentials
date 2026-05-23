"use client";

import * as React from "react";
import Link from "next/link";
import { AndamioButton, type AndamioButtonProps } from "./andamio-button";
import { EditIcon } from "~/components/icons";

export interface AndamioEditButtonProps
  extends Omit<AndamioButtonProps, "variant" | "size" | "children" | "asChild"> {
  /** The URL to navigate to for editing */
  href: string;
  /** Optional label (default: icon-only) */
  label?: string;
  /** Show icon only (default: true) */
  iconOnly?: boolean;
}

/**
 * AndamioEditButton - Standardized edit button
 *
 * Always renders as ghost variant, small size, with EditIcon.
 * Automatically wraps in a Next.js Link.
 *
 * @example
 * // Icon-only (default) - for table rows
 * <AndamioEditButton href={`/items/${id}/edit`} />
 *
 * @example
 * // With label
 * <AndamioEditButton href={`/items/${id}/edit`} label="Edit" iconOnly={false} />
 */
const AndamioEditButton = React.forwardRef<HTMLButtonElement, AndamioEditButtonProps>(
  ({ href, label, iconOnly = true, className, ...props }, ref) => {
    return (
      <Link href={href}>
        <AndamioButton
          ref={ref}
          variant="ghost"
          size="sm"
          className={className}
          {...props}
        >
          <EditIcon className={`h-4 w-4${!iconOnly && label ? " mr-1" : ""}`} />
          {!iconOnly && label}
        </AndamioButton>
      </Link>
    );
  }
);
AndamioEditButton.displayName = "AndamioEditButton";

export { AndamioEditButton };
