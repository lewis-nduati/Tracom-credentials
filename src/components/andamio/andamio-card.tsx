/**
 * Andamio wrapper for shadcn/ui Card
 *
 * Enhanced card component with Andamio-specific features:
 * - Consistent styling and spacing
 * - Support for hover effects (hover-lift, hover-glow)
 * - Standard transitions
 *
 * Usage:
 * import { AndamioCard, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio";
 */

import * as React from "react";
import * as CardPrimitives from "~/components/ui/card";
import { cn } from "~/lib/utils";

export interface AndamioCardProps extends React.ComponentPropsWithoutRef<typeof CardPrimitives.Card> {
  /**
   * Whether to apply subtle hover effects (lift + glow).
   * Perfect for clickable cards or dashboard summaries.
   */
  hoverable?: boolean;
}

export const AndamioCard = React.forwardRef<HTMLDivElement, AndamioCardProps>(
  ({ className, hoverable, ...props }, ref) => (
    <CardPrimitives.Card
      ref={ref}
      className={cn(
        "transition-standard",
        hoverable && "hover-lift hover-glow cursor-pointer border-primary/20 hover:border-primary/40",
        className
      )}
      {...props}
    />
  )
);
AndamioCard.displayName = "AndamioCard";

export const AndamioCardHeader = CardPrimitives.CardHeader;
export const AndamioCardFooter = CardPrimitives.CardFooter;
export const AndamioCardTitle = CardPrimitives.CardTitle;
export const AndamioCardDescription = CardPrimitives.CardDescription;
export const AndamioCardContent = CardPrimitives.CardContent;
export const AndamioCardAction = CardPrimitives.CardAction;
