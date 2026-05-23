/**
 * React Query hooks for Teacher Course API endpoints
 *
 * Architecture: Colocated Types Pattern
 * - App-level types (TeacherCourse) defined here with camelCase fields
 * - Transform functions convert API snake_case to app camelCase
 * - Components import types from this hook, never from generated types
 *
 * @example
 * ```tsx
 * function TeacherStudio() {
 *   const { data, isLoading } = useTeacherCourses();
 *
 *   return data?.map(course => (
 *     <CourseCard key={course.courseId} course={course} />
 *   ));
 * }
 * ```
 */

import { useCallback } from "react";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { GATEWAY_API_BASE } from "~/lib/api-utils";

// =============================================================================
// Query Keys
// =============================================================================

export const courseTeacherKeys = {
  all: ["teacher-courses"] as const,
  list: () => [...courseTeacherKeys.all, "list"] as const,
  commitments: (courseId: string) => [...courseTeacherKeys.all, "commitments", courseId] as const,
};

// =============================================================================
// App-Level Types (exported for components)
// =============================================================================

/**
 * Data source/status for a teacher course
 * - "synced": Data exists both on-chain and in database (merged)
 * - "onchain_only": Only on-chain data (not in database)
 * - "db_only": Only in database (not yet on-chain or minting failed)
 */
export type TeacherCourseStatus = "synced" | "onchain_only" | "db_only";

/**
 * @deprecated Use TeacherCourseStatus instead
 */
export type TeacherCourseSource = TeacherCourseStatus;

/**
 * Teacher course item with camelCase fields
 * Contains both on-chain and off-chain data
 */
export interface TeacherCourse {
  // On-chain fields
  courseId: string;
  courseAddress?: string;
  owner?: string;
  teachers?: string[];
  studentStateId?: string;
  createdTx?: string;
  createdSlot?: number;

  // Flattened content fields
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  isLive?: boolean;
  isPublic?: boolean;

  // Metadata
  status?: TeacherCourseStatus;
}

export type TeacherCoursesResponse = TeacherCourse[];

/**
 * Teacher assignment commitment with camelCase fields
 * Contains pending assessment data with both on-chain and DB info
 *
 * Updated 2026-01-28: Evidence is now Tiptap JSON from content.evidence
 * See: andamio-api/docs/REPL_NOTES/2026-01-28-teacher-commitments-fix.md
 */
export interface TeacherAssignmentCommitment {
  // On-chain fields
  courseId: string;
  studentAlias: string;
  sltHash?: string;
  submissionTx?: string;
  submissionSlot?: number;
  onChainContent?: string;  // Hex-encoded on-chain content

  // Off-chain content (from content object)
  moduleCode?: string;  // Human-readable module code (e.g., "101")
  evidence?: unknown;  // Tiptap JSON document from content.evidence
  commitmentStatus?: string;  // Display status: DRAFT, PENDING_APPROVAL, ACCEPTED, REFUSED (mapped from DB: SUBMITTED, ACCEPTED, REFUSED)

  // Metadata
  status?: TeacherCourseStatus;  // synced, onchain_only, db_only
}

export type TeacherAssignmentCommitmentsResponse = TeacherAssignmentCommitment[];

// =============================================================================
// Raw API Types (internal)
// =============================================================================

interface RawTeacherCourse {
  course_id: string;
  course_address?: string;
  owner?: string;
  teachers?: string[];
  student_state_id?: string;
  created_tx?: string;
  created_slot?: number;
  content?: {
    title?: string;
    code?: string;
    description?: string;
    image_url?: string;
    video_url?: string;
    live?: boolean;
    is_public?: boolean;
  };
  title?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  source?: string;
}

/**
 * Raw API response for teacher commitment
 * Updated 2026-01-28: content object now populated with evidence
 */
interface RawTeacherCommitmentContent {
  evidence?: Record<string, unknown>;  // Tiptap JSON document
  assignment_evidence_hash?: string;
  commitment_status?: "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REFUSED" | "APPROVED" | "REJECTED";
}

