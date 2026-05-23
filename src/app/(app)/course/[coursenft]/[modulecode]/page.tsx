"use client";

import React, { useMemo } from "react";
import { useCourseParams } from "~/hooks/use-course-params";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioPageHeader,
  AndamioSectionHeader,
  AndamioPageLoading,
  AndamioNotFoundCard,
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardAction,
  AndamioCardIconHeader,
} from "~/components/andamio";
import { SettingsIcon, OnChainIcon, AssignmentIcon, NextIcon } from "~/components/icons";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useCourse, useCourseModule, useSLTs } from "~/hooks/api";
import { useTeacherCourses } from "~/hooks/api/course/use-course-teacher";
import { useStudentAssignmentCommitments, getModuleCommitmentStatus } from "~/hooks/api/course/use-student-assignment-commitments";
import { useStudentCredentials, type StudentCourseCredential } from "~/hooks/api/course/use-student-credentials";
import { AssignmentStatusBadge } from "~/components/learner/assignment-status-badge";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { SLTLessonTable, type CombinedSLTLesson } from "~/components/courses/slt-lesson-table";

/**
 * Public page displaying module details with SLTs and lessons
 *
 * Uses React Query for cached, deduplicated data fetching:
 * - useCourse: Course details for breadcrumb
 * - useCourseModule: Module details
 * - useSLTs: Student Learning Targets
 * - useLessons: Lesson content
 *
 * Benefits: Automatic caching, background refetching, request deduplication
 */

