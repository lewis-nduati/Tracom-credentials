/**
 * React Query hooks for Assignment Commitment API endpoints
 *
 * Provides cached access to student assignment commitments (merged on-chain + DB data)
 * and a mutation for submitting evidence to the database.
 *
 * @example
 * ```tsx
 * function AssignmentProgress({ courseId, moduleCode, sltHash }) {
 *   const { data: commitment, isLoading } = useAssignmentCommitment(courseId, moduleCode, sltHash);
 *   const submitEvidence = useSubmitEvidence();
 *
 *   // commitment is null when no commitment exists (404)
 *   if (!commitment) return <CreateCommitmentForm />;
 *   return <CommitmentDisplay commitment={commitment} />;
 * }
 * ```
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import {
  normalizeCommitmentNetworkStatus,
  type CommitmentNetworkStatus,
} from "~/lib/assignment-status";
import { courseStudentKeys } from "./use-course-student";
import type { JSONContent } from "@tiptap/core";
// Import directly from gateway.ts to avoid circular dependency with ~/types/generated/index.ts
import type {
  StudentAssignmentCommitmentResponse,
  StudentAssignmentCommitmentItem,
} from "~/types/generated/gateway";

// =============================================================================
// Query Keys
// =============================================================================

export const assignmentCommitmentKeys = {
  all: ["assignment-commitment"] as const,
  detail: (courseId: string, sltHash: string) =>
    [...assignmentCommitmentKeys.all, "detail", courseId, sltHash] as const,
};

// =============================================================================
// Types
// =============================================================================

/**
 * App-level AssignmentCommitment type with camelCase fields.
 *
 * Normalized from the V2 merged API response (StudentAssignmentCommitmentItem)
 * where commitment fields live under `data.content`.
 */
export interface AssignmentCommitment {
  courseId: string;
  moduleCode: string;
  sltHash: string | null;
  onChainStatus: string | null;
  onChainContent: string | null; // Evidence hash from chain
  /**
   * Normalized status from commitment_status or inferred from on-chain state.
   * Uses the canonical `CommitmentNetworkStatus` union — `PENDING_TX_*` raw
   * values are preserved (so the UI can render a TX-processing banner) and
   * everything else is collapsed to the canonical `AssignmentStatus` set.
   */
  networkStatus: CommitmentNetworkStatus;
  networkEvidence: Record<string, unknown> | null; // From evidence field
  networkEvidenceHash: string | null; // From assignment_evidence_hash
  source: "merged" | "chain_only" | "db_only";
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform raw V2 merged API response to app-level AssignmentCommitment.
 *
 * Reads nested `content` fields per the gateway contract
 * (`StudentAssignmentCommitmentItem`). Commitment fields (`commitment_status`,
 * `evidence`, `assignment_evidence_hash`) live on `data.content`, not flat.
 */
export function transformAssignmentCommitment(
  data: StudentAssignmentCommitmentItem,
  fallbackCourseId: string,
  fallbackModuleCode: string,
): AssignmentCommitment {
  const evidence = data.content?.evidence as
    | Record<string, unknown>
    | undefined;
  const commitmentStatus = data.content?.commitment_status;
  const evidenceHash = data.content?.assignment_evidence_hash;

  // Determine source: prefer explicit API value, otherwise infer from data.
  // Generated type widens `source` to `string`; the equality checks narrow it
  // to the app's three-value union inside each branch.
  let source: "merged" | "chain_only" | "db_only";
  if (data.source === "chain_only" || data.source === "db_only") {
    source = data.source;
  } else if (data.source === "merged") {
    source = "merged";
  } else {
    // Infer source from data structure when API doesn't provide it (or sends
    // an unrecognized string).
    const hasOnChainData = !!(data.on_chain_status ?? data.on_chain_content);
    const hasDbData = !!(commitmentStatus ?? evidence);
    if (hasOnChainData && !hasDbData) {
      source = "chain_only";
    } else if (!hasOnChainData && hasDbData) {
      source = "db_only";
    } else {
      source = "merged";
    }
  }

  // Route raw status through the canonical normalizer (issue #520).
  // Aliases (SUBMITTED/ACCEPTED/REFUSED/APPROVED/REJECTED/AWAITING_SUBMISSION/
  // LEFT/CREDENTIAL_CLAIMED, plus on-chain values) now live in STATUS_ALIASES
  // in `src/lib/assignment-status.ts`. The wrapper preserves `PENDING_TX_*`
  // raw values so the commitment UI can render a TX-processing banner.
  //
  // The `?? "PENDING_APPROVAL"` default synthesizes a status for sparse
  // responses where neither `commitment_status` nor `on_chain_status` is set.
  // Load-bearing for the UI read path — downstream rendering assumes a
  // non-null `networkStatus`. The TX indexer fallback in
  // `src/lib/tx-indexer-fallback.ts` deliberately bypasses this default so
  // it can distinguish "sparse response" from "on-chain PENDING_APPROVAL".
  const rawStatus =
    commitmentStatus ?? data.on_chain_status ?? "PENDING_APPROVAL";
  const networkStatus = normalizeCommitmentNetworkStatus(rawStatus);

  return {
    courseId: data.course_id ?? fallbackCourseId,
    moduleCode: data.course_module_code ?? fallbackModuleCode,
    sltHash: data.slt_hash ?? null,
    onChainStatus: data.on_chain_status ?? null,
    onChainContent: data.on_chain_content ?? null,
    networkStatus,
    networkEvidence: evidence ?? null,
    networkEvidenceHash: evidenceHash ?? data.on_chain_content ?? null,
    source,
  };
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch the student's assignment commitment for a specific course + SLT.
 *
 * Returns merged on-chain + DB data. Returns `null` when no commitment exists (404).
 *
 * @param courseId - Course NFT policy ID
 * @param moduleCode - Module code (passed in request body for DB enrichment)
 * @param sltHash - SLT hash (64-char hex) — required for on-chain lookup
 */
export function useAssignmentCommitment(
  courseId: string,
  moduleCode: string,
  sltHash: string | null,
) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: assignmentCommitmentKeys.detail(courseId, sltHash ?? ""),
    queryFn: async (): Promise<AssignmentCommitment | null> => {
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/student/assignment-commitment/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            slt_hash: sltHash,
            course_module_code: moduleCode,
          }),
        },
      );

      // 404 means no commitment (neither on-chain nor DB)
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to fetch commitment:", response.status, errorBody);
        throw new Error(`Failed to fetch commitment: ${response.status}`);
      }

      const apiResponse = (await response.json()) as StudentAssignmentCommitmentResponse;
      console.log("[useAssignmentCommitment] API response:", apiResponse);

      // `data` is declared required on the generated type but keep the guard
      // as defense against malformed runtime responses.
      const data = apiResponse.data;
      if (!data) {
        return null;
      }

      return transformAssignmentCommitment(data, courseId, moduleCode);
    },
    enabled: isAuthenticated && !!courseId && !!sltHash,
    staleTime: 60_000,
  });
}