interface RawTeacherCommitment {
  course_id: string;
  slt_hash: string;
  course_module_code?: string;  // Human-readable module code
  student_alias: string;
  submission_tx?: string;
  submission_slot?: number;
  on_chain_content?: string;  // Hex-encoded on-chain content
  content?: RawTeacherCommitmentContent;  // Off-chain content from DB
  source: "merged" | "chain_only" | "db_only";
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Convert API source value to status
 */
function mapSourceToStatus(source?: string): TeacherCourseStatus | undefined {
  if (!source) return undefined;
  switch (source) {
    case "merged":
      return "synced";
    case "chain_only":
      return "onchain_only";
    case "db_only":
      return "db_only";
    default:
      return undefined;
  }
}

/**
 * Transform raw API course to app-level TeacherCourse type
 */
function transformTeacherCourse(raw: RawTeacherCourse): TeacherCourse {
  return {
    courseId: raw.course_id,
    courseAddress: raw.course_address,
    owner: raw.owner,
    teachers: raw.teachers,
    studentStateId: raw.student_state_id,
    createdTx: raw.created_tx,
    createdSlot: raw.created_slot,
    // Flatten content.* to top level
    title: raw.content?.title ?? raw.title,
    description: raw.content?.description ?? raw.description,
    imageUrl: raw.content?.image_url ?? raw.image_url,
    videoUrl: raw.video_url, // video_url not in OrchestrationCourseContent
    isLive: raw.content?.live,
    isPublic: raw.content?.is_public,
    status: mapSourceToStatus(raw.source),
  };
}

/**
 * Decode a hex string to UTF-8 text.
 * Used for on_chain_content which is hex-encoded.
 */
function hexToText(hex: string): string {
  try {
    const bytes = new Uint8Array(
      hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
    );
    return new TextDecoder().decode(bytes);
  } catch {
    return hex; // Return original if decode fails
  }
}

/**
 * Map raw API commitment_status + source to display-friendly status.
 *
 * DB sends: DRAFT, SUBMITTED, ACCEPTED, REFUSED
 * Display statuses: DRAFT, PENDING_APPROVAL, ACCEPTED, REFUSED
 *
 * Note: REFUSED is NOT a terminal state - students can resubmit evidence.
 * If on-chain data exists (source: merged/chain_only), the commitment is assessable.
 */
const TEACHER_STATUS_MAP: Record<string, string> = {
  SUBMITTED: "PENDING_APPROVAL",
  ACCEPTED: "ACCEPTED",
  REFUSED: "REFUSED",
  DRAFT: "DRAFT",
  // Legacy aliases (gateway may still send these)
  APPROVED: "ACCEPTED",
  REJECTED: "REFUSED",
  // DB statuses that may survive before gateway healing (andamio-api#133)
  // Note: project endpoints normalize COMMITTED → SUBMITTED (#460),
  // but course endpoints may still send these values.
  COMMITTED: "AWAITING_SUBMISSION",
  AWAITING_SUBMISSION: "AWAITING_SUBMISSION",
  LEFT: "LEFT",
  // TX lifecycle: student submitted evidence, tx committed but not yet indexed.
  // Treat as pending approval so it appears in Pending Review tab.
  PENDING_TX_COMMIT: "PENDING_APPROVAL",
};

function mapToDisplayStatus(
  source: string | undefined,
  contentStatus: string | undefined,
): string {
  if (contentStatus) {
    return TEACHER_STATUS_MAP[contentStatus] ?? contentStatus;
  }
  // Fall back to source-based status
  switch (source) {
    case "chain_only":
    case "merged":
      return "PENDING_APPROVAL";
    case "db_only":
      return "DRAFT";
    default:
      return "UNKNOWN";
  }
}

/**
 * Transform raw API commitment to app-level TeacherAssignmentCommitment type
 * Updated 2026-01-28: Evidence is now under content.evidence
 * Updated 2026-01-30: commitmentStatus now mapped to display values
 */
function transformTeacherCommitment(raw: RawTeacherCommitment): TeacherAssignmentCommitment {
  return {
    courseId: raw.course_id,
    studentAlias: raw.student_alias,
    sltHash: raw.slt_hash,
    submissionTx: raw.submission_tx,
    submissionSlot: raw.submission_slot,
    onChainContent: raw.on_chain_content ? hexToText(raw.on_chain_content) : undefined,
    moduleCode: raw.course_module_code,
    // Evidence is now under content.evidence (Tiptap JSON document)
    evidence: raw.content?.evidence,
    // Commitment status mapped to display values (PENDING_APPROVAL, ACCEPTED, REFUSED, DRAFT)
    commitmentStatus: mapToDisplayStatus(raw.source, raw.content?.commitment_status),
    status: mapSourceToStatus(raw.source),
  };
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch courses the authenticated user teaches
 *
 * Uses merged endpoint: POST /api/v2/course/teacher/courses/list
 * Returns courses with both on-chain state and DB content.
 *
 * @example
 * ```tsx
 * function CourseStudio() {
 *   const { data: courses, isLoading, error, refetch } = useTeacherCourses();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!courses?.length) return <EmptyState />;
 *
 *   return <CourseList courses={courses} />;
 * }
 * ```
 */
export function useTeacherCourses() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: courseTeacherKeys.list(),
    queryFn: async (): Promise<TeacherCoursesResponse> => {
      // Endpoint: POST /api/v2/course/teacher/courses/list
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/courses/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      // 404 means no courses - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch teacher courses: ${response.statusText}`);
      }

      const result = await response.json() as { data?: RawTeacherCourse[]; warning?: string };

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useTeacherCourses] API warning:", result.warning);
      }

      // Transform to app-level types with camelCase fields
      return (result.data ?? []).map(transformTeacherCourse);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/**
 * Fetch assignment commitments pending teacher review for a specific course
 *
 * Uses merged endpoint: POST /api/v2/course/teacher/assignment-commitments/list
 * Returns pending assessments with both on-chain and DB data.
 *
 * @param courseId - The course NFT policy ID to fetch commitments for (required by API)
 *
 * @example
 * ```tsx
 * function PendingReviews({ courseId }: { courseId: string }) {
 *   const { data: commitments, isLoading, error, refetch } = useTeacherAssignmentCommitments(courseId);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!commitments?.length) return <AllCaughtUp />;
 *
 *   return <CommitmentList commitments={commitments} />;
 * }
 * ```
 */
