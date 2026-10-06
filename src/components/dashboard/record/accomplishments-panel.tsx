"use client";

import React from "react";
import { AndamioRecordSection, AndamioSkeleton } from "~/components/andamio";
import { RefreshIcon } from "~/components/icons";
import { useDashboardData } from "~/contexts/dashboard-context";

/** Counts as ruled lines. Replaces StudentAccomplishments. */
export function AccomplishmentsPanel() {
  const { counts, isLoading, refetch } = useDashboardData();
  const rows: [string, number][] = [
    ["Courses enrolled", counts?.enrolledCourses ?? 0],
    ["Courses completed", counts?.completedCourses ?? 0],
    ["Credentials earned", counts?.totalCredentials ?? 0],
  ];

  return (
    <AndamioRecordSection label="Accomplishments">
      {isLoading ? (
        <AndamioSkeleton className="h-20 w-full" />
      ) : (
        <dl className="divide-y divide-border border-y border-border text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between py-2">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-serif text-lg font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <button
        type="button"
        onClick={refetch}
        className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <RefreshIcon className="h-3 w-3" /> Refresh
      </button>
    </AndamioRecordSection>
  );
}
