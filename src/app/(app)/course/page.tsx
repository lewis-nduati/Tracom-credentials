"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioNotFoundCard,
  AndamioEmptyState,
} from "~/components/andamio";
import {
  CourseIcon,
  SuccessIcon,
  OnChainIcon,
  NextIcon,
} from "~/components/icons";
import { useActiveCourses, useStudentCourses } from "~/hooks/api";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioBadge } from "~/components/andamio/andamio-badge";

/**
 * Public catalog of active courses.
 *
 * A clean numbered list: number, title, one line of description, and a status
 * or enrollment indicator. Matches the module list on the course page so the
 * whole course experience reads as one simple system.
 *
 * API: GET /api/v2/course/user/courses/list (merged on-chain + off-chain).
 */
export default function CoursePage() {
  const { isAuthenticated } = useAndamioAuth();
  const { data: courses = [], isLoading, error: coursesError } = useActiveCourses();
  const { data: studentCourses } = useStudentCourses();

  // Map courseId → enrollment status for authenticated students.
  const enrollmentMap = useMemo(() => {
    const map = new Map<string, "enrolled" | "completed">();
    if (!isAuthenticated || !studentCourses) return map;
    for (const sc of studentCourses) {
      if (sc.courseId && sc.enrollmentStatus) {
        map.set(sc.courseId, sc.enrollmentStatus);
      }
    }
    return map;
  }, [isAuthenticated, studentCourses]);

  if (isLoading) {
    return <AndamioPageLoading variant="cards" />;
  }

  if (coursesError) {
    return (
      <AndamioNotFoundCard
        title="Unable to load courses"
        message={coursesError.message}
      />
    );
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="Courses"
          description="Browse available courses and start building your skills"
        />
        <AndamioEmptyState
          icon={CourseIcon}
          title="No courses available yet"
          description="Courses are being prepared. In the meantime, explore projects or set up your access token."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AndamioPageHeader
        title="Courses"
        description="Browse available courses and start building your skills"
      />

      <div className="space-y-3">
        {courses.map((course, i) => {
          const status = enrollmentMap.get(course.courseId);
          return (
            <Link
              key={course.courseId}
              href={`/course/${course.courseId}`}
              className="group block"
              data-testid="course-card"
            >
              <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-4 transition-colors hover:border-primary/40 hover:bg-muted/30 sm:gap-5 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-navy font-mono text-xs font-semibold text-white ring-1 ring-brand-gold/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {course.title || "Untitled course"}
                  </p>
                  {course.description && (
                    <p className="truncate text-sm text-muted-foreground">
                      {course.description}
                    </p>
                  )}
                </div>
                {status === "completed" ? (
                  <AndamioBadge status="success" className="shrink-0 text-xs">
                    <SuccessIcon className="mr-1 h-3 w-3" />
                    Completed
                  </AndamioBadge>
                ) : status === "enrolled" ? (
                  <AndamioBadge status="pending" className="shrink-0 text-xs">
                    <OnChainIcon className="mr-1 h-3 w-3" />
                    Enrolled
                  </AndamioBadge>
                ) : course.status === "unregistered" ? (
                  <span className="shrink-0 text-xs text-muted-foreground">Coming soon</span>
                ) : course.status === "draft" ? (
                  <span className="shrink-0 text-xs text-muted-foreground">Draft</span>
                ) : (
                  <NextIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
