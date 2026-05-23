/**
 * React Query hook for the student credentials endpoint.
 *
 * Returns the authenticated student's full credential record in a single call:
 * enrolled courses, completed courses, claimed credential hashes, and module metadata.
 *
 * Endpoint: POST /api/v2/course/student/credentials/list
 *
 * @example
 * ```tsx
 * function MyCredentials() {
 *   const { data: credentials, isLoading } = useStudentCredentials();
 *
 *   return credentials?.map(cred => (
 *     <CredentialCard
 *       key={cred.courseId}
 *       title={cred.courseTitle}
 *       status={cred.enrollmentStatus}
 *       completedCount={cred.claimedCredentials.length}
 *     />
 *   ));
 * }
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import {
  isCompletedStatus,
  normalizeAssignmentStatus,
} from "~/lib/assignment-status";
import type {
  StudentCredentialsResponse,
  StudentCourseCredential as ApiStudentCourseCredential,
  CredentialModuleInfo as ApiCredentialModuleInfo,
} from "~/types/generated/gateway";
import { courseStudentKeys } from "./use-course-student";

// =============================================================================
// App-Level Types
// =============================================================================

/**
 * Module info within a credential record
 */
export interface CredentialModuleInfo {
  sltHash: string;
  courseModuleCode: string;
  title: string;
}

/**
 * A student's credential record for a single course.
 *
 * - Enrolled courses have empty `claimedCredentials` but populated `modules`
 * - Completed courses have both populated
 * - `claimedCredentials` is a flat string[] of slt_hashes for set-intersection
 */
export interface StudentCourseCredential {
  courseId: string;
  courseTitle: string;
  isEnrolled: boolean;
  enrollmentStatus: "enrolled" | "completed";
  claimedCredentials: string[];
  modules: CredentialModuleInfo[];
  source: string;
}

// =============================================================================
// Query Keys
// =============================================================================

export const studentCredentialKeys = {
  all: [...courseStudentKeys.all, "credentials"] as const,
  list: () => [...studentCredentialKeys.all, "list"] as const,
};

// =============================================================================
// Pure helpers
// =============================================================================

/**
 * True iff `claimedCredentials` for `courseId` contains the `sltHash` of the
 * given `moduleCode`. Per-module signal: never substitute a course-level field
 * here — see the regression test `does not leak across modules in the same
 * course` in `use-student-credentials.test.ts`.
 *
 * Assumes `sltHash` is unique within a course's modules. The transform layer
 * does not enforce this; if a future API regression returns duplicate hashes
 * across modules of one course, the helper returns true for *any* module that
 * shares the claimed hash. The same-hash regression test pins this contract.
 */
export function hasClaimedModuleCredential(
  credentials: StudentCourseCredential[],
  courseId: string,
  moduleCode: string,
): boolean {
  const courseCredential = credentials.find((c) => c.courseId === courseId);
  if (!courseCredential || courseCredential.claimedCredentials.length === 0) {
    return false;
  }
  return courseCredential.modules.some(
    (m) =>
      m.courseModuleCode === moduleCode &&
      m.sltHash !== "" &&
      courseCredential.claimedCredentials.includes(m.sltHash),
  );
}

/**
 * True iff the learner has fully completed `(courseId, moduleCode)` on-chain.
 * Both halves are required: (a) the commitment lifecycle has reached an
 * accepted/claimed state per `isCompletedStatus`, AND (b) the on-chain
 * credential for *this* module has been claimed. The status check goes
 * through `normalizeAssignmentStatus` so raw gateway values (`COMPLETED`,
 * `APPROVED`, etc.) collapse to the canonical set.
 */
export function deriveModuleCompleted(
  networkStatus: string | null | undefined,
  credentials: StudentCourseCredential[],
  courseId: string,
  moduleCode: string,
): boolean {
  if (!isCompletedStatus(normalizeAssignmentStatus(networkStatus))) {
    return false;
  }
  return hasClaimedModuleCredential(credentials, courseId, moduleCode);
}

// =============================================================================
// Transform
// =============================================================================

function transformModuleInfo(api: ApiCredentialModuleInfo): CredentialModuleInfo {
  return {
    sltHash: api.slt_hash ?? "",
    courseModuleCode: api.course_module_code ?? "",
    title: api.title ?? "",
  };
}

function transformStudentCredential(
  api: ApiStudentCourseCredential,
): StudentCourseCredential {
  return {
    courseId: api.course_id ?? "",
    courseTitle: api.course_title ?? "",
    isEnrolled: api.is_enrolled ?? false,
    enrollmentStatus:
      api.enrollment_status === "completed" ? "completed" : "enrolled",
    claimedCredentials: api.claimed_credentials ?? [],
    modules: (api.modules ?? []).map(transformModuleInfo),
    source: api.source ?? "merged",
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Fetch the authenticated student's full credential record.
 *
 * Returns all enrolled and completed courses with claimed credential hashes
 * and module metadata in a single call.
 *
 * @returns StudentCourseCredential[] — safe for .map()/.filter() (never null)
 */
export function useStudentCredentials(options?: { enabled?: boolean }) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: studentCredentialKeys.list(),
    queryFn: async (): Promise<StudentCourseCredential[]> => {
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/student/credentials/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch student credentials: ${response.statusText}`,
        );
      }

      const result =
        (await response.json()) as StudentCredentialsResponse;

      if (result.meta?.warning) {
        console.warn("[useStudentCredentials] API warning:", result.meta?.warning);
      }

      return (result.data ?? []).map(transformStudentCredential);
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 60_000,
  });
}
