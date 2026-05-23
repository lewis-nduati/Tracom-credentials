"use client";

import React from "react";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardFooter, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { type Course } from "~/hooks/api";
import {
  CourseStatusBadge,
  CourseStatusIcon,
  CourseModuleCount,
  CourseManageButton,
  CourseCodeDisplay,
} from "./course-ui";

interface CourseGridViewProps {
  courses: Course[];
  moduleCounts: Record<string, number>;
}

/**
 * Grid view for courses - card-based layout
 * Uses shared components from course-ui.tsx for consistency
 * Fully responsive for mobile and desktop
 */
export function CourseGridView({ courses, moduleCounts }: CourseGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {courses.map((courseData) => {
        const courseId = courseData.courseId ?? "";
        const title = typeof courseData.title === "string" ? courseData.title : "";
        const description = typeof courseData.description === "string" ? courseData.description : "";
        return (
          <AndamioCard key={courseId} className="flex flex-col">
            <AndamioCardHeader>
              <div className="flex items-start justify-between gap-2">
                <AndamioCardTitle className="line-clamp-2 text-base sm:text-lg">{title}</AndamioCardTitle>
                <CourseStatusIcon
                  isPublished={!!courseId}
                  className="flex-shrink-0"
                />
              </div>
              {description && (
                <AndamioCardDescription className="line-clamp-2">{description}</AndamioCardDescription>
              )}
            </AndamioCardHeader>

            <AndamioCardContent className="space-y-3 flex-1">
              <CourseCodeDisplay code={courseId} showLabel />

              {/* Badges Row */}
              <div className="flex flex-wrap gap-2">
                <CourseStatusBadge isPublished={!!courseId} />
                <CourseModuleCount count={moduleCounts[courseId]} />
              </div>
            </AndamioCardContent>

            <AndamioCardFooter className="mt-auto">
              <CourseManageButton
                courseId={courseId || null}
                label="Manage Course"
                className="w-full"
              />
            </AndamioCardFooter>
          </AndamioCard>
        );
      })}
    </div>
  );
}
