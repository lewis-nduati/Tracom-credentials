"use client";

import React, { useState } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useOwnerCourses } from "~/hooks/api/course/use-course-owner";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AlertIcon, CourseIcon } from "~/components/icons";
import { CourseStatsDashboard } from "./course-stats-dashboard";
import { CourseFilterToolbar } from "./course-filter-toolbar";
import { CourseGridView } from "./course-grid-view";
import { CourseListView } from "./course-list-view";
import { CourseTableView } from "./course-table-view";
import {
  type CourseFilter,
  type CourseSortConfig,
  type CourseViewMode,
  defaultCourseFilter,
  defaultCourseSortConfig,
  filterCourses,
  sortCourses,
} from "~/lib/course-filters";

/**
 * Comprehensive course management interface
 * Features:
 * - Multiple view modes (Grid, Table, List)
 * - Advanced filtering (search, status, tier, category)
 * - Sorting by multiple fields
 * - Quick stats dashboard
 * - Responsive design
 */
export function CourseManager() {
  const { isAuthenticated } = useAndamioAuth();
  const { data: allCourses = [], isLoading, error } = useOwnerCourses();
  const moduleCounts: Record<string, number> = {};

  // Filter, sort, and view state
  const [filter, setFilter] = useState<CourseFilter>(defaultCourseFilter);
  const [sortConfig, setSortConfig] = useState<CourseSortConfig>(defaultCourseSortConfig);
  const [viewMode, setViewMode] = useState<CourseViewMode>("grid");

  // Calculate filtered and sorted courses
  const filteredCourses = filterCourses(allCourses, filter);
  const displayedCourses = sortCourses(filteredCourses, sortConfig, moduleCounts);

  // Count active filters
  const activeFilterCount = [
    filter.search !== "",
    filter.publicationStatus !== "all",
  ].filter(Boolean).length;

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center border">
        <AndamioText variant="small">Connect and authenticate to view your courses</AndamioText>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <AndamioSkeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <AndamioSkeleton key={i} className="h-24 w-full" />
          ))}
        </div>
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
  if (allCourses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border">
        <CourseIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <AndamioText variant="small">No courses found. Create your first course to get started.</AndamioText>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <CourseStatsDashboard courses={allCourses} moduleCounts={moduleCounts} />

      {/* Filter Toolbar */}
      <CourseFilterToolbar
        filter={filter}
        sortConfig={sortConfig}
        viewMode={viewMode}
        onFilterChange={setFilter}
        onSortChange={setSortConfig}
        onViewModeChange={setViewMode}
        activeFilterCount={activeFilterCount}
      />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <AndamioText variant="small">
          Showing {displayedCourses.length} of {allCourses.length} courses
        </AndamioText>
      </div>

      {/* View Mode Content */}
      {displayedCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border">
          <CourseIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <AndamioText variant="small">No courses match your filters.</AndamioText>
        </div>
      ) : (
        <>
          {viewMode === "grid" && <CourseGridView courses={displayedCourses} moduleCounts={moduleCounts} />}
          {viewMode === "list" && <CourseListView courses={displayedCourses} moduleCounts={moduleCounts} />}
          {viewMode === "table" && <CourseTableView courses={displayedCourses} moduleCounts={moduleCounts} />}
        </>
      )}
    </div>
  );
}
