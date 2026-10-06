import * as React from "react";
import Link from "next/link";
import { ForwardIcon } from "~/components/icons";

export interface AndamioNextStepProps {
  /** One sentence: what to do next. */
  title: string;
  /** Optional context line, e.g. the course name. */
  detail?: React.ReactNode;
  /** Button that takes the learner there. Omit for a status-only step. */
  action?: { label: string; href: string };
  /** Extra content inside the banner (e.g. the access-token form). */
  children?: React.ReactNode;
}

/** The navy banner holding the single next action on a record page. */
export function AndamioNextStep({ title, detail, action, children }: AndamioNextStepProps) {
  return (
    <section
      aria-label="Next step"
      className="rounded-sm bg-primary px-5 py-5 text-primary-foreground sm:px-6"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-75">Next step</div>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="font-serif text-xl font-medium leading-snug sm:text-2xl">{title}</div>
          {detail && <div className="mt-1 text-sm opacity-80">{detail}</div>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm bg-primary-foreground px-4 text-sm font-semibold text-primary outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            {action.label}
            <ForwardIcon className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children && <div className="mt-5 rounded-sm bg-card p-4 text-card-foreground sm:p-5">{children}</div>}
    </section>
  );
}
