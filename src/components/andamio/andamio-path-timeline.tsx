import * as React from "react";
import Link from "next/link";
import { cn } from "~/lib/utils";

export interface PathMilestone {
  id: string;
  label: string;
  done: boolean;
  /** Optional link, e.g. "Explore courses" → /course. */
  href?: string;
}

/**
 * Vertical line of milestones: filled dot when done, hollow when to come.
 * Done/not-done is also written for screen readers.
 */
export function AndamioPathTimeline({ milestones, label }: { milestones: PathMilestone[]; label?: string }) {
  return (
    <ol aria-label={label} className="relative ml-1.5 space-y-3 border-l-2 border-border pl-5">
      {milestones.map((m) => {
        const text =
          m.href && !m.done ? (
            <Link href={m.href} className="underline underline-offset-4 hover:text-primary">
              {m.label}
            </Link>
          ) : (
            m.label
          );
        return (
          <li key={m.id} className="relative text-sm">
            <span
              aria-hidden
              className={cn(
                "absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2",
                m.done ? "border-primary bg-primary" : "border-border bg-background",
              )}
            />
            <span className={m.done ? "text-foreground" : "text-muted-foreground"}>{text}</span>
            <span className="sr-only">{m.done ? " (done)" : " (to do)"}</span>
          </li>
        );
      })}
    </ol>
  );
}