export default function ModuleLessonsPage() {
  const { courseId, moduleCode: moduleCodeParam } = useCourseParams();
  const moduleCode = moduleCodeParam!;
  const { isAuthenticated } = useAndamioAuth();

  // Check if user is a teacher for this course (cache hit if already fetched)
  const { data: teacherCourses } = useTeacherCourses();
  const isTeacher = useMemo(
    () => teacherCourses?.some((c) => c.courseId === courseId) ?? false,
    [teacherCourses, courseId],
  );

  // React Query hooks - data is cached and shared across components
  // useCourse returns merged data with both on-chain and off-chain content
  const { data: course } = useCourse(courseId);
  const {
    data: courseModule,
    isLoading: moduleLoading,
    error: moduleError,
  } = useCourseModule(courseId, moduleCode);
  const { data: slts, isLoading: sltsLoading } = useSLTs(courseId, moduleCode);

  // Fetch student commitments for this course (cache hit if already fetched on detail page)
  const { data: studentCommitments } = useStudentAssignmentCommitments(
    isAuthenticated ? courseId : undefined,
  );

  // Fetch student credentials to detect claimed credentials (gated on isAuthenticated internally)
  // Commitment API stays at ACCEPTED after claim — credentials are separate on-chain tokens
  const { data: studentCredentials } = useStudentCredentials();

  // Derive commitment status for this specific module, cross-referencing credential data
  const moduleCommitmentStatus = useMemo(() => {
    if (!studentCommitments) return null;
    const moduleCommitments = studentCommitments.filter(
      (c) => c.courseId === courseId && c.moduleCode === moduleCode,
    );
    const commitmentStatus = getModuleCommitmentStatus(moduleCommitments);

    // If status is ASSIGNMENT_ACCEPTED, check if credential has actually been claimed.
    // The commitment API stays at ACCEPTED permanently — credential claiming is a
    // separate on-chain transaction that does not update the commitment record.
    if (commitmentStatus === "ASSIGNMENT_ACCEPTED") {
      const hasClaimedCredential = hasClaimedModuleCredential(
        studentCredentials ?? [],
        courseId,
        moduleCode,
      );
      if (hasClaimedCredential) return "CREDENTIAL_CLAIMED";
    }

    return commitmentStatus;
  }, [studentCommitments, studentCredentials, moduleCode, courseId]);

  // Get on-chain modules from the merged course data - memoized to stabilize reference
  const onChainModules = useMemo(() => course?.modules ?? [], [course?.modules]);

  // Combine SLTs and Lessons - derived from query data
  // Note: In the new API, lessons are nested inside SLTs
  const combinedData = useMemo<CombinedSLTLesson[]>(() => {
    if (!slts) return [];

    return slts.map((slt) => {
      // SLT and Lesson use camelCase (transformed from API)
      const lesson = slt.lesson;
      return {
        module_index: slt.moduleIndex ?? 1,
        slt_text: slt.sltText ?? "",
        slt_id: `slt-${slt.moduleIndex}`,
        lesson: lesson
          ? {
              title: typeof lesson.title === "string" ? lesson.title : null,
              description: typeof lesson.description === "string" ? lesson.description : null,
              image_url: typeof lesson.imageUrl === "string" ? lesson.imageUrl : null,
              video_url: typeof lesson.videoUrl === "string" ? lesson.videoUrl : null,
            }
          : undefined,
      };
    });
  }, [slts]);

  // Find matching on-chain module by SLT content overlap
  // Note: onChainSlts contains SLT hashes/IDs from the chain
  const onChainModule = useMemo(() => {
    if (onChainModules.length === 0 || combinedData.length === 0) return null;

    const dbSltTexts = new Set(combinedData.map((s) => s.slt_text));

    for (const mod of onChainModules) {
      const modSlts = mod.onChainSlts ?? [];
      const onChainTexts = new Set(modSlts);
      // Check if there's significant overlap (comparing texts with chain data)
      const intersection = [...dbSltTexts].filter((t) => onChainTexts.has(t));
      if (intersection.length > 0 && modSlts.length > 0 && intersection.length >= modSlts.length * 0.5) {
        return mod;
      }
    }

    return null;
  }, [onChainModules, combinedData]);

  // Combined loading state
  const isLoading = moduleLoading || sltsLoading;

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  if (moduleError || !courseModule) {
    return (
      <AndamioNotFoundCard
        title="Module Not Found"
        message={moduleError?.message ?? "Module not found"}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      {course && (
        <CourseBreadcrumb
          mode="public"
          course={{ nftPolicyId: courseId, title: course.title ?? "Course" }}
          courseModule={{ code: courseModule.moduleCode ?? "", title: courseModule.title ?? "Module" }}
          currentPage="module"
        />
      )}

      <AndamioPageHeader
        title={courseModule.title ?? "Module"}
        description={typeof courseModule.description === "string" ? courseModule.description : undefined}
        action={
          isTeacher ? (
            <Link href={`/studio/course/${courseId}/${moduleCode}/slts`}>
              <AndamioButton variant="outline">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Manage SLTs
              </AndamioButton>
            </Link>
          ) : undefined
        }
      />
      <AndamioBadge variant="outline" className="font-mono text-xs">
        {courseModule.moduleCode}
      </AndamioBadge>

      {/* Student Learning Targets & Lessons Combined */}
      <AndamioCard>
        <AndamioCardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <AndamioSectionHeader title="Student Learning Targets & Lessons" />
            {onChainModule && (
              <AndamioBadge variant="outline" className="text-muted-foreground">
                <OnChainIcon className="h-3 w-3 mr-1" />
                On-chain
              </AndamioBadge>
            )}
          </div>
          <AndamioText variant="muted">
            The learning targets below define what you will learn in this module. Each target is paired with a lesson to guide your learning journey.
          </AndamioText>
          <SLTLessonTable
            data={combinedData}
            courseId={courseId}
            moduleCode={moduleCode}
            onChainModule={onChainModule}
          />
        </AndamioCardContent>
      </AndamioCard>

      {/* Assignment CTA - context-aware based on commitment status */}
      <AssignmentCTA
        courseId={courseId}
        moduleCode={moduleCode}
        commitmentStatus={moduleCommitmentStatus}
      />
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Returns true if the student has a claimed credential for the given module.
 *
 * Cross-references the flat claimedCredentials hash list against the module
 * entries to determine whether any SLT for this module has been claimed.
 */
function hasClaimedModuleCredential(
  credentials: StudentCourseCredential[],
  courseId: string,
  moduleCode: string,
): boolean {
  const courseCredential = credentials.find((c) => c.courseId === courseId);
  if (!courseCredential || courseCredential.claimedCredentials.length === 0) {
    return false;
  }
  return courseCredential.modules.some(
    (m) =>
      m.courseModuleCode === moduleCode &&
      m.sltHash !== "" &&
      courseCredential.claimedCredentials.includes(m.sltHash),
  );
}

// =============================================================================
// Assignment CTA - adapts heading and button based on commitment status
// =============================================================================

interface AssignmentCTAProps {
  courseId: string;
  moduleCode: string;
  commitmentStatus: string | null;
}

function AssignmentCTA({
  courseId,
  moduleCode,
  commitmentStatus,
}: AssignmentCTAProps) {
  const ctaConfig = getAssignmentCTAConfig(commitmentStatus);

  return (
    <AndamioCard className="border-primary/50 bg-primary/5">
      <AndamioCardHeader>
        <AndamioCardIconHeader
          icon={AssignmentIcon}
          title={ctaConfig.heading}
          description={ctaConfig.description}
          iconColor="text-primary"
          titleAs="h3"
          titleBadge={
            commitmentStatus ? (
              <AssignmentStatusBadge status={commitmentStatus} />
            ) : undefined
          }
        />
        {ctaConfig.buttonLabel && (
          <AndamioCardAction className="self-center">
            <Link href={`/course/${courseId}/${moduleCode}/assignment`}>
              <AndamioButton size="lg">
                {ctaConfig.buttonLabel}
                <NextIcon className="h-4 w-4 ml-2" />
              </AndamioButton>
            </Link>
          </AndamioCardAction>
        )}
      </AndamioCardHeader>
    </AndamioCard>
  );
}

function getAssignmentCTAConfig(status: string | null) {
  switch (status) {
    case "PENDING_APPROVAL":
      return {
        heading: "Assignment Submitted",
        description:
          "Your assignment is being reviewed. You can view your submission while you wait.",
        buttonLabel: "View Assignment",
      };
    case "ASSIGNMENT_ACCEPTED":
      return {
        heading: "Assignment Accepted!",
        description:
          "Your assignment has been approved. Claim your credential to record your achievement on-chain.",
        buttonLabel: "Claim Credential",
      };
    case "CREDENTIAL_CLAIMED":
      return {
        heading: "Credential Earned",
        description:
          "You've claimed your credential for this module. Your achievement is recorded on-chain.",
        buttonLabel: "View Assignment",
      };
    case "ASSIGNMENT_DENIED":
      return {
        heading: "Revision Requested",
        description:
          "Your assignment needs some revisions. Review the feedback and resubmit when ready.",
        buttonLabel: "Revise Assignment",
      };
    default:
      return {
        heading: "Ready to demonstrate your learning?",
        description:
          "Complete the assignment to show your understanding of this module\u2019s learning targets and earn your credential.",
        buttonLabel: "Start Assignment",
      };
  }
}
