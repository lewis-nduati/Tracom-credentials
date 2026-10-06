import * as React from "react";

/**
 * Main column plus a margin column, like a ledger with notes in the margin.
 * Under 1024px the margin follows the main column.
 */
export function AndamioRecordLayout({ main, margin }: { main: React.ReactNode; margin: React.ReactNode }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
      <div className="min-w-0 space-y-10">{main}</div>
      <aside className="min-w-0 space-y-8 lg:border-l lg:border-border lg:pl-8">{margin}</aside>
    </div>
  );
}

/** A titled section inside either column. The label is an h2 for document structure. */
export function AndamioRecordSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="m-0 font-sans text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-primary">
        {label}
      </h2>
      {children}
    </section>
  );
}
