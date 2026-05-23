/**
 * Course filtering, sorting, and view mode utilities
 * Used by Course Creator interface for managing course data
 */

import { type Course } from "~/hooks/api/course/use-course";

// View mode options
export type CourseViewMode = "grid" | "table" | "list";

// Filter options (using only available API fields)
export type CourseFilter = {
  search: string;
  publicationStatus: "all" | "published" | "draft";
};

// Sort options (using only available API fields)
export type CourseSortField = "title" | "courseId" | "moduleCount";
export type CourseSortDirection = "asc" | "desc";
export type CourseSortConfig = {
  field: CourseSortField;
  direction: CourseSortDirection;
};

// Default filter state
export const defaultCourseFilter: CourseFilter = {
  search: "",
  publicationStatus: "all",
};

// Default sort config
export const defaultCourseSortConfig: CourseSortConfig = {
  field: "title",
  direction: "asc",
};

// Helper to safely get string value from NullableString
function getStringValue(value: string | object | undefined | null): string {
  if (typeof value === "string") return value;
  return "";
}

/**
 * Filter courses based on filter criteria
 */
export function filterCourses(
  courses: Course[],
  filter: CourseFilter
): Course[] {
  return courses.filter((courseData) => {
    // Search filter (title, id, description)
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const title = getStringValue(courseData.title);
      const courseId = courseData.courseId ?? "";
      const description = getStringValue(courseData.description);
      const matchesSearch =
        title.toLowerCase().includes(searchLower) ||
        courseId.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Publication status filter
    // status: "draft" = not yet on-chain, "active"/"unregistered" = on-chain
    if (filter.publicationStatus !== "all") {
      const isPublished = courseData.status !== "draft";
      if (filter.publicationStatus === "published" && !isPublished) {
        return false;
      }
      if (filter.publicationStatus === "draft" && isPublished) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort courses based on sort configuration
 */
export function sortCourses(
  courses: Course[],
  sortConfig: CourseSortConfig,
  moduleCounts: Record<string, number>
): Course[] {
  const sorted = [...courses];

  sorted.sort((a, b) => {
    let compareValue = 0;

    switch (sortConfig.field) {
      case "title": {
        const aTitle = getStringValue(a.title);
        const bTitle = getStringValue(b.title);
        compareValue = aTitle.localeCompare(bTitle);
        break;
      }
      case "courseId": {
        const aId = a.courseId ?? "";
        const bId = b.courseId ?? "";
        compareValue = aId.localeCompare(bId);
        break;
      }
      case "moduleCount": {
        const aCount = moduleCounts[a.courseId ?? ""] ?? 0;
        const bCount = moduleCounts[b.courseId ?? ""] ?? 0;
        compareValue = aCount - bCount;
        break;
      }
    }

    return sortConfig.direction === "asc" ? compareValue : -compareValue;
  });

  return sorted;
}

/**
 * Calculate course statistics
 */
export function calculateCourseStats(
  courses: Course[],
  moduleCounts: Record<string, number>
) {
  const total = courses.length;
  // Published = on-chain (active or unregistered status)
  const published = courses.filter((c) => c.status !== "draft").length;
  const draft = total - published;

  const totalModules = Object.values(moduleCounts).reduce((sum, count) => sum + count, 0);

  return {
    total,
    published,
    draft,
    totalModules,
  };
}
