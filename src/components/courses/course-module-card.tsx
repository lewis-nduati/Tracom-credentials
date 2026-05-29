"use client";

import Link from "next/link";
import { NextIcon } from "~/components/icons";
import { AssignmentStatusBadge } from "~/components/learner/assignment-status-badge";

/**
 * SLT data for display in module card
 */
export interface ModuleSLT {
  sltText: string;
}

export interface CourseModuleCardProps {
  /** Module code identifier */
  moduleCode: string;
  /** Module title */
  title: string;
  /** Module index (1-based, shown as the leading number) */
  index: number;
  /** SLT hash (used as fallback identifier for chain_only modules) */
  sltHash?: string;
  /** List of SLTs in this module (used for the count) */
  slts: ModuleSLT[];
  /** Course NFT policy ID for link generation */
  courseId: string;
  /** Student's commitment status for this module (derived from commitments list) */
  commitmentStatus?: string | null;
}

/**
 * CourseModuleCard: one module as a clean numbered row. Number, title, and a
 * learning-target count, nothing more. The targets themselves live on the
 * module page, so the course overview stays scannable.
 */
export function CourseModuleCard({
  moduleCode,
  title,
  index,
  sltHash,
  slts,
  courseId,
  commitmentStatus,
}: CourseModuleCardProps) {
  // Link destination: moduleCode if available, otherwise sltHash for chain_only modules.
  const linkPath = moduleCode
    ? `/course/${courseId}/${moduleCode}`
    : `/course/${courseId}/${sltHash}`;
  const count = slts.length;

  return (
    <Link href={linkPath} className="group block">
      <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-4 transition-colors hover:border-primary/40 hover:bg-muted/30 sm:gap-5 sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-navy font-mono text-xs font-semibold text-white ring-1 ring-brand-gold/40">
          {String(index).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">
            {count} learning {count === 1 ? "target" : "targets"}
          </p>
        </div>
        {commitmentStatus ? (
          <AssignmentStatusBadge status={commitmentStatus} />
        ) : (
          <NextIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
        )}
      </div>
    </Link>
  );
}
