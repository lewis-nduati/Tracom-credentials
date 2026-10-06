"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  AndamioButton,
  AndamioLedger,
  AndamioLedgerEmpty,
  AndamioLedgerRow,
  AndamioLedgerSkeleton,
  AndamioRecordSection,
} from "~/components/andamio";
import { useDashboardData } from "~/contexts/dashboard-context";

const MAX_SHOWN = 3;

/** Prerequisite progress towards projects. Replaces ProjectUnlockProgress. */
export function ProjectsUnlocking() {
  const { projects, student, isLoading } = useDashboardData();

  const { items, qualifiedCount } = useMemo(() => {
    const claimed = new Set((student?.credentialsByCourse ?? []).flatMap((c) => c.credentials));
    const approved = new Set(
      (student?.commitments ?? [])
        .filter((c) => c.status === "ASSIGNMENT_ACCEPTED" && !claimed.has(c.sltHash))
        .map((c) => c.sltHash),
    );
    const withPrereqs = projects?.withPrerequisites ?? [];

    const rows = withPrereqs
      .filter((p) => !p.qualified && (p.prerequisites ?? []).length > 0)
      .map((p) => {
        const hashes = p.prerequisites.flatMap((x) => x.sltHashes ?? []);
        const completed = hashes.filter((h) => claimed.has(h)).length;
        const approvedUnclaimed = hashes.filter((h) => !claimed.has(h) && approved.has(h)).length;
        return {
          projectId: p.projectId,
          title: p.title || "Untitled project",
          total: hashes.length,
          completed,
          approvedUnclaimed,
        };
      })
      .filter((r) => r.total > 0 && (r.completed > 0 || r.approvedUnclaimed > 0));

    return { items: rows, qualifiedCount: withPrereqs.filter((p) => p.qualified).length };
  }, [projects?.withPrerequisites, student?.credentialsByCourse, student?.commitments]);

  if (isLoading) {
    return (
      <AndamioRecordSection label="Projects unlocking">
        <AndamioLedgerSkeleton rows={2} />
      </AndamioRecordSection>
    );
  }

  if (items.length === 0 && qualifiedCount === 0) {
    return (
      <AndamioRecordSection label="Projects unlocking">
        <AndamioLedgerEmpty
          action={
            <Link href="/project">
              <AndamioButton size="sm" variant="outline">
                Browse projects
              </AndamioButton>
            </Link>
          }
        >
          Completing course modules unlocks real project work here.
        </AndamioLedgerEmpty>
      </AndamioRecordSection>
    );
  }

  const shown = items.slice(0, MAX_SHOWN);
  const hidden = items.length - shown.length;

  return (
    <AndamioRecordSection label="Projects unlocking">
      <AndamioLedger label="Projects unlocking">
        {qualifiedCount > 0 && (
          <AndamioLedgerRow
            serif={false}
            href="/project?filter=qualified"
            title={`You qualify for ${qualifiedCount} ${qualifiedCount === 1 ? "project" : "projects"}`}
            status={<span className="text-primary">View</span>}
          />
        )}
        {shown.map((r) => (
          <AndamioLedgerRow
            key={r.projectId}
            href={`/project/${r.projectId}`}
            title={r.title}
            detail={
              r.approvedUnclaimed > 0
                ? `Claim ${r.approvedUnclaimed === 1 ? "your credential" : `${r.approvedUnclaimed} credentials`} to move closer`
                : undefined
            }
            status={`${r.completed} of ${r.total} prerequisites`}
          />
        ))}
        {hidden > 0 && (
          <AndamioLedgerRow serif={false} href="/project" title={`${hidden} more ${hidden === 1 ? "project" : "projects"}`} />
        )}
      </AndamioLedger>
    </AndamioRecordSection>
  );
}