export function useTeacherAssignmentCommitments(courseId: string | undefined) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: courseTeacherKeys.commitments(courseId ?? ""),
    queryFn: async (): Promise<TeacherAssignmentCommitmentsResponse> => {
      // Merged endpoint: POST /api/v2/course/teacher/assignment-commitments/list
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/assignment-commitments/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseId }),
        }
      );

      // 404 means no pending assessments - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch teacher commitments: ${response.statusText}`);
      }

      const result: unknown = await response.json();

      // The API may return { data: [...] } or [...] directly
      let rawCommitments: RawTeacherCommitment[];
      if (Array.isArray(result)) {
        rawCommitments = result as RawTeacherCommitment[];
      } else if (result && typeof result === "object" && "data" in result) {
        const wrapped = result as { data?: RawTeacherCommitment[]; warning?: string };
        if (wrapped.warning) {
          console.warn("[useTeacherCommitments] API warning:", wrapped.warning);
        }
        rawCommitments = Array.isArray(wrapped.data) ? wrapped.data : [];
      } else {
        console.warn("[useTeacherCommitments] Unexpected response shape:", result);
        rawCommitments = [];
      }

      // Transform to app-level types with camelCase fields
      return rawCommitments.map(transformTeacherCommitment);
    },
    enabled: isAuthenticated && !!courseId,
    staleTime: 60_000,
  });
}

/**
 * Teacher course with module details for prerequisite selection
 */
export interface TeacherCourseWithModules {
  courseId: string;
  title?: string;
  isPublic?: boolean;
  modules: Array<{
    assignmentId: string;
    moduleCode?: string;
    title?: string;
    slts: string[];
  }>;
}

/**
 * Fetch teacher courses with module details
 *
 * This hook combines teacher courses list with individual course details
 * to provide module information needed for prerequisite selection.
 *
 * Note: This makes multiple API calls. Use sparingly (e.g., project creation wizard).
 *
 * @example
 * ```tsx
 * function PrereqSelector() {
 *   const { data: courses, isLoading } = useTeacherCoursesWithModules();
 *
 *   return courses?.map(course => (
 *     <CourseModuleSelector key={course.course_id} course={course} />
 *   ));
 * }
 * ```
 */
