"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useOptionalDashboardData } from "~/contexts/dashboard-context";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioEmptyState } from "~/components/andamio/andamio-empty-state";
import { AlertIcon, CourseIcon, CredentialIcon, NextIcon, SuccessIcon } from "~/components/icons";
import { cn } from "~/lib/utils";

/**
 * My Learning component - Shows learner's enrolled courses
 *
 * Data Source:
 * - Consolidated dashboard API: POST /api/v2/user/dashboard
 *
 * Returns courses with both on-chain enrollment status and DB content (title, description).
 */

interface DisplayCourse {
  courseId: string;
  title: string;
  description: string;
  enrollmentStatus: "enrolled" | "completed";
  /** Number of approved-but-unclaimed credentials for this course */
  claimableCount: number;
}

function EnrolledCourseCard({ course }: { course: DisplayCourse }) {
  const courseId = course.courseId ?? "";
  const title = course.title || `Course ${courseId.slice(0, 8)}...`;
  const isCompleted = course.enrollmentStatus === "completed";

  return (
    <Link
      href={`/course/${courseId}`}
      className="group flex items-center gap-3 rounded-md border px-3 py-2.5 hover:bg-accent transition-colors"
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          course.claimableCount > 0
            ? "bg-secondary/15 text-secondary"
            : isCompleted
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground"
        )}
      >
        {course.claimableCount > 0 ? (
          <CredentialIcon className="h-3.5 w-3.5" />
        ) : isCompleted ? (
          <SuccessIcon className="h-3.5 w-3.5" />
        ) : (
          <CourseIcon className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{title}</span>
          {course.claimableCount > 0 ? (
            <span className="shrink-0 rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-medium text-secondary">
              {course.claimableCount === 1 ? "Claim credential" : `${course.claimableCount} to claim`}
            </span>
          ) : isCompleted ? (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              Completed
            </span>
          ) : null}
        </div>
        {course.description && (
          <AndamioText variant="small" className="line-clamp-1 text-xs">
            {course.description}
          </AndamioText>
        )}
      </div>
      <NextIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

export function MyLearning() {
  const { isAuthenticated, user } = useAndamioAuth();
  const dashboardData = useOptionalDashboardData();
  const student = dashboardData?.student;

  // Compute claimable credentials per course:
  // commitments with ASSIGNMENT_ACCEPTED that aren't yet in credentialsByCourse
  const claimableByCourseLookup = useMemo(() => {
    const lookup = new Map<string, number>();
    const commitments = student?.commitments ?? [];
    const credentialsByCourse = student?.credentialsByCourse ?? [];

    // Build set of already-claimed sltHashes
    const claimedHashes = new Set<string>();
    for (const cc of credentialsByCourse) {
      for (const hash of cc.credentials) {
        claimedHashes.add(hash);
      }
    }

    // Count approved-but-unclaimed per course
    for (const c of commitments) {
      if (c.status === "ASSIGNMENT_ACCEPTED" && !claimedHashes.has(c.sltHash)) {
        lookup.set(c.courseId, (lookup.get(c.courseId) ?? 0) + 1);
      }
    }

    return lookup;
  }, [student?.commitments, student?.credentialsByCourse]);

  // Not authenticated or no access token
  if (!isAuthenticated || !user?.accessTokenAlias) {
    return null;
  }

  // Not inside DashboardProvider - don't render
  if (!dashboardData) {
    return null;
  }

  const { isLoading, error } = dashboardData;

  // Loading state
  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardTitle className="text-base">My Learning</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <AndamioSkeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Error state
  if (error) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardTitle className="text-base">My Learning</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioAlert variant="destructive">
            <AlertIcon className="h-4 w-4" />
            <AndamioAlertTitle>Error</AndamioAlertTitle>
            <AndamioAlertDescription>{error.message}</AndamioAlertDescription>
          </AndamioAlert>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Combine enrolled and completed courses
  const enrolledCourses: DisplayCourse[] = (student?.enrolledCourses ?? []).map((c) => ({
    courseId: c.courseId,
    title: c.title,
    description: c.description,
    enrollmentStatus: "enrolled" as const,
    claimableCount: claimableByCourseLookup.get(c.courseId) ?? 0,
  }));

  const completedCourses: DisplayCourse[] = (student?.completedCourses ?? []).map((c) => ({
    courseId: c.courseId,
    title: c.title,
    description: c.description,
    enrollmentStatus: "completed" as const,
    claimableCount: claimableByCourseLookup.get(c.courseId) ?? 0,
  }));

  // Sort: claimable courses first, then enrolled, then completed
  const allCourses = [...enrolledCourses, ...completedCourses].sort((a, b) => {
    if (a.claimableCount > 0 && b.claimableCount === 0) return -1;
    if (a.claimableCount === 0 && b.claimableCount > 0) return 1;
    return 0;
  });

  // Empty state
  if (allCourses.length === 0) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardTitle className="text-base">My Learning</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioEmptyState
            icon={CourseIcon}
            title="No Courses Yet"
            description="Browse courses and submit your first assignment to get started."
            action={
              <Link href="/course">
                <AndamioButton size="sm"><CourseIcon className="mr-2 h-3 w-3" />Browse Courses</AndamioButton>
              </Link>
            }
          />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  const enrolledCount = enrolledCourses.length;
  const completedCount = completedCourses.length;
  const totalClaimable = Array.from(claimableByCourseLookup.values()).reduce((sum, n) => sum + n, 0);

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <AndamioCardTitle className="text-base">My Learning</AndamioCardTitle>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground">
                {enrolledCount} active
              </span>
              {completedCount > 0 && (
                <span className="text-xs text-primary">
                  {completedCount} completed
                </span>
              )}
              {totalClaimable > 0 && (
                <span className="text-xs text-secondary font-medium">
                  {totalClaimable} to claim
                </span>
              )}
            </div>
          </div>
          <Link href="/course">
            <AndamioButton variant="outline" size="sm" className="text-xs h-7">
              Browse More
            </AndamioButton>
          </Link>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent>
        <div className="space-y-1.5">
          {allCourses.map((course) => (
            <EnrolledCourseCard key={course.courseId} course={course} />
          ))}
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
