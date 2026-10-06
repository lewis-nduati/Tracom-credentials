"use client";

import React from "react";
import { AndamioLedger, AndamioLedgerRow, AndamioLedgerSkeleton, AndamioRecordSection } from "~/components/andamio";
import { useDashboardData } from "~/contexts/dashboard-context";

/** Shown only when the user contributes to a project. Replaces ContributingProjectsSummary. */
export function ContributingLedger() {
  const { projects, isLoading } = useDashboardData();
  const contributing = projects?.contributing ?? [];
  if (!isLoading && contributing.length === 0) return null;

  return (
    <AndamioRecordSection label="Contributing">
      {isLoading ? (
        <AndamioLedgerSkeleton rows={2} />
      ) : (
        <AndamioLedger label="Projects you contribute to">
          {contributing.map((p) => (
            <AndamioLedgerRow
              key={p.projectId}
              href={`/project/${p.projectId}/contributor`}
              title={p.title || `${p.projectId.slice(0, 16)}…`}
              detail={p.description || undefined}
              status="Contributor"
            />
          ))}
          <AndamioLedgerRow serif={false} href="/project" title="Browse more projects" />
        </AndamioLedger>
      )}
    </AndamioRecordSection>
  );
}
