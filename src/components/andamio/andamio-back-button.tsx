"use client";

import * as React from "react";
import Link from "next/link";
import { AndamioButton, type AndamioButtonProps } from "./andamio-button";
import { BackIcon } from "~/components/icons";

export interface AndamioBackButtonProps
  extends Omit<AndamioButtonProps, "variant" | "size" | "children" | "asChild"> {
  /** The URL to navigate to */
  href: string;
  /** The label text (default: "Back") */
  label?: string;
}

/**
 * AndamioBackButton - Standardized back navigation button
 *
 * Always renders as ghost variant, small size, with BackIcon.
 * Automatically wraps in a Next.js Link.
 *
 * @example
 * // Basic usage
 * <AndamioBackButton href="/courses" />
 *
 * @example
 * // With custom label
 * <AndamioBackButton href="/studio/project/abc/tasks" label="Back to Tasks" />
 */
const AndamioBackButton = React.forwardRef<HTMLButtonElement, AndamioBackButtonProps>(
  ({ href, label = "Back", className, ...props }, ref) => {
    return (
      <Link href={href}>
        <AndamioButton
          ref={ref}
          variant="ghost"
          size="sm"
          className={className}
          {...props}
        >
          <BackIcon className="h-4 w-4 mr-1" />
          {label}
        </AndamioButton>
      </Link>
    );
  }
);
AndamioBackButton.displayName = "AndamioBackButton";

export { AndamioBackButton };
