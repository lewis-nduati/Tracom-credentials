"use client";

import React from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useOwnerCourses } from "~/hooks/api/course/use-course-owner";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AlertIcon, CourseIcon } from "~/components/icons";
import { CourseModuleCount, CourseManageButton } from "./course-ui";

/**
 * Component to display courses owned by the authenticated user
 *
 * Uses the useOwnedCourses hook for data fetching.
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
 */
export function OwnedCoursesList() {
  const { isAuthenticated } = useAndamioAuth();
  const { data: courses = [], isLoading, error } = useOwnerCourses();
  // Module counts temporarily disabled during hook migration
  const moduleCounts: Record<string, number> = {};

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md">
        <AndamioText variant="small">
          Connect and authenticate to view your courses
        </AndamioText>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <AndamioSkeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <AndamioAlert variant="destructive">
        <AlertIcon className="h-4 w-4" />
        <AndamioAlertTitle>Error</AndamioAlertTitle>
        <AndamioAlertDescription>{error.message}</AndamioAlertDescription>
      </AndamioAlert>
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
        <CourseIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <AndamioText variant="small">
          No courses found. Create your first course to get started.
        </AndamioText>
      </div>
    );
  }

  // Courses list
  return (
    <div className="border rounded-md overflow-x-auto">
      <AndamioTable>
        <AndamioTableHeader>
          <AndamioTableRow>
            <AndamioTableHead className="min-w-[120px]">Course Code</AndamioTableHead>
            <AndamioTableHead className="min-w-[150px]">Title</AndamioTableHead>
            <AndamioTableHead className="min-w-[200px] hidden sm:table-cell">Description</AndamioTableHead>
            <AndamioTableHead className="text-center min-w-[80px]">Modules</AndamioTableHead>
            <AndamioTableHead className="text-right min-w-[100px]">Actions</AndamioTableHead>
          </AndamioTableRow>
        </AndamioTableHeader>
        <AndamioTableBody>
          {courses.map((course) => {
            const courseId = course.courseId ?? "";
            const title = typeof course.title === "string" ? course.title : "";
            const description = typeof course.description === "string" ? course.description : "";
            return (
              <AndamioTableRow key={courseId}>
                <AndamioTableCell className="font-mono text-xs">
                  {courseId}
                </AndamioTableCell>
                <AndamioTableCell className="font-medium">
                  {title}
                </AndamioTableCell>
                <AndamioTableCell className="max-w-md truncate hidden sm:table-cell">
                  {description}
                </AndamioTableCell>
                <AndamioTableCell className="text-center">
                  <CourseModuleCount count={moduleCounts[courseId]} showIcon={false} />
                  {moduleCounts[courseId] === undefined && (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </AndamioTableCell>
                <AndamioTableCell className="text-right">
                  <CourseManageButton
                    courseId={courseId || null}
                    variant="ghost"
                  />
                </AndamioTableCell>
              </AndamioTableRow>
            );
          })}
        </AndamioTableBody>
      </AndamioTable>
    </div>
  );
}
