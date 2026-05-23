"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useStudentCourses } from "~/hooks/api";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";
import {
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioEmptyState,
  AndamioButton,
} from "~/components/andamio";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import {
  CredentialIcon,
  CourseIcon,
  OnChainIcon,
  ExternalLinkIcon,
  ContributorIcon,
} from "~/components/icons";

/**
 * Credentials Page
 *
 * Displays all credentials (completed courses) earned by the authenticated user.
 * Uses the merged student courses endpoint and filters by enrollment_status.
 *
 * API Endpoint: POST /api/v2/course/student/courses/list
 */
export default function CredentialsPage() {
  const { isAuthenticated, user } = useAndamioAuth();

  const { data: studentCourses, isLoading, error, refetch } = useStudentCourses();

  // Filter to only completed courses
  const completedCourses = useMemo(() => {
    if (!studentCourses) return [];
    return studentCourses.filter((course) => course.enrollmentStatus === "completed");
  }, [studentCourses]);

  // Not authenticated state
  if (!isAuthenticated || !user) {
    return (
      <ConnectWalletGate
        title="My Credentials"
        description="Connect your wallet to view your on-chain credentials"
      />
    );
  }

  // No access token
  if (!user.accessTokenAlias) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="My Credentials"
          description="View your on-chain course completions and earned credentials"
        />
        <AndamioEmptyState
          icon={CredentialIcon}
          title="Access Token Required"
          description="You need an access token to view your credentials. Mint one from your dashboard."
          action={
            <Link href="/dashboard">
              <AndamioButton>Go to Dashboard</AndamioButton>
            </Link>
          }
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="list" />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="My Credentials"
          description="View your on-chain course completions and earned credentials"
        />
        <AndamioEmptyState
          icon={CredentialIcon}
          title="Unable to Load Credentials"
          description="There was an error loading your credentials from the blockchain."
          action={
            <AndamioButton onClick={() => refetch()}>Try Again</AndamioButton>
          }
        />
      </div>
    );
  }

  // Empty state
  if (!completedCourses || completedCourses.length === 0) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="My Credentials"
          description="View your on-chain course completions and earned credentials"
        />
        <AndamioEmptyState
          icon={CredentialIcon}
          title="Start Earning Credentials"
          description="Complete courses to earn on-chain credentials. Your achievements will be permanently recorded on the Cardano blockchain."
          action={
            <Link href="/course">
              <AndamioButton>
                <CourseIcon className="mr-2 h-4 w-4" />
                Browse Courses
              </AndamioButton>
            </Link>
          }
        />
      </div>
    );
  }

  // Credentials display
  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="My Credentials"
        description={`You have earned ${completedCourses.length} on-chain ${completedCourses.length === 1 ? "credential" : "credentials"}`}
        action={
          <Link href="/course">
            <AndamioButton variant="outline">
              <CourseIcon className="mr-2 h-4 w-4" />
              Browse More Courses
            </AndamioButton>
          </Link>
        }
      />

      {/* Summary Card */}
      <AndamioCard>
        <AndamioCardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <CredentialIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <AndamioText className="text-2xl font-bold">
                  {completedCourses.length}
                </AndamioText>
                <AndamioText variant="muted">
                  {completedCourses.length === 1 ? "Credential Earned" : "Credentials Earned"}
                </AndamioText>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <OnChainIcon className="h-4 w-4" />
              <AndamioText variant="small">Verified on Cardano</AndamioText>
            </div>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Credentials Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {completedCourses.map((course) => (
          <AndamioCard key={course.courseId} className="group hover:shadow-md transition-shadow">
            <AndamioCardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <AndamioCardIconHeader
                  icon={CredentialIcon}
                  title="Course Credential"
                  iconColor="text-primary"
                />
                <AndamioBadge status="success">Earned</AndamioBadge>
              </div>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              {/* Course Title */}
              {course.title && (
                <div className="space-y-1">
                  <AndamioText variant="small" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Course
                  </AndamioText>
                  <AndamioText className="font-medium">
                    {course.title}
                  </AndamioText>
                </div>
              )}

              {/* Course ID */}
              <div className="space-y-1">
                <AndamioText variant="small" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Course ID
                </AndamioText>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded block truncate">
                  {course.courseId}
                </code>
              </div>

              {/* On-chain info */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <OnChainIcon className="h-3.5 w-3.5" />
                <AndamioText variant="small" className="text-xs">
                  Verified on Cardano blockchain
                </AndamioText>
              </div>

              {/* Actions */}
              <div className="space-y-1">
                <Link
                  href={`/course/${course.courseId}`}
                  className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <AndamioText variant="small" className="text-primary font-medium">
                    View Course
                  </AndamioText>
                  <ExternalLinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
                <Link
                  href="/project"
                  className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <ContributorIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <AndamioText variant="small" className="text-primary font-medium">
                      View eligible projects
                    </AndamioText>
                  </div>
                  <ExternalLinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </div>
            </AndamioCardContent>
          </AndamioCard>
        ))}
      </div>
    </div>
  );
}
