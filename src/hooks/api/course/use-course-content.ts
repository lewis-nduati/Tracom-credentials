/**
 * React Query hooks for public course content API endpoints
 *
 * These hooks provide read-only access to course content (SLTs, Lessons,
 * Assignments, Introductions) via the public /course/user/* endpoints.
 * No authentication is required.
 *
 * Types and transforms are defined in use-course-module.ts (the owner file).
 * This file provides the query hooks for reading content.
 *
 * MUTATIONS:
 * All content modifications go through the aggregate-update endpoint
 * via the module draft store (useModuleDraft / useSaveModuleDraft hooks).
 *
 * @example
 * ```tsx
 * import { useSLTs, useLesson, useAssignment, useIntroduction } from "~/hooks/api";
 *
 * function ModuleContent({ courseId, moduleCode }: Props) {
 *   const { data: slts } = useSLTs(courseId, moduleCode);
 *   const { data: assignment } = useAssignment(courseId, moduleCode);
 *   const { data: introduction } = useIntroduction(courseId, moduleCode);
 *
 *   return (
 *     <>
 *       {introduction && <IntroViewer content={introduction} />}
 *       {slts?.map(slt => <SLTCard key={slt.moduleIndex} slt={slt} />)}
 *       {assignment && <AssignmentCard assignment={assignment} />}
 *     </>
 *   );
 * }
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import {
  type SLT,
  type Lesson,
  type Assignment,
  type Introduction,
  transformSLT,
  transformLesson,
  transformAssignment,
  transformIntroduction,
} from "./use-course-module";
import { GATEWAY_API_BASE } from "~/lib/api-utils";

// =============================================================================
// Query Keys
// =============================================================================

export const sltKeys = {
  all: ["slts"] as const,
  lists: () => [...sltKeys.all, "list"] as const,
  list: (courseId: string, moduleCode: string) =>
    [...sltKeys.lists(), courseId, moduleCode] as const,
  details: () => [...sltKeys.all, "detail"] as const,
  detail: (courseId: string, moduleCode: string, moduleIndex: number) =>
    [...sltKeys.details(), courseId, moduleCode, moduleIndex] as const,
};

export const lessonKeys = {
  all: ["lessons"] as const,
  lists: () => [...lessonKeys.all, "list"] as const,
  list: (courseId: string, moduleCode: string) =>
    [...lessonKeys.lists(), courseId, moduleCode] as const,
  details: () => [...lessonKeys.all, "detail"] as const,
  detail: (courseId: string, moduleCode: string, moduleIndex: number) =>
    [...lessonKeys.details(), courseId, moduleCode, moduleIndex] as const,
};

export const assignmentKeys = {
  all: ["assignments"] as const,
  lists: () => [...assignmentKeys.all, "list"] as const,
  list: (courseId: string, moduleCode: string) =>
    [...assignmentKeys.lists(), courseId, moduleCode] as const,
  details: () => [...assignmentKeys.all, "detail"] as const,
  detail: (courseId: string, moduleCode: string) =>
    [...assignmentKeys.details(), courseId, moduleCode] as const,
};

export const introductionKeys = {
  all: ["introductions"] as const,
  lists: () => [...introductionKeys.all, "list"] as const,
  list: (courseId: string, moduleCode: string) =>
    [...introductionKeys.lists(), courseId, moduleCode] as const,
  details: () => [...introductionKeys.all, "detail"] as const,
  detail: (courseId: string, moduleCode: string) =>
    [...introductionKeys.details(), courseId, moduleCode] as const,
};

// =============================================================================
// SLT Queries
// =============================================================================

/**
 * Fetch all SLTs for a module
 *
 * @returns SLT[] with camelCase fields (sltText, moduleIndex, etc.)
 *
 * Handles both V1 and V2 API response formats:
 * - V1: Array or { data: [...] }
 * - V2: { data: { slts: [...], slt_hash, created_by, source } }
 *
 * @example
 * ```tsx
 * function SLTList({ courseId, moduleCode }: Props) {
 *   const { data: slts, isLoading } = useSLTs(courseId, moduleCode);
 *
 *   return slts?.map(slt => (
 *     <div key={slt.moduleIndex}>{slt.sltText}</div>
 *   ));
 * }
 * ```
 */
