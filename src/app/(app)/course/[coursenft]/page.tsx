"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  AndamioSectionHeader,
  AndamioPageLoading,
  AndamioNotFoundCard,
  AndamioEmptyState,
} from "~/components/andamio";
import { CourseIcon, SLTIcon } from "~/components/icons";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useCourseParams } from "~/hooks/use-course-params";
import { UserCourseStatus } from "~/components/learner/user-course-status";
import { OnChainSltsBadge } from "~/components/courses/on-chain-slts-viewer";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { CourseModuleCard } from "~/components/courses/course-module-card";
import { useCourse, useCourseModules, useTeacherCourseModules } from "~/hooks/api";
import { useStudentAssignmentCommitments, getModuleCommitmentStatus, groupCommitmentsByModule } from "~/hooks/api/course/use-student-assignment-commitments";
import { CourseTeachersCard } from "~/components/studio/course-teachers-card";

/**
 * Public page displaying course details and module list with SLT counts
 *
 * Wrapped in Suspense for useSearchParams (NX-4 compliance).
 *
 * API Endpoints (via React Query):
 * - POST /course/get - Course details (cached by courseId)
 * - POST /course-module/list - Modules with SLTs (cached by courseId)
 */

export default function CourseDetailPage() {
  return (
    <Suspense fallback={<AndamioPageLoading variant="detail" />}>
      <CourseDetailContent />
    </Suspense>
  );
}

function CourseDetailContent() {
  const { courseId } = useCourseParams();
  const searchParams = useSearchParams();
  const isTeacherPreview = searchParams.get("preview") === "teacher";

  // React Query hooks - automatically cached and deduplicated
  // useCourse returns merged data with both on-chain and off-chain content
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useCourse(courseId);

  const {
    data: modules,
    isLoading: modulesLoading,
    error: modulesError,
  } = useCourseModules(courseId);

  const {
    data: teacherModules,
    isLoading: teacherModulesLoading,
    error: teacherModulesError,
  } = useTeacherCourseModules(isTeacherPreview ? courseId : undefined);

  // Fetch student commitments for per-module status badges
  const { isAuthenticated } = useAndamioAuth();
  const { data: studentCommitments } = useStudentAssignmentCommitments(
    isAuthenticated ? courseId : undefined,
  );

  // Group commitments by module code for quick lookup
  const commitmentsByModule = useMemo(
    () => groupCommitmentsByModule(studentCommitments ?? [], courseId),
    [studentCommitments, courseId],
  );

  const resolvedModules = isTeacherPreview
    ? (teacherModules?.length ? teacherModules : modules ?? [])
    : modules ?? [];

  const resolvedModulesLoading = isTeacherPreview
    ? (modulesLoading || teacherModulesLoading)
    : modulesLoading;

  const resolvedModulesError = isTeacherPreview
    ? (modulesError ?? teacherModulesError)
    : modulesError;

  // Combined loading state
  const isLoading = courseLoading || resolvedModulesLoading;
  const error = courseError ?? resolvedModulesError;

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  if (error || !course) {
    return (
      <AndamioNotFoundCard
        title="Course Not Found"
        message={error?.message ?? "Course not found"}
      />
    );
  }

  // Flattened course data from hook - direct access to fields
  const courseTitle = course.title ?? "Course";
  const courseDescription = course.description;

  // Empty modules state
  if (resolvedModules.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <AndamioHeading level={1} size="2xl">{courseTitle}</AndamioHeading>
          {courseDescription && (
            <AndamioText variant="lead">{courseDescription}</AndamioText>
          )}
        </div>
        <AndamioEmptyState
          icon={CourseIcon}
          title="No modules found for this course"
          className="border rounded-md"
        />
      </div>
    );
  }

  // Calculate total SLT count (prefer DB SLTs, fall back to on-chain)
  const totalSlts = resolvedModules.reduce((sum, m) => {
    const dbCount = m.slts?.length ?? 0;
    const chainCount = m.onChainSlts?.length ?? 0;
    return sum + (dbCount > 0 ? dbCount : chainCount);
  }, 0);

  // Course and modules display
  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <CourseBreadcrumb
        mode="public"
        course={{ nftPolicyId: courseId, title: courseTitle }}
        currentPage="course"
      />

      {/* Course Header */}
      <div>
        <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 mb-2">
          <AndamioHeading level={1} size="2xl">{courseTitle}</AndamioHeading>
          <OnChainSltsBadge courseId={courseId} />
        </div>
        {courseDescription && (
          <AndamioText variant="lead">{courseDescription}</AndamioText>
        )}
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CourseIcon className="h-4 w-4 shrink-0" />
            <span>{resolvedModules.length} {resolvedModules.length === 1 ? "Module" : "Modules"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SLTIcon className="h-4 w-4 shrink-0" />
            <span>{totalSlts} Learning {totalSlts === 1 ? "Target" : "Targets"}</span>
          </div>
        </div>
      </div>

      {/* Progress — only renders for enrolled/completed users */}
      <UserCourseStatus courseId={courseId} />

      {/* Course Outline + Course Team — 2-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 lg:gap-8">
        {/* Main column: Course Outline */}
        <div className="space-y-6">
          <div>
            <AndamioSectionHeader title="Course Outline" />
            <AndamioText variant="muted" className="mt-2">
              Each module covers a set of learning goals. Complete modules to earn credentials toward project access.
            </AndamioText>
          </div>

          {/* Module Cards with SLTs */}
          <div className="space-y-4">
            {resolvedModules.map((courseModule, moduleIndex) => {
              // DB SLTs (if populated from content.slts)
              const dbSlts = (courseModule.slts ?? [])
                .filter((s) => !!s.sltText)
                .map((s) => ({ sltText: s.sltText! }));

              // On-chain SLTs (from merged endpoint - array of SLT text strings)
              // Use as fallback if DB SLTs aren't populated
              const chainSlts = (courseModule.onChainSlts ?? [])
                .map((text) => ({ sltText: text }));

              // Prefer DB SLTs, fall back to on-chain SLTs
              const displaySlts = dbSlts.length > 0 ? dbSlts : chainSlts;

              // Module is on-chain if it has onChainSlts data
              const hasOnChain = (courseModule.onChainSlts ?? []).length > 0;
              const onChainSltsSet = new Set(courseModule.onChainSlts ?? []);

              // Derive per-module commitment status
              const moduleCommitments = commitmentsByModule.get(courseModule.moduleCode ?? "") ?? [];
              const moduleCommitmentStatus = getModuleCommitmentStatus(moduleCommitments);

              return (
                <CourseModuleCard
                  key={courseModule.moduleCode ?? courseModule.sltHash}
                  moduleCode={courseModule.moduleCode ?? ""}
                  title={courseModule.title ?? "Untitled Module"}
                  index={moduleIndex + 1}
                  sltHash={courseModule.sltHash}
                  slts={displaySlts}
                  onChainSlts={onChainSltsSet}
                  isOnChain={hasOnChain}
                  courseId={courseId}
                  commitmentStatus={moduleCommitmentStatus}
                />
              );
            })}
          </div>
        </div>

        {/* Sidebar column: Course Team (sticky on desktop) */}
        <div className="lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <CourseTeachersCard courseId={courseId} />
        </div>
      </div>

    </div>
  );
}
