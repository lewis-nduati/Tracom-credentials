/**
 * React Query hooks for Course Owner API endpoints
 *
 * Owner hooks handle course management operations:
 * - Listing owned courses
 * - Creating, updating, deleting courses
 * - Registering on-chain courses with off-chain metadata
 *
 * Architecture: Role-based hook file
 * - Imports types and transforms from use-course.ts (entity file)
 * - Exports owner-specific query keys and hooks
 *
 * @example
 * ```tsx
 * import { useOwnerCourses, useUpdateCourse } from "~/hooks/api/course/use-course-owner";
 *
 * function CourseStudio() {
 *   const { data: courses, isLoading } = useOwnerCourses();
 *   const updateCourse = useUpdateCourse();
 *
 *   return courses?.map(course => (
 *     <CourseCard key={course.courseId} course={course} />
 *   ));
 * }
 * ```
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import type {
  MergedCourseListItem,
  MergedCoursesResponse,
} from "~/types/generated/gateway";
import { transformCourse, courseKeys, type Course } from "./use-course";
import { GATEWAY_API_BASE } from "~/lib/api-utils";

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query keys for owner course operations
 * Extends the base courseKeys for cache invalidation
 */
export const ownerCourseKeys = {
  all: ["owner-courses"] as const,
  list: () => [...ownerCourseKeys.all, "list"] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch courses owned by the authenticated user
 *
 * Requires authentication. Automatically skips query if user is not authenticated.
 *
 * @example
 * ```tsx
 * function MyCoursesPage() {
 *   const { data: courses, isLoading, error } = useOwnerCourses();
 *
 *   if (isLoading) return <PageLoading />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!courses?.length) return <EmptyState title="No courses yet" />;
 *
 *   return <CourseList courses={courses} />;
 * }
 * ```
 */
export function useOwnerCourses() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: ownerCourseKeys.list(),
    queryFn: async (): Promise<Course[]> => {
      // Endpoint: POST /course/owner/courses/list
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/owner/courses/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch owned courses: ${response.statusText}`);
      }

      const result = (await response.json()) as
        | MergedCourseListItem[]
        | MergedCoursesResponse;

      // Handle both wrapped { data: [...] } and raw array formats
      const items = Array.isArray(result) ? result : (result.data ?? []);

      // Transform to app-level types with camelCase fields
      return items.map(transformCourse);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new course
 *
 * Creates an off-chain course record. For on-chain creation,
 * use the transaction endpoint and then call useRegisterCourse.
 *
 * @example
 * ```tsx
 * function CreateCourseForm() {
 *   const createCourse = useCreateCourse();
 *
 *   const handleSubmit = async (data: CreateCourseInput) => {
 *     await createCourse.mutateAsync(data);
 *     toast.success("Course created!");
 *   };
 *
 *   return <CourseForm onSubmit={handleSubmit} isLoading={createCourse.isPending} />;
 * }
 * ```
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      imageUrl?: string;
      videoUrl?: string;
      category?: string;
      isPublic?: boolean;
    }) => {
      // Endpoint: POST /course/owner/course/create
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/owner/course/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: input.title,
            description: input.description,
            image_url: input.imageUrl,
            video_url: input.videoUrl,
            category: input.category,
            is_public: input.isPublic,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create course: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate owner courses list
      void queryClient.invalidateQueries({
        queryKey: ownerCourseKeys.all,
      });
      // Also invalidate general course lists
      void queryClient.invalidateQueries({
        queryKey: courseKeys.all,
      });
    },
  });
}

/**
 * Update course metadata
 *
 * Updates course content including introduction fields (title, description, image, video).
 * Automatically invalidates the course cache on success.
 *
 * @example
 * ```tsx
 * function EditCourseForm({ course }: { course: Course }) {
 *   const updateCourse = useUpdateCourse();
 *
 *   const handleSubmit = async (data: UpdateCourseInput) => {
 *     await updateCourse.mutateAsync({
 *       courseId: course.courseId,
 *       data,
 *     });
 *     toast.success("Course updated!");
 *   };
 *
 *   return <CourseForm onSubmit={handleSubmit} isLoading={updateCourse.isPending} />;
 * }
 * ```
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      data,
    }: {
      courseId: string;
      data: Partial<{
        title?: string;
        description?: string;
        imageUrl?: string;
        videoUrl?: string;
        live?: boolean;
        isPublic?: boolean;
      }>;
    }) => {
      // Endpoint: POST /course/owner/course/update
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/owner/course/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            data: {
              title: data.title,
              description: data.description,
              image_url: data.imageUrl,
              video_url: data.videoUrl,
              live: data.live,
              is_public: data.isPublic,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update course: ${response.statusText}`);
      }

      // Response consumed but not returned - cache invalidation triggers refetch
      await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific course
      void queryClient.invalidateQueries({
        queryKey: courseKeys.detail(variables.courseId),
      });
      // Also invalidate lists that might contain this course
      void queryClient.invalidateQueries({
        queryKey: courseKeys.lists(),
      });
      // Invalidate active courses (public course catalog)
      void queryClient.invalidateQueries({
        queryKey: courseKeys.active(),
      });
      // Invalidate owner courses
      void queryClient.invalidateQueries({
        queryKey: ownerCourseKeys.all,
      });
      // Invalidate teacher courses (used by project creation prereq selector)
      void queryClient.invalidateQueries({
        queryKey: ["teacher-courses"],
      });
    },
  });
}

