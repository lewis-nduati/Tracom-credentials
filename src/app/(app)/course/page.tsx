"use client";

import React, { useMemo } from "react";
import {
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioNotFoundCard,
  AndamioEmptyState,
} from "~/components/andamio";
import { CourseIcon, SuccessIcon, PendingIcon, InfoIcon } from "~/components/icons";
import { useActiveCourses, useStudentCourses } from "~/hooks/api";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { CourseCard } from "~/components/courses/course-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";

/**
 * Public page displaying all active courses
 *
 * Uses the merged V2 API endpoint that returns both on-chain and off-chain data.
 * API Endpoint: GET /api/v2/course/user/courses/list
 *
 * Features:
 * - Responsive grid layout (1-3 columns based on screen size)
 * - Beautiful course cards with images/gradients
 * - Status badges (Active/Draft/Unregistered)
 * - Automatic caching via React Query
 */
export default function CoursePage() {
  const { isAuthenticated } = useAndamioAuth();
  const {
    data: courses = [],
    isLoading,
    error: coursesError,
  } = useActiveCourses();

  const { data: studentCourses } = useStudentCourses();

  // Build a map of courseId → enrollmentStatus for authenticated users
  const enrollmentMap = useMemo(() => {
    if (!isAuthenticated || !studentCourses) return new Map<string, "enrolled" | "completed">();
    const map = new Map<string, "enrolled" | "completed">();
    for (const sc of studentCourses) {
      if (sc.courseId && sc.enrollmentStatus) {
        map.set(sc.courseId, sc.enrollmentStatus);
      }
    }
    return map;
  }, [isAuthenticated, studentCourses]);

  const error = coursesError?.message ?? null;

  // Stats for header
  const activeCourses = courses.filter((c) => c.status === "active").length;
  const draftCourses = courses.filter((c) => c.status === "draft").length;
  const unregisteredCourses = courses.filter((c) => c.status === "unregistered").length;

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="cards" />;
  }

  // Error state
  if (error) {
    return (
      <AndamioNotFoundCard
        title="Unable to Load Courses"
        message={error}
      />
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="Courses"
          description="Browse available courses and start building your skills"
        />
        <AndamioEmptyState
          icon={CourseIcon}
          title="No Courses Available Yet"
          description="Courses are being prepared. In the meantime, explore projects or set up your access token."
        />
      </div>
    );
  }

  // Courses list with cards
  return (
    <div className="space-y-8">
      {/* Header with stats */}
      <AndamioPageHeader
        title="Courses"
        description="Browse available courses and start building your skills"
      />

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3">
        <AndamioBadge variant="secondary" className="text-sm px-3 py-1.5">
          <CourseIcon className="h-4 w-4 mr-1.5" />
          {courses.length} {courses.length === 1 ? "course" : "courses"}
        </AndamioBadge>
        {activeCourses > 0 && (
          <AndamioBadge variant="outline" className="text-sm px-3 py-1.5 text-primary border-primary/30">
            <SuccessIcon className="h-4 w-4 mr-1.5" />
            {activeCourses} active
          </AndamioBadge>
        )}
        {draftCourses > 0 && (
          <AndamioBadge variant="outline" className="text-sm px-3 py-1.5 text-muted-foreground border-muted-foreground/30">
            <PendingIcon className="h-4 w-4 mr-1.5" />
            {draftCourses} draft
          </AndamioBadge>
        )}
        {unregisteredCourses > 0 && (
          <AndamioBadge variant="outline" className="text-sm px-3 py-1.5 text-secondary border-secondary/30">
            <InfoIcon className="h-4 w-4 mr-1.5" />
            {unregisteredCourses} coming soon
          </AndamioBadge>
        )}
      </div>

      {/* Course cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.courseId}
            course={course}
            enrollmentStatus={enrollmentMap.get(course.courseId)}
          />
        ))}
      </div>
    </div>
  );
}
