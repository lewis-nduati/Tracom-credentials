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
  InstructorIcon,
  RefreshIcon,
  CourseIcon,
  ExternalLinkIcon,
  AddIcon,
} from "~/components/icons";
import { useDashboardData } from "~/contexts/dashboard-context";

interface OwnedCoursesSummaryProps {
  accessTokenAlias: string | null | undefined;
}

/**
 * Owned Courses Summary Card
 *
 * Displays a summary of courses the user teaches.
 * Shows on the dashboard for authenticated users.
 *
 * Now powered by the consolidated dashboard endpoint.
 *
 * UX States:
 * - Loading: Skeleton cards
 * - Empty: Action-oriented with Create Course button
 * - Error: Silent fail (log only, show empty state)
 */
export function OwnedCoursesSummary({ accessTokenAlias }: OwnedCoursesSummaryProps) {
  const { teacher, isLoading, error, refetch } = useDashboardData();

  // No access token - don't show this component
  if (!accessTokenAlias) {
    return null;
  }

  // Loading state - skeleton cards
  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardIconHeader icon={InstructorIcon} title="My Courses" />
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-muted/30">
              <AndamioSkeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <AndamioSkeleton className="h-4 w-32" />
                <AndamioSkeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  const ownedCourses = teacher?.courses ?? [];

  // Empty state or error (silent fail shows empty) - action-oriented
  if (ownedCourses.length === 0 || error) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <AndamioCardIconHeader icon={InstructorIcon} title="My Courses" />
            {!error && (
              <AndamioButton variant="ghost" size="icon-sm" onClick={refetch}>
                <RefreshIcon className="h-4 w-4" />
              </AndamioButton>
            )}
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioEmptyState
            icon={CourseIcon}
            title="No Courses Created"
            description="Create your first course and publish it on-chain."
            action={
              <Link href="/studio">
                <AndamioButton size="sm">
                  <AddIcon className="mr-2 h-3 w-3" />
                  Create Course
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
          <AndamioCardIconHeader icon={InstructorIcon} title="My Courses" />
          <div className="flex items-center gap-2">
            <AndamioBadge variant="secondary" className="text-xs">
              {ownedCourses.length} owned
            </AndamioBadge>
            <AndamioButton variant="ghost" size="icon-sm" onClick={refetch}>
              <RefreshIcon className="h-4 w-4" />
            </AndamioButton>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-3">
        {/* Summary stat */}
        <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
          <InstructorIcon className="h-4 w-4 text-primary" />
          <div>
            <AndamioText className="text-lg font-semibold">{ownedCourses.length}</AndamioText>
            <AndamioText variant="small" className="text-xs">
              {ownedCourses.length === 1 ? "Course" : "Courses"} teaching
            </AndamioText>
          </div>
        </div>

        {/* Course list */}
        <div className="space-y-1.5">
          {ownedCourses.slice(0, 3).map((course) => (
            <Link
              key={course.courseId}
              href={`/studio/course/${course.courseId}`}
              className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CourseIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs truncate">
                  {course.title || "Unregistered Course"}
                </span>
              </div>
              <ExternalLinkIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
          {ownedCourses.length > 3 && (
            <AndamioText variant="small" className="text-xs text-center pt-1">
              +{ownedCourses.length - 3} more courses
            </AndamioText>
          )}
        </div>

        {/* Manage courses link */}
        <div className="pt-2">
          <Link href="/studio" className="block">
            <AndamioButton variant="outline" size="sm" className="w-full">
              <InstructorIcon className="mr-2 h-3 w-3" />
              Manage in Studio
            </AndamioButton>
          </Link>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
