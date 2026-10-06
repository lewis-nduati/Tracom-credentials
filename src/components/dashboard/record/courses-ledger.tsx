"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  AndamioButton,
  AndamioErrorAlert,
  AndamioLedger,
  AndamioLedgerEmpty,
  AndamioLedgerRow,
  AndamioLedgerSkeleton,
  AndamioRecordSection,
} from "~/components/andamio";
import { useDashboardData } from "~/contexts/dashboard-context";
import { getCoursePaths } from "~/lib/course-path";

/** Every enrolled and completed course with its status. Replaces MyLearning and OnChainStatus. */
export function CoursesLedger() {
  const { student, isLoading, error } = useDashboardData();
  const paths = useMemo(() => (student ? getCoursePaths(student) : []), [student]);

  return (
    <AndamioRecordSection label="Courses">
      {isLoading ? (
        <AndamioLedgerSkeleton />
      ) : error ? (
        <AndamioErrorAlert error={error.message} />
      ) : paths.length === 0 ? (
        <AndamioLedgerEmpty
          action={
            <Link href="/course">
              <AndamioButton size="sm">Browse courses</AndamioButton>
            </Link>
          }
        >
          You are not enrolled in a course yet.
        </AndamioLedgerEmpty>
      ) : (
        <AndamioLedger label="Your courses">
          {paths.map((p) => (
            <AndamioLedgerRow
              key={p.courseId}
              href={`/course/${p.courseId}`}
              title={p.title}
              detail={
                p.credentialCount > 0
                  ? `${p.credentialCount} ${p.credentialCount === 1 ? "credential" : "credentials"} on record`
                  : undefined
              }
              status={
                <span
                  className={
                    p.status === "ready_to_claim" || p.status === "revision_requested" ? "text-primary" : undefined
                  }
                >
                  {p.status === "ready_to_claim" && p.claimableCount > 1
                    ? `${p.claimableCount} credentials ready to claim`
                    : p.statusLabel}
                </span>
              }
            />
          ))}
        </AndamioLedger>
      )}
    </AndamioRecordSection>
  );
}