export function useSLTs(
  courseId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery<SLT[], Error>({
    queryKey: sltKeys.list(courseId ?? "", moduleCode ?? ""),
    queryFn: async () => {
      // Endpoint: GET /course/user/slts/{course_id}/{course_module_code}
      const response = await fetch(
        `${GATEWAY_API_BASE}/course/user/slts/${courseId}/${moduleCode}`
      );

      // 404 means module not on-chain (V2) or doesn't exist
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch SLTs: ${response.statusText}`);
      }

      const result = (await response.json()) as unknown;

      // Handle multiple response formats
      let rawSlts: unknown[];

      if (Array.isArray(result)) {
        // Raw array format
        rawSlts = result;
      } else if (result && typeof result === "object" && "data" in result) {
        const dataValue = (result as { data?: unknown }).data;

        if (Array.isArray(dataValue)) {
          // V1 format: { data: [...] }
          rawSlts = dataValue;
        } else if (dataValue && typeof dataValue === "object" && "slts" in dataValue) {
          // V2 format: { data: { slts: [...], slt_hash, created_by, source } }
          const sltsValue = (dataValue as { slts?: unknown }).slts;
          rawSlts = Array.isArray(sltsValue) ? sltsValue : [];
        } else {
          rawSlts = [];
        }
      } else {
        rawSlts = [];
      }

      return rawSlts.map((raw) => transformSLT(raw as Record<string, unknown>));
    },
    staleTime: 60_000,
    enabled: !!courseId && !!moduleCode,
  });
}

// =============================================================================
// Lesson Queries
// =============================================================================

/**
 * Fetch all lessons for a module
 *
 * NOTE: No batch lesson endpoint exists in the API. This hook returns an empty array.
 * Use `useLesson()` for individual lessons, or get lessons embedded in SLTs via `useSLTs()`.
 *
 * @returns Empty Lesson[] (batch fetch not supported by API)
 *
 * @example
 * ```tsx
 * // Prefer using useSLTs which includes embedded lessons:
 * const { data: slts } = useSLTs(courseId, moduleCode);
 * const lessons = slts?.filter(slt => slt.lesson).map(slt => slt.lesson);
 * ```
 */
export function useLessons(
  courseId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    queryKey: lessonKeys.list(courseId ?? "", moduleCode ?? ""),
    queryFn: async (): Promise<Lesson[]> => {
      // No batch endpoint exists - lessons are fetched individually or embedded in SLTs
      return [];
    },
    staleTime: 60_000,
    enabled: !!courseId && !!moduleCode,
  });
}

/**
 * Fetch a single lesson
 *
 * @returns Lesson with camelCase fields (contentJson, sltIndex, isLive, etc.)
 *
 * Handles both V1 and V2 API response formats:
 * - V1: Various nested formats with lesson content
 * - V2: { data: { course_id, slt_hash, slt_index, slt_text, created_by, content: {...}, source } }
 *
 * @example
 * ```tsx
 * function LessonViewer({ courseId, moduleCode, sltIndex }: Props) {
 *   const { data: lesson, isLoading } = useLesson(courseId, moduleCode, sltIndex);
 *
 *   if (isLoading) return <PageLoading />;
 *   if (!lesson) return <NotFound />;
 *
 *   return <LessonContent lesson={lesson} />;
 * }
 * ```
 */
export function useLesson(
  courseId: string | undefined,
  moduleCode: string | undefined,
  sltIndex: number | undefined
) {
  return useQuery({
    queryKey: lessonKeys.detail(courseId ?? "", moduleCode ?? "", sltIndex ?? 0),
    queryFn: async (): Promise<Lesson | null> => {
      // Endpoint: GET /course/user/lesson/{course_id}/{course_module_code}/{slt_index}
      const response = await fetch(
        `${GATEWAY_API_BASE}/course/user/lesson/${courseId}/${moduleCode}/${sltIndex}`
      );

      // 404 means module not on-chain (V2) or lesson doesn't exist
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch lesson: ${response.statusText}`);
      }

      const result = (await response.json()) as unknown;

      // Handle both wrapped { data: {...} } and raw object formats
      let raw: Record<string, unknown> | null = null;
      if (result && typeof result === "object") {
        if ("data" in result && (result as { data?: unknown }).data) {
          const dataRecord = (result as { data: Record<string, unknown> }).data;
          // V2 format has top-level fields (slt_hash, created_by, content, source)
          // The transform function handles the nested `content` object
          raw = dataRecord;
        } else if (
          "title" in result ||
          "content_json" in result ||
          "slt_index" in result ||
          "content" in result
        ) {
          raw = result as Record<string, unknown>;
        }
      }

      return raw ? transformLesson(raw) : null;
    },
    staleTime: 60_000,
    enabled: !!courseId && !!moduleCode && sltIndex !== undefined,
  });
}

// =============================================================================
// Assignment Queries
// =============================================================================

