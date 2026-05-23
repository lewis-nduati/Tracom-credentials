"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";
import { AndamioPageLoading, AndamioStudioLoading, AndamioAlert, AndamioAlertDescription, AndamioButton, AndamioText } from "~/components/andamio";
import { AlertIcon, BackIcon, SecurityAlertIcon } from "~/components/icons";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { useOwnerCourses, useTeacherCourses } from "~/hooks/api";

interface RequireCourseAccessProps {
  /** Course NFT Policy ID to check access for */
  courseId: string;
  /** Title shown when not authenticated */
  title?: string;
  /** Description shown when not authenticated */
  description?: string;
  /** Loading variant - "page" for app pages, "studio-centered" or "studio-split" for studio pages */
  loadingVariant?: "page" | "studio-centered" | "studio-split";
  /** Content to render when user has access */
  children: React.ReactNode;
}

/**
 * Wrapper component that verifies the user has Owner or Teacher access to a course.
 *
 * Authorization logic:
 * - First checks if user is authenticated
 * - Calls both /api/v2/course/owner/courses/list and /api/v2/course/teacher/courses/list
 * - Grants access if the course appears in either list (owner OR teacher)
 *
 * @example
 * ```tsx
 * <RequireCourseAccess
 *   courseId={courseId}
 *   title="Edit Module"
 *   description="You need access to this course to edit modules"
 * >
 *   <ModuleWizard />
 * </RequireCourseAccess>
 * ```
 */
export function RequireCourseAccess({
  courseId,
  title = "Course Access Required",
  description = "Connect your wallet to access this course",
  loadingVariant = "page",
  children,
}: RequireCourseAccessProps) {
  const router = useRouter();
  const { isAuthenticated } = useAndamioAuth();

  // Check both owner and teacher access
  const {
    data: ownedCourses,
    isLoading: isOwnerLoading,
    error: ownerError,
  } = useOwnerCourses();

  const {
    data: teacherCourses,
    isLoading: isTeacherLoading,
    error: teacherError,
  } = useTeacherCourses();

  const isLoading = isOwnerLoading || isTeacherLoading;

  // Grant access if user owns OR teaches this course
  const isOwner = ownedCourses?.some(
    (course) => course.courseId === courseId
  ) ?? false;
  const isTeacher = teacherCourses?.some(
    (course) => course.courseId === courseId
  ) ?? false;
  const hasAccess = isOwner || isTeacher;

  const error = ownerError?.message ?? teacherError?.message ?? null;

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return <ConnectWalletGate title={title} description={description} />;
  }

  // Loading - show skeleton matching the page type
  if (isLoading) {
    if (loadingVariant === "studio-split") {
      return <AndamioStudioLoading variant="split-pane" />;
    }
    if (loadingVariant === "studio-centered") {
      return <AndamioStudioLoading variant="centered" />;
    }
    return <AndamioPageLoading variant="detail" />;
  }

  // Error - show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <AndamioAlert variant="destructive" className="max-w-md">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertDescription>
            {error}
          </AndamioAlertDescription>
        </AndamioAlert>
        <AndamioButton
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          <BackIcon className="h-4 w-4 mr-2" />
          Go Back
        </AndamioButton>
      </div>
    );
  }

  // No access - show access denied
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <SecurityAlertIcon className="h-12 w-12 text-destructive/70 mb-4" />
        <AndamioHeading level={1} size="2xl">Access Denied</AndamioHeading>
        <AndamioText variant="muted" className="text-center mb-6 max-w-md">
          Only course owners and instructors can access this page. If you believe
          you should have access, check that you are connected with the correct wallet.
        </AndamioText>
        <div className="flex gap-3">
          <AndamioButton
            variant="outline"
            onClick={() => router.push("/studio/course")}
          >
            <BackIcon className="h-4 w-4 mr-2" />
            Back to Course Studio
          </AndamioButton>
          <AndamioButton
            variant="secondary"
            onClick={() => router.push(`/course/${courseId}`)}
          >
            View Course
          </AndamioButton>
        </div>
      </div>
    );
  }

  // Has access - render children
  return <>{children}</>;
}