// =============================================================================
// Mutations
// =============================================================================

/** Input for submitting/updating evidence in the database */
export interface SubmitEvidenceInput {
  courseId: string;
  sltHash: string;
  moduleCode: string;
  evidence: JSONContent;
  evidenceHash: string;
  /**
   * If true, uses /commitment/update endpoint (existing DB record).
   * If false, uses /commitment/submit endpoint (new DB record).
   */
  isUpdate?: boolean;
}

/**
 * Submit or update evidence content in the database.
 *
 * Uses the appropriate endpoint based on `isUpdate`:
 * - `/commitment/submit` for new records (uses slt_hash)
 * - `/commitment/update` for existing records (uses course_module_code)
 *
 * This mutation MUST succeed before allowing the on-chain TX.
 * Throws on error so callers can stop the flow if save fails.
 *
 * On success, invalidates the matching assignment commitment query.
 */
export function useSubmitEvidence() {
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (input: SubmitEvidenceInput): Promise<void> => {
      const isUpdate = input.isUpdate ?? false;

      // Build request body based on endpoint
      const requestBody: Record<string, unknown> = {
        course_id: input.courseId,
        evidence: input.evidence,
        evidence_hash: input.evidenceHash,
      };

      // /submit uses slt_hash, /update uses course_module_code
      if (isUpdate) {
        requestBody.course_module_code = input.moduleCode;
      } else {
        requestBody.slt_hash = input.sltHash;
      }

      const endpoint = isUpdate
        ? `${GATEWAY_API_BASE}/course/student/commitment/update`
        : `${GATEWAY_API_BASE}/course/student/commitment/submit`;

      console.log("[useSubmitEvidence]", isUpdate ? "Updating" : "Creating", "evidence in DB");

      const response = await authenticatedFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "[useSubmitEvidence] Failed to save evidence to DB:",
          errorText,
        );
        throw new Error(`Failed to save evidence: ${response.status}`);
      }

      console.log("[useSubmitEvidence] Evidence saved to database");
    },
    // NOTE: We intentionally do NOT invalidate queries here.
    // Evidence is saved to DB before the TX, but we want the UI to stay in the
    // "editing/finalizing" flow until the TX is confirmed. Query invalidation
    // happens in useTxStream.onComplete → refetchCommitment() after TX confirmation.
  });
}

// =============================================================================
// Invalidation
// =============================================================================

/**
 * Returns a function to invalidate assignment commitment queries.
 *
 * Call with no args to invalidate all, or with courseId + sltHash for a specific one.
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateAssignmentCommitment();
 *
 * // Invalidate specific commitment
 * await invalidate(courseId, sltHash);
 *
 * // Invalidate all
 * await invalidate();
 * ```
 */
export function useInvalidateAssignmentCommitment() {
  const queryClient = useQueryClient();

  return useCallback(
    async (courseId?: string, sltHash?: string) => {
      if (courseId && sltHash) {
        await queryClient.invalidateQueries({
          queryKey: assignmentCommitmentKeys.detail(courseId, sltHash),
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: assignmentCommitmentKeys.all,
        });
      }
    },
    [queryClient],
  );
}
