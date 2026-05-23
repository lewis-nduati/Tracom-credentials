import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

/**
 * AndamioHeading - Standardized heading component for consistent typography
 *
 * Decouples semantic level (h1-h6) from visual size for flexible, accessible headings.
 * Includes sensible defaults: tracking-tight, font-bold, leading-none.
 *
 * @example
 * ```tsx
 * <AndamioHeading level={1}>Page Title</AndamioHeading>
 * <AndamioHeading level={2} size="xl">Section Header</AndamioHeading>
 * <AndamioHeading level={3} size="lg" className="text-muted-foreground">Subsection</AndamioHeading>
 * ```
 */

const headingVariants = cva(
  "m-0 font-bold tracking-tight leading-tight text-foreground",
  {
    variants: {
      size: {
        "5xl": "text-3xl sm:text-4xl md:text-5xl mb-4",
        "4xl": "text-2xl sm:text-3xl md:text-4xl",
        "3xl": "text-3xl sm:text-4xl",
        "2xl": "text-2xl sm:text-3xl",
        xl: "text-xl sm:text-2xl",
        lg: "text-lg sm:text-xl",
        base: "text-base sm:text-lg",
      },
    },
    defaultVariants: {
      size: "2xl",
    },
  },
);

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface AndamioHeadingProps
  extends
    React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  /**
   * Semantic heading level (h1-h6)
   * @default 2
   */
  level?: HeadingLevel;
}

const AndamioHeading = React.forwardRef<
  HTMLHeadingElement,
  AndamioHeadingProps
>(({ className, level = 2, size, ...props }, ref) => {
  const Component = `h${level}` as const;

  return (
    <Component
      ref={ref}
      className={cn(headingVariants({ size }), className)}
      {...props}
    />
  );
});

AndamioHeading.displayName = "AndamioHeading";

export { AndamioHeading, headingVariants };
