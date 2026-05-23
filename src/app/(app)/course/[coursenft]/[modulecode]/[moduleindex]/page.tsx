"use client";

import React from "react";
import { useCourseParams } from "~/hooks/use-course-params";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import {
  AndamioPageLoading,
  AndamioNotFoundCard,
  AndamioEmptyState,
} from "~/components/andamio";
import { CourseIcon } from "~/components/icons";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { ContentViewer } from "~/components/editor";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { LessonMediaSection } from "~/components/courses/lesson-media-section";
import { useCourse, useCourseModule, useLesson, useSLTs } from "~/hooks/api";
import { LessonNavigation, type LessonNavItem } from "~/components/courses/lesson-navigation";

/**
 * Public page displaying lesson content
 *
 * Uses React Query for cached, deduplicated data fetching:
 * - useCourse: Course details for breadcrumb (cached)
 * - useCourseModule: Module details for breadcrumb (cached)
 * - useLesson: Lesson content
 *
 * Note: Lessons are optional content tied to SLTs. If no lesson exists,
 * this page will show "Lesson not found" message.
 */

export default function LessonDetailPage() {
  const { courseId, moduleCode: moduleCodeParam, moduleIndex: moduleIndexParam } = useCourseParams();
  const moduleCode = moduleCodeParam!;
  const moduleIndex = moduleIndexParam!;

  // React Query hooks - data is cached and shared across components
  const { data: course } = useCourse(courseId);
  const { data: courseModule } = useCourseModule(courseId, moduleCode);
  const {
    data: lesson,
    isLoading,
    error: lessonError,
  } = useLesson(courseId, moduleCode, moduleIndex);

  // Fetch all SLTs for this module to build prev/next navigation
  const { data: slts } = useSLTs(courseId, moduleCode);

  // Build navigation list: SLTs that have lessons, sorted by index
  const lessonsWithNav: LessonNavItem[] = React.useMemo(() => {
    if (!slts) return [];
    return slts
      .filter((slt) => slt.lesson)
      .map((slt) => ({
        index: slt.moduleIndex ?? 1,
        title: typeof slt.lesson?.title === "string"
          ? slt.lesson.title
          : `Lesson ${slt.moduleIndex ?? 1}`,
      }))
      .sort((a, b) => a.index - b.index);
  }, [slts]);

  const error = lessonError?.message ?? null;

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error state
  if (error || !lesson) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        {course && courseModule && (
          <CourseBreadcrumb
            mode="public"
            course={{ nftPolicyId: courseId, title: course.title ?? "Course" }}
            courseModule={{ code: courseModule.moduleCode ?? "", title: courseModule.title ?? "Module" }}
            lesson={{ index: moduleIndex }}
            currentPage="lesson"
          />
        )}

        <AndamioNotFoundCard
          title="Lesson Not Found"
          message={error ?? "Lesson not found"}
        />

        {!error && (
          <AndamioCard>
            <AndamioCardContent>
              <AndamioEmptyState
                icon={CourseIcon}
                title="This learning target doesn't have a lesson yet"
              />
            </AndamioCardContent>
          </AndamioCard>
        )}
      </div>
    );
  }

  // Lesson display
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      {course && courseModule && (
        <CourseBreadcrumb
          mode="public"
          course={{ nftPolicyId: courseId, title: course.title ?? "Course" }}
          courseModule={{ code: courseModule.moduleCode ?? "", title: courseModule.title ?? "Module" }}
          lesson={{ index: moduleIndex, title: typeof lesson.title === "string" ? lesson.title : undefined }}
          currentPage="lesson"
        />
      )}

      {/* Student Learning Target */}
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <AndamioCardDescription>Learning Target #{moduleIndex}</AndamioCardDescription>
              <AndamioCardTitle>Learning Target {moduleIndex}</AndamioCardTitle>
            </div>
          </div>
        </AndamioCardHeader>
      </AndamioCard>

      {/* Lesson Title and Description */}
      <div className="space-y-4">
        <div>
          <AndamioHeading level={1} size="3xl">
            {typeof lesson.title === "string" ? lesson.title : `Lesson ${moduleIndex}`}
          </AndamioHeading>
          {typeof lesson.description === "string" && lesson.description && (
            <AndamioText variant="lead" className="mt-2">
              {lesson.description}
            </AndamioText>
          )}
        </div>
      </div>

      {/* Media Section */}
      <LessonMediaSection
        videoUrl={typeof lesson.videoUrl === "string" ? lesson.videoUrl : undefined}
        imageUrl={typeof lesson.imageUrl === "string" ? lesson.imageUrl : undefined}
        imageAlt={typeof lesson.title === "string" ? lesson.title : "Lesson image"}
      />

      {/* Lesson Content */}
      {!!lesson.contentJson && (
        <ContentViewer
          content={lesson.contentJson}
          emptyContent={
            <AndamioText variant="muted" className="italic">
              Unable to parse lesson content
            </AndamioText>
          }
        />
      )}

      {/* Empty content state */}
      {!lesson.contentJson && !lesson.imageUrl && !lesson.videoUrl && (
        <AndamioCard>
          <AndamioCardContent>
            <AndamioEmptyState
              icon={CourseIcon}
              title="No content has been added to this lesson yet"
            />
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Prev/Next Lesson Navigation */}
      <LessonNavigation
        currentIndex={moduleIndex}
        lessonsWithNav={lessonsWithNav}
        courseId={courseId}
        moduleCode={moduleCode}
      />
    </div>
  );
}