export function useTeacherCoursesWithModules() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: [...courseTeacherKeys.all, "with-modules"],
    queryFn: async (): Promise<TeacherCourseWithModules[]> => {
      // Step 1: Fetch teacher courses list
      const coursesResponse = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/courses/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (coursesResponse.status === 404) {
        return [];
      }

      if (!coursesResponse.ok) {
        throw new Error(`Failed to fetch teacher courses: ${coursesResponse.statusText}`);
      }

      const coursesResult = (await coursesResponse.json()) as {
        data?: RawTeacherCourse[];
      };
      const rawCourses = coursesResult.data ?? [];

      if (rawCourses.length === 0) {
        return [];
      }

      // Transform to app-level types
      const courses = rawCourses.map(transformTeacherCourse);

      // Step 2: Fetch modules for each course via the merged modules endpoint
      // Uses /course/user/modules/{courseId} which returns content (title, module_code)
      // and on-chain data (slt_hash, on_chain_slts) for each module.
      const coursesWithModules: TeacherCourseWithModules[] = [];

      for (const course of courses) {
        try {
          const modulesResponse = await fetch(
            `${GATEWAY_API_BASE}/course/user/modules/${course.courseId}`
          );

          if (modulesResponse.ok) {
            const modulesResult = (await modulesResponse.json()) as {
              data?: Array<{
                slt_hash?: string;
                on_chain_slts?: string[];
                content?: {
                  course_module_code?: string;
                  title?: string;
                  slts?: unknown[];
                };
                source?: string;
              }>;
            };

            const moduleItems = modulesResult.data ?? [];
            // Filter to modules that have an slt_hash (on-chain identifier)
            const validModules = moduleItems.filter((m) => m.slt_hash);

            if (validModules.length > 0) {
              coursesWithModules.push({
                courseId: course.courseId,
                title: course.title,
                isPublic: course.isPublic,
                modules: validModules
                  .map((m) => {
                    // SLT count: prefer DB slts array, fall back to on_chain_slts
                    const sltCount = m.content?.slts ?? m.on_chain_slts ?? [];
                    return {
                      assignmentId: m.slt_hash!,
                      moduleCode: m.content?.course_module_code,
                      title: m.content?.title,
                      slts: Array.isArray(sltCount)
                        ? sltCount.map((s) =>
                            typeof s === "string" ? s : String(s),
                          )
                        : [],
                    };
                  })
                  // Sort by module code (numeric-aware: 101, 102, ... 110)
                  .sort((a, b) =>
                    (a.moduleCode ?? "").localeCompare(
                      b.moduleCode ?? "",
                      undefined,
                      { numeric: true },
                    ),
                  ),
              });
            }
          }
        } catch {
          // Skip courses that fail to load modules
        }
      }

      return coursesWithModules;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute (longer since this is expensive)
  });
}

/**
 * Batch-fetch assignment commitments for multiple courses
 *
 * Uses `useQueries` to fan out one query per courseId.
 * Each query uses the same key and fetch logic as `useTeacherAssignmentCommitments`.
 *
 * @param courseIds - Array of course NFT policy IDs
 *
 * @example
 * ```tsx
 * function PendingReviewsSummary({ courseIds }: { courseIds: string[] }) {
 *   const queries = useTeacherCommitmentsQueries(courseIds);
 *
 *   const totalPending = queries.reduce((sum, q) => sum + (q.data?.commitments.length ?? 0), 0);
 *   return <span>{totalPending} pending reviews</span>;
 * }
 * ```
 */
export function useTeacherCommitmentsQueries(courseIds: string[]) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: courseTeacherKeys.commitments(courseId),
      // IMPORTANT: Returns the same TeacherAssignmentCommitmentsResponse[] shape
      // as useTeacherAssignmentCommitments so the shared cache key is consistent.
      // The courseId is available from the input array order (useQueries preserves order).
      queryFn: async (): Promise<TeacherAssignmentCommitmentsResponse> => {
        const response = await authenticatedFetch(
          `${GATEWAY_API_BASE}/course/teacher/assignment-commitments/list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course_id: courseId }),
          },
        );

        if (response.status === 404) {
          return [];
        }

        if (!response.ok) {
          throw new Error(
            `Failed to fetch commitments for ${courseId}: ${response.statusText}`,
          );
        }

        const result: unknown = await response.json();

        let rawCommitments: RawTeacherCommitment[];
        if (Array.isArray(result)) {
          rawCommitments = result as RawTeacherCommitment[];
        } else if (result && typeof result === "object" && "data" in result) {
          const wrapped = result as {
            data?: RawTeacherCommitment[];
            warning?: string;
          };
          if (wrapped.warning) {
            console.warn(
              "[useTeacherCommitmentsQueries] API warning:",
              wrapped.warning,
            );
          }
          rawCommitments = Array.isArray(wrapped.data) ? wrapped.data : [];
        } else {
          rawCommitments = [];
        }

        return rawCommitments.map(transformTeacherCommitment);
      },
      enabled: isAuthenticated && courseIds.length > 0,
      staleTime: 60_000,
    })),
  });
}

/**
 * Hook to invalidate teacher courses cache
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateTeacherCourses();
 *
 * // After creating a new course
 * await invalidate();
 * ```
 */
export function useInvalidateTeacherCourses() {
  const queryClient = useQueryClient();

  return useCallback(
    async () => {
      await queryClient.invalidateQueries({
        queryKey: courseTeacherKeys.all,
      });
    },
    [queryClient],
  );
}
