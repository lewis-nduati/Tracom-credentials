"use client";

import React from "react";
import { AndamioDashboardStat } from "~/components/andamio";
import { CourseIcon, LessonIcon, ModuleIcon } from "~/components/icons";
import { type Course } from "~/hooks/api/course/use-course";
import { calculateCourseStats } from "~/lib/course-filters";

interface CourseStatsDashboardProps {
  courses: Course[];
  moduleCounts: Record<string, number>;
}

/**
 * Course statistics dashboard showing key metrics
 * Displays total courses, published/draft counts, and module count
 * Fully responsive for mobile and desktop
 */
export function CourseStatsDashboard({ courses, moduleCounts }: CourseStatsDashboardProps) {
  const stats = calculateCourseStats(courses, moduleCounts);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <AndamioDashboardStat
        icon={CourseIcon}
        label="Total Courses"
        value={stats.total}
        description={`${stats.published} published, ${stats.draft} draft`}
      />
      <AndamioDashboardStat
        icon={LessonIcon}
        label="Published"
        value={stats.published}
        description={`${stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}% of total`}
        valueColor="success"
        iconColor="success"
      />
      <AndamioDashboardStat
        icon={ModuleIcon}
        label="Total Modules"
        value={stats.totalModules}
        description={`${stats.total > 0 ? (stats.totalModules / stats.total).toFixed(1) : 0} avg per course`}
        iconColor="info"
        className="sm:col-span-2 lg:col-span-1"
      />
    </div>
  );
}
