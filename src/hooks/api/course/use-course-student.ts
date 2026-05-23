/**
 * React Query hooks for Student Course API endpoints
 *
 * Provides cached access to courses the authenticated user is enrolled in or has completed.
 *
 * @example
 * ```tsx
 * function MyLearning() {
 *   const { data, isLoading } = useStudentCourses();
 *
 *   return data?.map(course => (
 *     <CourseCard key={course.courseId} course={course} />
 *   ));
 * }
 * ```
 */

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { GATEWAY_API_BASE } from "~/lib/api-utils";

// =============================================================================
// Query Keys
// =============================================================================

export const courseStudentKeys = {
  all: ["student-courses"] as const,
  list: () => [...courseStudentKeys.all, "list"] as const,
  commitments: () => [...courseStudentKeys.all, "commitments"] as const,
  courseStatus: (courseId: string) =>
    [...courseStudentKeys.all, "status", courseId] as const,
};

// =============================================================================
// Types
// =============================================================================

/**
 * App-level StudentCourse type with camelCase fields
 *
 * Flattens nested `content` into top-level fields for easier access.
 */
export interface StudentCourse {
  // Course identity
  courseId: string;
  courseAddress?: string;

  // Content (flattened from nested object)
  title?: string;
  description?: string;
  imageUrl?: string;
  isPublic?: boolean;

  // Student-specific
  enrollmentStatus?: "enrolled" | "completed";
  studentStateId?: string;

  // On-chain metadata
  owner?: string;
  teachers?: string[];
  createdSlot?: number;
  createdTx?: string;

  // Data source
  source?: string;
}

export type StudentCoursesResponse = StudentCourse[];

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform raw API StudentCourse to app-level StudentCourse type
 */
export function transformStudentCourse(raw: Record<string, unknown>): StudentCourse {
  const content = raw.content as Record<string, unknown> | undefined;

  return {
    // Course identity
    courseId: (raw.course_id as string) ?? "",
    courseAddress: raw.course_address as string | undefined,

    // Content (flattened)
    title: content?.title as string | undefined,
    description: content?.description as string | undefined,
    imageUrl: content?.image_url as string | undefined,
    isPublic: content?.is_public as boolean | undefined,

    // Student-specific
    enrollmentStatus: raw.enrollment_status as "enrolled" | "completed" | undefined,
    studentStateId: raw.student_state_id as string | undefined,

    // On-chain metadata
    owner: raw.owner as string | undefined,
    teachers: raw.teachers as string[] | undefined,
    createdSlot: raw.created_slot as number | undefined,
    createdTx: raw.created_tx as string | undefined,

    // Data source
    source: raw.source as string | undefined,
  };
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch courses the authenticated user is enrolled in or has completed
 *
 * @returns StudentCourse[] with camelCase fields and flattened content
 *
 * @example
 * ```tsx
 * function EnrolledCourses() {
 *   const { data: courses, isLoading, error } = useStudentCourses();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!courses?.length) return <EmptyState />;
 *
 *   return courses.map(course => (
 *     <CourseCard
 *       key={course.courseId}
 *       title={course.title}
 *       status={course.enrollmentStatus}
 *     />
 *   ));
 * }
 * ```
 */
export function useStudentCourses() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: courseStudentKeys.list(),
    queryFn: async (): Promise<StudentCoursesResponse> => {
      // Endpoint: POST /api/v2/course/student/courses/list
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/student/courses/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      // 404 means no enrolled courses - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch student courses: ${response.statusText}`
        );
      }

      const result = (await response.json()) as {
        data?: unknown[];
        warning?: string;
      };

      const rawCourses = result.data ?? [];
      return rawCourses.map((raw) =>
        transformStudentCourse(raw as Record<string, unknown>)
      );
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/**
 * Hook to invalidate student courses cache
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateStudentCourses();
 *
 * // After enrolling in a new course
 * await invalidate();
 * ```
 */
export function useInvalidateStudentCourses() {
  const queryClient = useQueryClient();

  return useCallback(
    async () => {
      await queryClient.invalidateQueries({
        queryKey: courseStudentKeys.all,
      });
    },
    [queryClient],
  );
}
