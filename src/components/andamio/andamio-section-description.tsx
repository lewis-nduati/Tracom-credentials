import * as React from "react";
import { cn } from "~/lib/utils";
import { AndamioText } from "./andamio-text";

interface AndamioSectionDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Andamio Section Description Component
 *
 * A centered, constrained-width paragraph component for section descriptions.
 * Provides consistent spacing and alignment across all landing pages.
 *
 * Usage:
 * <AndamioSectionDescription>
 *   Your description text here
 * </AndamioSectionDescription>
 */
export function AndamioSectionDescription({
  children,
  className,
}: AndamioSectionDescriptionProps) {
  return (
    <div className="w-full flex justify-center my-6 sm:my-10 px-4 sm:px-0">
      <AndamioText variant="lead" className={cn(
        "max-w-2xl text-center",
        className
      )}>
        {children}
      </AndamioText>
    </div>
  );
}
