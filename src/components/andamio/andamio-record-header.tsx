import * as React from "react";
import { AndamioHeading } from "./andamio-heading";
import { AndamioSectionLabel } from "./andamio-section-label";

export interface AndamioRecordHeaderProps {
  /** Small-caps label above the title, e.g. "Academic record". */
  label: string;
  /** Serif title: a person's alias, a course name, a page name. */
  title: React.ReactNode;
  /** One quiet line under the title. */
  meta?: React.ReactNode;
  /** Optional actions on the right (stacked under the title on phones). */
  actions?: React.ReactNode;
}

/**
 * The heading of every record page: label, serif title, meta line, and a
 * navy rule underneath.
 */
export function AndamioRecordHeader({ label, title, meta, actions }: AndamioRecordHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b-2 border-primary pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-2">
        <AndamioSectionLabel>{label}</AndamioSectionLabel>
        <AndamioHeading level={1} size="3xl" className="break-words font-serif font-medium">
          {title}
        </AndamioHeading>
        {meta && <div className="text-sm text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
