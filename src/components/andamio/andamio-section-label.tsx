import * as React from "react";
import { cn } from "~/lib/utils";

export interface AndamioSectionLabelProps {
  children: React.ReactNode;
  /** Rendered element. Use "h2" when the label titles a page section. */
  as?: "div" | "h2" | "h3";
  className?: string;
}

/**
 * Small-caps navy label that titles a section of a record page
 * ("Courses", "Path", "Record details").
 */
export function AndamioSectionLabel({ children, as: Tag = "div", className }: AndamioSectionLabelProps) {
  return (
    <Tag
      className={cn(
        "m-0 font-sans text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-primary",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
