"use client";

import React from "react";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import {
  CourseIcon,
  ExternalLinkIcon,
  RefreshIcon,
  AlertIcon,
  VerifiedIcon,
  LoadingIcon,
  DatabaseIcon,
} from "~/components/icons";
import { useDashboardData } from "~/contexts/dashboard-context";
import Link from "next/link";

interface OnChainStatusProps {
  accessTokenAlias: string | null | undefined;
}

/**
 * On-Chain Status Card
 *
 * Displays the user's on-chain learning status:
 * - Enrolled courses
 * - Links to course detail pages
 *
 * Now powered by the consolidated dashboard endpoint.
 */
export function OnChainStatus({ accessTokenAlias }: OnChainStatusProps) {
  const { student, isLoading, error, refetch } = useDashboardData();

  // No access token - show prompt to mint
  if (!accessTokenAlias) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardIconHeader icon={DatabaseIcon} title="On-Chain Data" />
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <DatabaseIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <AndamioText variant="small" className="font-medium">
              Mint Access Token
            </AndamioText>
            <AndamioText variant="small" className="text-xs mt-1 max-w-[200px]">
              Mint your access token to view your on-chain learning data
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardIconHeader icon={DatabaseIcon} title="On-Chain Data" />
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
            <AndamioText variant="small" className="mt-2">
              Loading blockchain data...
            </AndamioText>
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
          <div className="flex items-center justify-between">
            <AndamioCardIconHeader icon={DatabaseIcon} title="On-Chain Data" />
            <AndamioButton variant="ghost" size="icon-sm" onClick={refetch} aria-label="Refresh on-chain data">
              <RefreshIcon className="h-4 w-4" />
            </AndamioButton>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-3">
              <AlertIcon className="h-6 w-6 text-destructive" />
            </div>
            <AndamioText variant="small" className="font-medium text-destructive">
              Failed to load data
            </AndamioText>
            <AndamioText variant="small" className="text-xs mt-1 max-w-[200px]">
              {error.message}
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Combine enrolled and completed for total count
  const enrolledCourses = student?.enrolledCourses ?? [];
  const completedCourses = student?.completedCourses ?? [];
  const allCourses = [...enrolledCourses, ...completedCourses];
  const courseCount = allCourses.length;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <AndamioCardIconHeader icon={DatabaseIcon} title="On-Chain Data" />
          <div className="flex items-center gap-2">
            <AndamioBadge variant="outline" className="text-xs">
              <VerifiedIcon className="mr-1 h-3 w-3 text-primary" />
              Live
            </AndamioBadge>
            <AndamioButton variant="ghost" size="icon-sm" onClick={refetch} aria-label="Refresh on-chain data">
              <RefreshIcon className="h-4 w-4" />
            </AndamioButton>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <CourseIcon className="h-4 w-4 text-secondary" />
          <div>
            <AndamioText className="text-lg font-semibold">{courseCount}</AndamioText>
            <AndamioText variant="small" className="text-xs">
              {courseCount === 1 ? "Course" : "Courses"} enrolled on-chain
            </AndamioText>
          </div>
        </div>

        {/* Enrolled Courses List */}
        {allCourses.length > 0 ? (
          <div className="space-y-2">
            <AndamioText variant="overline">
              Active Enrollments
            </AndamioText>
            <div className="space-y-1.5">
              {allCourses.slice(0, 3).map((course, index) => (
                <Link
                  key={course.courseId ?? index}
                  href={`/course/${course.courseId ?? ""}`}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CourseIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {course.title ? (
                      <span className="text-xs truncate">{course.title}</span>
                    ) : (
                      <code className="text-xs font-mono truncate">
                        {course.courseId?.slice(0, 16) ?? "Unknown"}...
                      </code>
                    )}
                  </div>
                  <ExternalLinkIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))}
              {allCourses.length > 3 && (
                <AndamioText variant="small" className="text-xs text-center pt-1">
                  +{allCourses.length - 3} more courses
                </AndamioText>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-3">
            <AndamioText variant="small">
              No course enrollments yet
            </AndamioText>
            <Link
              href="/course"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              Browse courses →
            </Link>
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
