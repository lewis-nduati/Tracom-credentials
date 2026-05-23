import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

/**
 * AndamioText - Standardized text component for consistent typography
 *
 * Variants:
 * - `default` - Regular body text (base size, foreground color)
 * - `muted` - Secondary descriptive text (muted-foreground)
 * - `small` - Small helper text (text-sm, muted-foreground)
 * - `lead` - Large intro/description text (text-lg, muted-foreground)
 * - `overline` - Uppercase label text (text-xs, uppercase, tracking-wider)
 *
 * @example
 * ```tsx
 * <AndamioText>Regular paragraph text</AndamioText>
 * <AndamioText variant="muted">Secondary description</AndamioText>
 * <AndamioText variant="small">Helper text or caption</AndamioText>
 * <AndamioText variant="lead">Large intro paragraph</AndamioText>
 * <AndamioText variant="overline">Category Label</AndamioText>
 * ```
 */

const textVariants = cva("", {
  variants: {
    variant: {
      default: "text-base text-foreground",
      muted: "text-base text-muted-foreground",
      small: "text-sm text-muted-foreground",
      lead: "text-lg text-muted-foreground",
      overline:
        "text-xs font-medium uppercase tracking-wider text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface AndamioTextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  /**
   * Render as a different element (span, div, etc.)
   * @default "p"
   */
  as?: "p" | "span" | "div";
}

const AndamioText = React.forwardRef<HTMLParagraphElement, AndamioTextProps>(
  ({ className, variant, as: Component = "p", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(textVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

AndamioText.displayName = "AndamioText";

export { AndamioText, textVariants };
