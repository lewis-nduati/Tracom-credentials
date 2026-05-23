/**
 * Andamio wrapper for shadcn/ui Button
 *
 * Enhanced button component with Andamio-specific features:
 * - Loading state support
 * - Icon support (uses base Button's gap-2 for consistent spacing)
 * - Consistent styling defaults
 *
 * Usage:
 * import { AndamioButton } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioButton } from "@andamio/ui";
 */

import * as React from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { LoadingIcon } from "~/components/icons";

// Re-export variants
export { buttonVariants } from "~/components/ui/button";

/**
 * Standard icon sizes for buttons based on button size variant.
 * Use these when rendering icons inside buttons for consistency.
 */
export const BUTTON_ICON_SIZES = {
  sm: "h-3.5 w-3.5",
  default: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

export interface AndamioButtonProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  /**
   * Show loading spinner and disable button
   */
  isLoading?: boolean;
  /**
   * Icon to display before children
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display after children
   */
  rightIcon?: React.ReactNode;
}

export const AndamioButton = React.forwardRef<
  HTMLButtonElement,
  AndamioButtonProps
>(
  (
    {
      className,
      children,
      isLoading,
      leftIcon,
      rightIcon,
      disabled,
      asChild,
      ...props
    },
    ref
  ) => {
    // Base Button already has gap-2 for icon spacing, so we don't need
    // manual margins. Just render icons and content directly.
    if (asChild && React.isValidElement(children)) {
      // Type-assert props to access nested children for asChild pattern
      const childProps = children.props as { children?: React.ReactNode };
      const content = isLoading ? (
        <>
          <LoadingIcon className="h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {leftIcon}
          {childProps.children}
          {rightIcon}
        </>
      );

      return (
        <Button
          ref={ref}
          className={cn("font-semibold", className)}
          disabled={isLoading || disabled}
          asChild
          {...props}
        >
          {React.cloneElement(children, undefined, content)}
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        className={cn("font-semibold", className)}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingIcon className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </Button>
    );
  }
);

AndamioButton.displayName = "AndamioButton";
