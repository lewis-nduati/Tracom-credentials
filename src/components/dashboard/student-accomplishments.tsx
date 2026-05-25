"use client";

import React from "react";
import Link from "next/link";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioEmptyState } from "~/components/andamio/andamio-empty-state";
import {
  RefreshIcon,
  CourseIcon,
  CredentialIcon,
  ExternalLinkIcon,
} from "~/components/icons";
import { useDashboardData } from "~/contexts/dashboard-context";

interface StudentAccomplishmentsProps {
  accessTokenAlias: string | null | undefined;
}

/**
 * Student Accomplishments Card
 *
 * Unified view of the student's learning progress using the consolidated dashboard endpoint.
 * Shows enrolled courses, completed courses, and total claimed credentials
 * in a single card powered by the shared dashboard query.
 */
export function StudentAccomplishments({ accessTokenAlias }: StudentAccomplishmentsProps) {
  const { counts, student, isLoading, error, refetch } = useDashboardData();

  if (!accessTokenAlias) {
    return null;
  }

  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardTitle>My Accomplishments</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-3">
          <AndamioSkeleton className="h-4 w-3/4" />
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <AndamioSkeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  const enrolledCount = counts?.enrolledCourses ?? 0;
  const completedCount = counts?.completedCourses ?? 0;
  const totalCredentials = counts?.totalCredentials ?? 0;
  const totalCourses = enrolledCount + completedCount;

  // Combine enrolled and completed courses for display
  const allCourses = [
    ...(student?.completedCourses ?? []).map((c) => ({
      courseId: c.courseId,
      courseTitle: c.title,
      isCompleted: true,
      credentialCount: student?.credentialsByCourse?.find((cb) => cb.courseId === c.courseId)?.credentials.length ?? 0,
    })),
    ...(student?.enrolledCourses ?? []).map((c) => ({
      courseId: c.courseId,
      courseTitle: c.title,
      isCompleted: false,
      credentialCount: 0,
    })),
  ];

  if (totalCourses === 0 || error) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <AndamioCardTitle>My Accomplishments</AndamioCardTitle>
            {!error && (
              <AndamioButton variant="ghost" size="icon-sm" onClick={refetch} aria-label="Refresh accomplishments">
                <RefreshIcon className="h-4 w-4" />
              </AndamioButton>
            )}
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioEmptyState
            icon={CourseIcon}
            title="No courses yet"
            description="Enroll in a course to earn your first on-chain credential."
            action={
              <Link href="/course">
                <AndamioButton size="sm">
                  <CourseIcon className="mr-2 h-3 w-3" />
                  Browse Courses
                </AndamioButton>
              </Link>
            }
          />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <AndamioCardTitle>My Accomplishments</AndamioCardTitle>
          <AndamioButton variant="ghost" size="icon-sm" onClick={refetch} aria-label="Refresh accomplishments">
            <RefreshIcon className="h-4 w-4" />
          </AndamioButton>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Summary line */}
        <AndamioText variant="small" className="text-muted-foreground">
          {enrolledCount} {enrolledCount === 1 ? "course" : "courses"} enrolled,{" "}
          {completedCount} completed,{" "}
          {totalCredentials} {totalCredentials === 1 ? "credential" : "credentials"} earned
        </AndamioText>

        {/* Course list */}
        <div className="space-y-1.5">
          {allCourses.slice(0, 5).map((course) => (
            <CredentialRow
              key={course.courseId}
              courseId={course.courseId}
              courseTitle={course.courseTitle}
              isCompleted={course.isCompleted}
              credentialCount={course.credentialCount}
            />
          ))}
          {allCourses.length > 5 && (
            <AndamioText variant="small" className="text-xs text-center pt-1">
              +{allCourses.length - 5} more courses
            </AndamioText>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2">
          <Link href="/course" className="block">
            <AndamioButton variant="outline" size="sm" className="w-full">
              <CourseIcon className="mr-2 h-3 w-3" />
              Browse More Courses
            </AndamioButton>
          </Link>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}

interface CredentialRowProps {
  courseId: string;
  courseTitle: string;
  isCompleted: boolean;
  credentialCount: number;
}

function CredentialRow({ courseId, courseTitle, isCompleted, credentialCount }: CredentialRowProps) {
  const label = courseTitle || `${courseId.slice(0, 16)}...`;

  return (
    <Link
      href={`/course/${courseId}`}
      className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-2 min-w-0">
        {isCompleted ? (
          <CredentialIcon className="h-3.5 w-3.5 text-primary shrink-0" />
        ) : (
          <CourseIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="text-xs truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isCompleted && credentialCount > 0 && (
          <AndamioBadge status="success" className="text-xs">
            {credentialCount} earned
          </AndamioBadge>
        )}
        {!isCompleted && (
          <AndamioBadge variant="secondary" className="text-xs">
            enrolled
          </AndamioBadge>
        )}
        <ExternalLinkIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}
