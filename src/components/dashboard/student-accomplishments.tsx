"use client";

import React from "react";
import Link from "next/link";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioEmptyState } from "~/components/andamio/andamio-empty-state";
import {
  AchievementIcon,
  RefreshIcon,
  CourseIcon,
  CredentialIcon,
  LearnerIcon,
  ExternalLinkIcon,
  SuccessIcon,
} from "~/components/icons";
import { useDashboardData } from "~/contexts/dashboard-context";
import type { DashboardCredentialSummary } from "~/hooks/api";

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
      <AndamioCard className="md:col-span-2">
        <AndamioCardHeader className="pb-3">
          <AndamioCardIconHeader icon={AchievementIcon} title="My Accomplishments" />
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <AndamioSkeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
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
      <AndamioCard className="md:col-span-2">
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <AndamioCardIconHeader icon={AchievementIcon} title="My Accomplishments" />
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
            title="No Courses Yet"
            description="Enroll in a course to start your learning journey on-chain."
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
    <AndamioCard className="md:col-span-2">
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <AndamioCardIconHeader icon={AchievementIcon} title="My Accomplishments" />
          <div className="flex items-center gap-2">
            <AndamioBadge variant="secondary" className="text-xs">
              {totalCourses} {totalCourses === 1 ? "course" : "courses"}
            </AndamioBadge>
            <AndamioButton variant="ghost" size="icon-sm" onClick={refetch} aria-label="Refresh accomplishments">
              <RefreshIcon className="h-4 w-4" />
            </AndamioButton>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 bg-secondary/10 rounded-lg px-3 py-2">
            <LearnerIcon className="h-4 w-4 text-secondary shrink-0" />
            <div>
              <AndamioText className="text-lg font-semibold">{enrolledCount}</AndamioText>
              <AndamioText variant="small" className="text-xs">Enrolled</AndamioText>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
            <SuccessIcon className="h-4 w-4 text-primary shrink-0" />
            <div>
              <AndamioText className="text-lg font-semibold">{completedCount}</AndamioText>
              <AndamioText variant="small" className="text-xs">Completed</AndamioText>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
            <CredentialIcon className="h-4 w-4 text-primary shrink-0" />
            <div>
              <AndamioText className="text-lg font-semibold">{totalCredentials}</AndamioText>
              <AndamioText variant="small" className="text-xs">Credentials</AndamioText>
            </div>
          </div>
        </div>

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