/**
 * Delete a course
 *
 * Automatically invalidates all course caches on success.
 *
 * @example
 * ```tsx
 * function DeleteCourseButton({ courseId }: { courseId: string }) {
 *   const deleteCourse = useDeleteCourse();
 *   const router = useRouter();
 *
 *   const handleDelete = async () => {
 *     if (confirm("Are you sure?")) {
 *       await deleteCourse.mutateAsync(courseId);
 *       router.push("/studio/course");
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete} variant="destructive">Delete</Button>;
 * }
 * ```
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (courseId: string) => {
      // Endpoint: POST /course/owner/course/delete
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/owner/course/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete course: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, courseId) => {
      // Remove the specific course from cache
      queryClient.removeQueries({
        queryKey: courseKeys.detail(courseId),
      });
      // Invalidate all lists
      void queryClient.invalidateQueries({
        queryKey: courseKeys.all,
      });
      // Invalidate owner courses
      void queryClient.invalidateQueries({
        queryKey: ownerCourseKeys.all,
      });
    },
  });
}

/**
 * Register an on-chain course with off-chain metadata
 *
 * Use this after a course is created on-chain but before it has
 * been registered in the database. Changes status from "unregistered" -> "active".
 *
 * Typical flow:
 * 1. Course created on-chain via /api/v2/tx/instance/owner/course/create
 * 2. Transaction submitted and confirmed
 * 3. Call this hook to register off-chain metadata
 *
 * @example
 * ```tsx
 * function RegisterCourseButton({ courseId }: { courseId: string }) {
 *   const registerCourse = useRegisterCourse();
 *
 *   const handleRegister = async () => {
 *     await registerCourse.mutateAsync({
 *       courseId,
 *       title: "My Course",
 *       description: "Course description",
 *       isPublic: true,
 *     });
 *     toast.success("Course registered!");
 *   };
 *
 *   return <Button onClick={handleRegister}>Register Course</Button>;
 * }
 * ```
 */
export function useRegisterCourse() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (input: {
      courseId: string;
      txHash?: string;
      title?: string;
      description?: string;
      imageUrl?: string;
      videoUrl?: string;
      category?: string;
      isPublic?: boolean;
    }) => {
      // Endpoint: POST /course/owner/course/register
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/owner/course/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: input.courseId,
            tx_hash: input.txHash,
            title: input.title,
            description: input.description,
            image_url: input.imageUrl,
            video_url: input.videoUrl,
            category: input.category,
            is_public: input.isPublic,
          }),
        }
      );

      if (!response.ok) {
        // Include status code for consumers that need to handle specific cases (e.g., 409 conflict)
        const error = new Error(`Failed to register course: ${response.status} ${response.statusText}`);
        (error as Error & { status?: number }).status = response.status;
        throw error;
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific course (status changes from unregistered -> active)
      void queryClient.invalidateQueries({
        queryKey: courseKeys.detail(variables.courseId),
      });
      // Invalidate all lists (registered courses appear in different queries)
      void queryClient.invalidateQueries({
        queryKey: courseKeys.all,
      });
      // Invalidate owner courses
      void queryClient.invalidateQueries({
        queryKey: ownerCourseKeys.all,
      });
    },
  });
}

/**
 * Hook to invalidate owner courses cache
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateOwnerCourses();
 *
 * // After an external operation that affects owned courses
 * await invalidate();
 * ```
 */
export function useInvalidateOwnerCourses() {
  const queryClient = useQueryClient();

  return useCallback(
    async () => {
      await queryClient.invalidateQueries({
        queryKey: ownerCourseKeys.all,
      });
    },
    [queryClient],
  );
}
