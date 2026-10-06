import * as React from "react";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { AndamioSkeleton } from "./andamio-skeleton";
import { AndamioText } from "./andamio-text";

/**
 * Ruled list for records: rows separated by hairlines, no box.
 * On phones each row stacks (title, detail, status); from 640px the status
 * sits on the right.
 */
export function AndamioLedger({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <ul role="list" aria-label={label} className="divide-y divide-border border-y border-border">
      {children}
    </ul>
  );
}

export interface AndamioLedgerRowProps {
  title: React.ReactNode;
  detail?: React.ReactNode;
  status?: React.ReactNode;
  /** Makes the whole row a link. */
  href?: string;
  /** Serif title for names of courses, credentials, people. Default true. */
  serif?: boolean;
}

export function AndamioLedgerRow({ title, detail, status, href, serif = true }: AndamioLedgerRowProps) {
  const body = (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className={cn("truncate text-base text-foreground", serif ? "font-serif font-medium" : "font-medium")}>
          {title}
        </div>
        {detail && <div className="line-clamp-1 text-sm text-muted-foreground">{detail}</div>}
      </div>
      {status && <div className="shrink-0 text-sm font-medium text-foreground">{status}</div>}
    </div>
  );

  return (
    <li>
      {href ? (
        <Link
          href={href}
          className="-mx-2 block min-h-11 rounded-sm px-2 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}

/** Empty ledger: a sentence in the rows' place, plus an optional action. */
export function AndamioLedgerEmpty({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
      <AndamioText variant="small">{children}</AndamioText>
      {action}
    </div>
  );
}

/** Loading ledger: ruled skeleton rows. */
export function AndamioLedgerSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border border-y border-border" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-6 py-3.5">
          <AndamioSkeleton className="h-4 w-1/2" />
          <AndamioSkeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