/**
 * Fetch an assignment for a specific module
 *
 * @returns Assignment with camelCase fields, or null if no assignment exists
 *
 * Handles both V1 and V2 API response formats:
 * - V1: Various nested formats with assignment content at different levels
 * - V2: { data: { course_id, slt_hash, created_by, content: {...}, source } }
 *
 * @example
 * ```tsx
 * function AssignmentViewer({ courseId, moduleCode }: Props) {
 *   const { data: assignment, isLoading } = useAssignment(courseId, moduleCode);
 *
 *   if (isLoading) return <PageLoading />;
 *   if (!assignment) return <NoAssignment />;
 *
 *   return <AssignmentContent assignment={assignment} />;
 * }
 * ```
 */
export function useAssignment(
  courseId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    queryKey: assignmentKeys.detail(courseId ?? "", moduleCode ?? ""),
    queryFn: async (): Promise<Assignment | null> => {
      // Endpoint: GET /course/user/assignment/{course_id}/{course_module_code}
      const response = await fetch(
        `${GATEWAY_API_BASE}/course/user/assignment/${courseId}/${moduleCode}`
      );

      // 404 means no assignment exists for this module (or module not on-chain in V2)
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch assignment: ${response.statusText}`);
      }

      const result = (await response.json()) as unknown;

      const asRecord = (value: unknown): Record<string, unknown> | null =>
        value && typeof value === "object" ? (value as Record<string, unknown>) : null;

      // Handle wrapped and nested formats
      let raw: Record<string, unknown> | null = null;
      const resultRecord = asRecord(result);
      if (resultRecord) {
        if ("data" in resultRecord && resultRecord.data) {
          const dataRecord = asRecord(resultRecord.data);
          if (dataRecord) {
            // V2 format: data has top-level fields (slt_hash, created_by, content, source)
            // Check if this is V2 format by looking for `content` with nested fields
            if ("content" in dataRecord && dataRecord.content && typeof dataRecord.content === "object") {
              // V2 format - pass the whole data object to transform (it handles nested content)
              raw = dataRecord;
            } else if ("assignment" in dataRecord && dataRecord.assignment) {
              raw = asRecord(dataRecord.assignment);
            } else if ("data" in dataRecord && dataRecord.data) {
              const innerRecord = asRecord(dataRecord.data);
              if (innerRecord && "assignment" in innerRecord && innerRecord.assignment) {
                raw = asRecord(innerRecord.assignment);
              } else {
                raw = innerRecord;
              }
            } else {
              raw = dataRecord;
            }
          }
        } else if ("assignment" in resultRecord && resultRecord.assignment) {
          raw = asRecord(resultRecord.assignment);
        } else if (
          "title" in resultRecord ||
          "content_json" in resultRecord ||
          "assignment_content" in resultRecord ||
          "content" in resultRecord
        ) {
          raw = resultRecord;
        }
      }

      return raw ? transformAssignment(raw) : null;
    },
    staleTime: 60_000,
    enabled: !!courseId && !!moduleCode,
  });
}

// =============================================================================
// Introduction Queries
// =============================================================================

/**
 * Fetch an introduction for a specific module (public endpoint)
 *
 * @returns Introduction with camelCase fields, or null if no introduction exists
 *
 * V2 API response format:
 * { data: { course_id, course_module_code, slt_hash, created_by, content: {...}, source } }
 *
 * @example
 * ```tsx
 * function IntroductionViewer({ courseId, moduleCode }: Props) {
 *   const { data: introduction, isLoading } = useIntroduction(courseId, moduleCode);
 *
 *   if (isLoading) return <PageLoading />;
 *   if (!introduction) return <NoIntroduction />;
 *
 *   return <IntroductionContent introduction={introduction} />;
 * }
 * ```
 */
export function useIntroduction(
  courseId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    queryKey: introductionKeys.detail(courseId ?? "", moduleCode ?? ""),
    queryFn: async (): Promise<Introduction | null> => {
      // Endpoint: GET /course/user/introduction/{course_id}/{course_module_code}
      // NEW in V2 - public introduction endpoint
      const response = await fetch(
        `${GATEWAY_API_BASE}/course/user/introduction/${courseId}/${moduleCode}`
      );

      // 404 means no introduction exists or module not on-chain
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch introduction: ${response.statusText}`);
      }

      const result = (await response.json()) as unknown;

      // Handle wrapped { data: {...} } format
      let raw: Record<string, unknown> | null = null;
      if (result && typeof result === "object") {
        if ("data" in result && (result as { data?: unknown }).data) {
          const dataRecord = (result as { data: Record<string, unknown> }).data;
          // V2 format has top-level fields (slt_hash, created_by, content, source)
          // The transform function handles the nested `content` object
          raw = dataRecord;
        } else if (
          "title" in result ||
          "content_json" in result ||
          "introduction_content" in result ||
          "content" in result
        ) {
          raw = result as Record<string, unknown>;
        }
      }

      return raw ? transformIntroduction(raw) : null;
    },
    staleTime: 60_000,
    enabled: !!courseId && !!moduleCode,
  });
}
