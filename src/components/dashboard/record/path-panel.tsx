"use client";

import React, { useMemo } from "react";
import { AndamioPathTimeline, AndamioRecordSection, AndamioSkeleton, AndamioText } from "~/components/andamio";
import { useDashboardData } from "~/contexts/dashboard-context";
import { getCoursePaths } from "~/lib/course-path";

/** Margin: one milestone line per course (states, not dates). */
export function PathPanel() {
  const { student, isLoading } = useDashboardData();
  const paths = useMemo(() => (student ? getCoursePaths(student) : []), [student]);

  return (
    <AndamioRecordSection label="Path">
      {isLoading ? (
        <AndamioSkeleton className="h-24 w-full" />
      ) : paths.length === 0 ? (
        <AndamioText variant="small">Your path starts when you enrol in a course.</AndamioText>
      ) : (
        <div className="space-y-6">
          {paths.map((p) => (
            <div key={p.courseId} className="space-y-2">
              <div className="truncate font-serif text-base font-medium">{p.title}</div>
              <AndamioPathTimeline label={`Progress in ${p.title}`} milestones={p.milestones} />
            </div>
          ))}
        </div>
      )}
    </AndamioRecordSection>
  );
}
