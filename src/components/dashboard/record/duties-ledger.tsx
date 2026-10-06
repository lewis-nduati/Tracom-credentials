"use client";

import React from "react";
import Link from "next/link";
import {
  AndamioButton,
  AndamioErrorAlert,
  AndamioLedger,
  AndamioLedgerRow,
  AndamioLedgerSkeleton,
  AndamioRecordSection,
  AndamioText,
} from "~/components/andamio";
import { useDashboardData } from "~/contexts/dashboard-context";

/**
 * Teaching and managing work. Shown only when the user teaches a course or
 * manages a project. Replaces the four studio summary cards.
 */
export function DutiesLedger() {
  const { teacher, projects, isLoading, error, refetch } = useDashboardData();

  const courses = teacher?.courses ?? [];
  const managing = projects?.managing ?? [];
  if (!isLoading && courses.length === 0 && managing.length === 0) return null;

  const reviews = [...(teacher?.pendingReviews ?? [])].filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
  const assessments = [...(projects?.pendingAssessments ?? [])]
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <AndamioRecordSection label="Duties">
      {isLoading ? (
        <AndamioLedgerSkeleton rows={4} />
      ) : error ? (
        <div className="space-y-3">
          <AndamioErrorAlert error={error.message} />
          <AndamioButton size="sm" variant="outline" onClick={refetch}>
            Try again
          </AndamioButton>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.length > 0 && (
            <div className="space-y-2">
              <AndamioText variant="small">
                {reviews.length === 0
                  ? "No assignments are waiting for review."
                  : `${teacher?.totalPendingReviews ?? 0} assignments waiting for review`}
              </AndamioText>
              <AndamioLedger label="Courses you teach">
                {reviews.map((r) => (
                  <AndamioLedgerRow
                    key={`review-${r.courseId}`}
                    href={`/studio/course/${r.courseId}/teacher`}
                    title={r.courseTitle || `${r.courseId.slice(0, 16)}…`}
                    status={<span className="text-primary">{r.count} to review</span>}
                  />
                ))}
                {courses
                  .filter((c) => !reviews.some((r) => r.courseId === c.courseId))
                  .map((c) => (
                    <AndamioLedgerRow
                      key={`course-${c.courseId}`}
                      href={`/studio/course/${c.courseId}`}
                      title={c.title || `${c.courseId.slice(0, 16)}…`}
                      status="Teaching"
                    />
                  ))}
              </AndamioLedger>
            </div>
          )}
          {managing.length > 0 && (
            <div className="space-y-2">
              <AndamioText variant="small">
                {assessments.length === 0
                  ? "No project work is waiting for assessment."
                  : `${projects?.totalPendingAssessments ?? 0} submissions waiting for assessment`}
              </AndamioText>
              <AndamioLedger label="Projects you manage">
                {assessments.map((a) => (
                  <AndamioLedgerRow
                    key={`assess-${a.projectId}`}
                    href={`/studio/project/${a.projectId}?tab=commitments`}
                    title={a.projectTitle || `${a.projectId.slice(0, 16)}…`}
                    status={<span className="text-primary">{a.count} to assess</span>}
                  />
                ))}
                {managing
                  .filter((p) => !assessments.some((a) => a.projectId === p.projectId))
                  .map((p) => (
                    <AndamioLedgerRow
                      key={`manage-${p.projectId}`}
                      href={`/studio/project/${p.projectId}`}
                      title={p.title || `${p.projectId.slice(0, 16)}…`}
                      status="Managing"
                    />
                  ))}
              </AndamioLedger>
            </div>
          )}
          <Link href="/studio" className="inline-block text-sm font-medium text-primary underline underline-offset-4">
            Open the studio
          </Link>
        </div>
      )}
    </AndamioRecordSection>
  );
}
