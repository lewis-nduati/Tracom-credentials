"use client";

import Link from "next/link";
import {
  AndamioBreadcrumb,
  AndamioBreadcrumbItem,
  AndamioBreadcrumbLink,
  AndamioBreadcrumbList,
  AndamioBreadcrumbPage,
  AndamioBreadcrumbSeparator,
} from "~/components/andamio";

/**
 * Breadcrumb navigation for course pages (public and studio views)
 *
 * Usage:
 * // Course page
 * <CourseBreadcrumb
 *   mode="public"
 *   course={{ nftPolicyId: "abc", title: "My Course" }}
 * />
 *
 * // Module page
 * <CourseBreadcrumb
 *   mode="studio"
 *   course={{ nftPolicyId: "abc", title: "My Course" }}
 *   courseModule={{ code: "mod-1", title: "Module 1" }}
 * />
 *
 * // Lesson page
 * <CourseBreadcrumb
 *   mode="public"
 *   course={{ nftPolicyId: "abc", title: "My Course" }}
 *   courseModule={{ code: "mod-1", title: "Module 1" }}
 *   lesson={{ index: 1, title: "Lesson 1" }}
 * />
 */

export interface CourseBreadcrumbProps {
  /** Navigation mode: public (/course/...) or studio (/studio/course/...) */
  mode: "public" | "studio";

  /** Course information (required for all course-related pages) */
  course?: {
    nftPolicyId: string;
    title: string;
  };

  /** Module information (for module, lesson, assignment pages) */
  courseModule?: {
    code: string;
    title: string;
  };

  /** Lesson information (for lesson detail pages) */
  lesson?: {
    index: number;
    title?: string;
  };

  /** Current page type (determines which item is the current page) */
  currentPage?: "courses" | "course" | "module" | "lesson" | "assignment" | "introduction" | "slts" | "teacher";
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncate(text: string, maxLength = 30): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function CourseBreadcrumb({
  mode,
  course,
  courseModule,
  lesson,
  currentPage = "course",
}: CourseBreadcrumbProps) {
  const basePath = mode === "studio" ? "/studio/course" : "/course";
  const coursesLabel = mode === "studio" ? "Course Studio" : "Course Catalog";
  const coursesPath = mode === "studio" ? "/studio/course" : "/course";

  return (
    <AndamioBreadcrumb className="mb-4">
      <AndamioBreadcrumbList>
        {/* Courses / Course Studio link */}
        <AndamioBreadcrumbItem>
          {currentPage === "courses" ? (
            <AndamioBreadcrumbPage>{coursesLabel}</AndamioBreadcrumbPage>
          ) : (
            <AndamioBreadcrumbLink asChild>
              <Link href={coursesPath}>{coursesLabel}</Link>
            </AndamioBreadcrumbLink>
          )}
        </AndamioBreadcrumbItem>

        {/* Course link (if course is provided) */}
        {course && (
          <>
            <AndamioBreadcrumbSeparator />
            <AndamioBreadcrumbItem>
              {currentPage === "course" ? (
                <AndamioBreadcrumbPage className="max-w-[200px] truncate">
                  {truncate(course.title, 40)}
                </AndamioBreadcrumbPage>
              ) : (
                <AndamioBreadcrumbLink asChild>
                  <Link
                    href={`${basePath}/${course.nftPolicyId}`}
                    className="max-w-[200px] truncate"
                  >
                    {truncate(course.title, 40)}
                  </Link>
                </AndamioBreadcrumbLink>
              )}
            </AndamioBreadcrumbItem>
          </>
        )}

        {/* Module link (if module is provided) */}
        {course && courseModule && (
          <>
            <AndamioBreadcrumbSeparator />
            <AndamioBreadcrumbItem>
              {currentPage === "module" ? (
                <AndamioBreadcrumbPage className="max-w-[200px] truncate">
                  {truncate(courseModule.title, 30)}
                </AndamioBreadcrumbPage>
              ) : (
                <AndamioBreadcrumbLink asChild>
                  <Link
                    href={`${basePath}/${course.nftPolicyId}/${courseModule.code}`}
                    className="max-w-[200px] truncate"
                  >
                    {truncate(courseModule.title, 30)}
                  </Link>
                </AndamioBreadcrumbLink>
              )}
            </AndamioBreadcrumbItem>
          </>
        )}

        {/* Lesson / SLT (current page indicator) */}
        {course && courseModule && lesson && currentPage === "lesson" && (
          <>
            <AndamioBreadcrumbSeparator />
            <AndamioBreadcrumbItem>
              <AndamioBreadcrumbPage className="max-w-[200px] truncate">
                {lesson.title ? truncate(lesson.title, 30) : `SLT ${lesson.index}`}
              </AndamioBreadcrumbPage>
            </AndamioBreadcrumbItem>
          </>
        )}

        {/* Assignment (current page indicator) */}
        {course && courseModule && currentPage === "assignment" && (
          <>
            <AndamioBreadcrumbSeparator />
            <AndamioBreadcrumbItem>
              <AndamioBreadcrumbPage>Assignment</AndamioBreadcrumbPage>
            </AndamioBreadcrumbItem>
          </>
        )}

        {/* Introduction (current page indicator - studio only) */}
        {course && courseModule && currentPage === "introduction" && (
          <>
            <AndamioBreadcrumbSeparator />
            <AndamioBreadcrumbItem>
              <AndamioBreadcrumbPage>Introduction</AndamioBreadcrumbPage>
            </AndamioBreadcrumbItem>
          </>
        )}

        {/* SLTs (current page indicator - studio only) */}
        {course && courseModule && currentPage === "slts" && (
          <>
            <AndamioBreadcrumbSeparator />
            <AndamioBreadcrumbItem>
              <AndamioBreadcrumbPage>Learning Targets</AndamioBreadcrumbPage>
            </AndamioBreadcrumbItem>
          </>
        )}

        {/* Teacher Dashboard (current page indicator - studio only) */}
        {course && currentPage === "teacher" && (
          <>
            <AndamioBreadcrumbSeparator />
            <AndamioBreadcrumbItem>
              <AndamioBreadcrumbPage>Teacher</AndamioBreadcrumbPage>
            </AndamioBreadcrumbItem>
          </>
        )}
      </AndamioBreadcrumbList>
    </AndamioBreadcrumb>
  );
}
