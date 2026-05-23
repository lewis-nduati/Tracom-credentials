/**
 * React Query hook for fetching all student assignment commitments for a course.
 *
 * Returns a flat list of commitments with normalized status values,
 * plus a helper to derive per-module status from the list.
 *
 * @example
 * ```tsx
 * function CourseProgress({ courseId }: { courseId: string }) {
 *   const { data: commitments } = useStudentAssignmentCommitments(courseId);
 *   const moduleStatus = getModuleCommitmentStatus(
 *     commitments?.filter(c => c.moduleCode === "101") ?? []
 *   );
 *   // moduleStatus: "ASSIGNMENT_ACCEPTED" | "PENDING_APPROVAL" | ...
 * }
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import {
  normalizeCommitmentNetworkStatus,
  type CommitmentNetworkStatus,
} from "~/lib/assignment-status";
import { courseStudentKeys } from "./use-course-student";
import type { StudentCommitmentSummary } from "./commitment-aggregation";
// Re-export pure aggregation helpers so existing imports against this module keep working.
export {
  getModuleCommitmentStatus,
  groupCommitmentsByModule,
} from "./commitment-aggregation";
export type { StudentCommitmentSummary } from "./commitment-aggregation";
// Import directly from gateway.ts to avoid circular dependency with ~/types/generated/index.ts
import type {
  StudentAssignmentCommitmentItem,
  StudentAssignmentCommitmentsResponse,
} from "~/types/generated/gateway";

// =============================================================================
// Status Normalization (canonical — issue #520)
// =============================================================================
//
// Aliases live in `src/lib/assignment-status.ts`. This hook delegates to the
// canonical normalizer wrapper so PENDING_TX_* values are preserved.

function normalizeStatus(
  raw: StudentAssignmentCommitmentItem,
): CommitmentNetworkStatus {
  // Reads nested `content.commitment_status` per the gateway contract.
  // The `?? "PENDING_APPROVAL"` default synthesizes a status for sparse
  // responses where neither `commitment_status` nor `on_chain_status` is set.
  // Load-bearing for UI rendering; parallel hook in use-assignment-commitment.ts
  // has the same default. TX indexer fallback in src/lib/tx-indexer-fallback.ts
  // deliberately bypasses this default to distinguish sparse responses from
  // on-chain PENDING_APPROVAL.
  const rawStatus =
    raw.content?.commitment_status ?? raw.on_chain_status ?? "PENDING_APPROVAL";
  return normalizeCommitmentNetworkStatus(rawStatus);
}

// =============================================================================
// Transform
// =============================================================================

function transformStudentCommitment(
  raw: StudentAssignmentCommitmentItem,
  fallbackCourseId: string,
): StudentCommitmentSummary {
  // Generated type widens `source` to `string`; the equality checks narrow it
  // to the app's three-value union inside each branch.
  const source =
    raw.source === "chain_only" || raw.source === "db_only"
      ? raw.source
      : "merged";

  return {
    courseId: raw.course_id ?? fallbackCourseId,
    moduleCode: raw.course_module_code ?? "",
    sltHash: raw.slt_hash ?? null,
    networkStatus: normalizeStatus(raw),
    source,
  };
}

// =============================================================================
// Shared Query Key + Fetch (reusable by useStudentCompletionsForPrereqs)
// =============================================================================

/**
 * Build the query key for student commitments for a specific course.
 * Exported so parallel-query hooks can share cache entries.
 */
export function studentCommitmentsQueryKey(courseId: string) {
  return [...courseStudentKeys.commitments(), courseId] as const;
}

/**
 * Fetch student commitments for a course (standalone function).
 * Exported so `useQueries()` callers can reuse without duplicating logic.
 */
export async function fetchStudentCommitments(
  courseId: string,
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>,
): Promise<StudentCommitmentSummary[]> {
  const response = await authenticatedFetch(
    `${GATEWAY_API_BASE}/course/student/assignment-commitments/list`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId }),
    },
  );

  // 404 means no commitments — return empty
  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch student commitments: ${response.statusText}`,
    );
  }

  const result: unknown = await response.json();

  // Expected shape per generated type is `StudentAssignmentCommitmentsResponse`
  // (`{ data: StudentAssignmentCommitmentItem[], meta? }`). Also tolerate an
  // array-direct response defensively — the endpoint has historically varied.
  let rawCommitments: StudentAssignmentCommitmentItem[];
  if (Array.isArray(result)) {
    rawCommitments = result as StudentAssignmentCommitmentItem[];
  } else if (result && typeof result === "object" && "data" in result) {
    const wrapped = result as StudentAssignmentCommitmentsResponse & {
      warning?: string;
    };
    if (wrapped.warning) {
      console.warn(
        "[useStudentCommitments] API warning:",
        wrapped.warning,
      );
    }
    rawCommitments = Array.isArray(wrapped.data) ? wrapped.data : [];
  } else {
    console.warn(
      "[useStudentCommitments] Unexpected response shape:",
      result,
    );
    rawCommitments = [];
  }

  return rawCommitments.map((r) =>
    transformStudentCommitment(r, courseId),
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Fetch all student assignment commitments for a course.
 *
 * Uses `courseStudentKeys.commitments()` so it can be invalidated alongside
 * other student queries after a new submission.
 *
 * @param courseId - Course NFT policy ID
 */
export function useStudentAssignmentCommitments(courseId: string | undefined) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: studentCommitmentsQueryKey(courseId ?? ""),
    queryFn: () => fetchStudentCommitments(courseId ?? "", authenticatedFetch),
    enabled: isAuthenticated && !!courseId,
    staleTime: 60_000,
  });
}
