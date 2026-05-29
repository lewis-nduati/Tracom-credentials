"use client";

import React from "react";
import { useCourseParams } from "~/hooks/use-course-params";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
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
  const lessonTitle = typeof lesson.title === "string" ? lesson.title : `Lesson ${moduleIndex}`;
  const lessonDescription = typeof lesson.description === "string" ? lesson.description : "";

  return (
    // Comfortable reading column: title, then content, with room to breathe.
    <div className="mx-auto max-w-2xl space-y-8">
      {course && courseModule && (
        <CourseBreadcrumb
          mode="public"
          course={{ nftPolicyId: courseId, title: course.title ?? "Course" }}
          courseModule={{ code: courseModule.moduleCode ?? "", title: courseModule.title ?? "Module" }}
          lesson={{ index: moduleIndex, title: typeof lesson.title === "string" ? lesson.title : undefined }}
          currentPage="lesson"
        />
      )}

      <article className="space-y-8">
        <header className="space-y-3">
          <AndamioText variant="overline" as="div" className="text-muted-foreground">
            Learning target {moduleIndex}
          </AndamioText>
          <AndamioHeading level={1} size="3xl" className="text-pretty">
            {lessonTitle}
          </AndamioHeading>
          {lessonDescription && (
            <AndamioText variant="lead" className="text-muted-foreground">
              {lessonDescription}
            </AndamioText>
          )}
        </header>

        <LessonMediaSection
          videoUrl={typeof lesson.videoUrl === "string" ? lesson.videoUrl : undefined}
          imageUrl={typeof lesson.imageUrl === "string" ? lesson.imageUrl : undefined}
          imageAlt={lessonTitle}
        />

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

        {!lesson.contentJson && !lesson.imageUrl && !lesson.videoUrl && (
          <AndamioEmptyState
            icon={CourseIcon}
            title="No content has been added to this lesson yet"
            className="rounded-lg border"
          />
        )}

        <LessonNavigation
          currentIndex={moduleIndex}
          lessonsWithNav={lessonsWithNav}
          courseId={courseId}
          moduleCode={moduleCode}
        />
      </article>
    </div>
  );
}
