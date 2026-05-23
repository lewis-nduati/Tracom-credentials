/**
 * Indexer fallback — resolves a TX to success/failure by querying commitment
 * endpoints when the tx-status polling layer times out on a 404 budget.
 *
 * Called by the watcher store's onComplete handler (only when the synthetic
 * terminal carries `__reason: "budget_404"` and the watched TX has a
 * `recoveryContext`). Framework-agnostic: no React, no Zustand, no hooks.
 * Takes an authenticated fetch function from the caller.
 *
 * ## Why read raw fields instead of reusing the existing transforms
 *
 * `transformAssignmentCommitment` in `use-assignment-commitment.ts` synthesizes
 * `rawStatus = commitmentStatus ?? on_chain_status ?? "PENDING_APPROVAL"` — it
 * defaults to `PENDING_APPROVAL` when both fields are absent. Reusing that here
 * would wrongly auto-resolve a sparse response as "updated". This module reads
 * raw fields directly and treats "both absent" as `unresolved`.
 *
 * ## Auth & trust
 *
 * - Both endpoints require JWT; callers must pass an authenticated fetch.
 * - 401 is treated as `unresolved` — never retry, never re-auth from a
 *   background path.
 * - The store is responsible for checking wallet/auth lifecycle before invoking
 *   this module (see tx-watcher-store.ts).
 *
 * @see docs/plans/2026-04-14-001-fix-tx-register-404-polling-loop-plan.md (Unit 4)
 */

import { GATEWAY_API_BASE } from "~/lib/api-utils";
import { withTimeout } from "~/lib/promise-utils";
import type {
  ContributorCommitmentResponse,
  ContributorCommitmentItem,
  StudentAssignmentCommitmentResponse,
  StudentAssignmentCommitmentItem,
  AssignmentCommitmentContent,
} from "~/types/generated";
import type { TxRecoveryContext } from "~/types/tx-recovery";

const INDEXER_FALLBACK_TIMEOUT_MS = 15_000;

// =============================================================================
// Types
// =============================================================================

export type FallbackResolution =
  | { kind: "resolved"; state: "updated" | "failed"; last_error?: string }
  | { kind: "unresolved" };

type AuthenticatedFetch = (url: string, init?: RequestInit) => Promise<Response>;

// Project-side commitment_status values (see TaskCommitmentContent JSDoc in
// generated/gateway.ts: "DRAFT, COMMITTED, ACCEPTED, REFUSED, DENIED,
// REWARDED, ABANDONED, PENDING_TX_*").
const PROJECT_SUCCESS_STATUSES = new Set([
  "COMMITTED",
  "ACCEPTED",
  "REFUSED",
  "DENIED",
  "REWARDED",
  "ABANDONED",
]);
const PROJECT_PENDING_PREFIX = "PENDING_TX_";

// =============================================================================
// Project contributor fallback
// =============================================================================

interface ProjectContext {
  projectId: string;
  taskHash: string;
}

/**
 * Fetch the project-contributor commitment for this (projectId, taskHash) and
 * resolve the TX state. Match on `submission_tx` OR `content.pending_tx_hash`
 * to link the commitment record to the specific TX whose polling timed out.
 */
export async function recoverProjectContributor(
  ctx: ProjectContext,
  txHash: string,
  authenticatedFetch: AuthenticatedFetch,
): Promise<FallbackResolution> {
  let response: Response;
  try {
    response = await withTimeout(
      authenticatedFetch(
        `${GATEWAY_API_BASE}/project/contributor/commitment/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: ctx.projectId,
            task_hash: ctx.taskHash,
          }),
        },
      ),
      INDEXER_FALLBACK_TIMEOUT_MS,
      "indexer-fallback-project",
    );
  } catch (err) {
    console.warn("[tx-indexer-fallback] project fetch threw", err);
    return { kind: "unresolved" };
  }

  if (response.status === 401 || response.status === 404) {
    return { kind: "unresolved" };
  }
  if (!response.ok) {
    console.warn(`[tx-indexer-fallback] project returned ${response.status}`);
    return { kind: "unresolved" };
  }

  let payload: ContributorCommitmentResponse;
  try {
    payload = (await response.json()) as ContributorCommitmentResponse;
  } catch {
    return { kind: "unresolved" };
  }

  const item = payload?.data;
  if (!item) return { kind: "unresolved" };

  // Linkage check: only trust a commitment record that references THIS txHash.
  // content.pending_tx_hash is not on the generated type but is present at runtime
  // (see use-project-contributor.ts:254-259).
  const content = item.content as
    | (ContributorCommitmentItem["content"] & { pending_tx_hash?: string })
    | undefined;
  const matches =
    item.submission_tx === txHash || content?.pending_tx_hash === txHash;
  if (!matches) return { kind: "unresolved" };

  // Resolve from commitment_status (preferred) or on_chain_status (for chain_only rows).
  const rawStatus = content?.commitment_status ?? item.on_chain_status;
  if (!rawStatus) return { kind: "unresolved" };
  const normalized = rawStatus.toUpperCase();

  if (normalized === "DRAFT") {
    return {
      kind: "resolved",
      state: "failed",
      last_error: "Your submission did not land on chain. Please try again.",
    };
  }
  if (normalized.startsWith(PROJECT_PENDING_PREFIX)) {
    return { kind: "unresolved" };
  }
  if (PROJECT_SUCCESS_STATUSES.has(normalized)) {
    return { kind: "resolved", state: "updated" };
  }
  return { kind: "unresolved" };
}

// =============================================================================
// Course assignment fallback (COMMIT-only — see plan Unit 4)
// =============================================================================

interface CourseContext {
  courseId: string;
  moduleCode: string;
  sltHash: string;
}

/**
 * Fetch the course-assignment commitment for this (courseId, moduleCode, sltHash)
 * and resolve the TX state. The endpoint does NOT return a TX hash, so linkage
 * is implicit: we trust that only the currently-failing COMMIT TX could have
 * produced a `PENDING_APPROVAL` status for this slt_hash (pre-submit state is
 * `AWAITING_SUBMISSION` or row-absent; terminal assessor states imply prior
 * commitments and are NOT attributed to the current TX).
 *
 * Crucially, this reads raw fields — it does NOT use the existing transform,
 * which would synthesize `PENDING_APPROVAL` as a default for sparse responses
 * (see use-assignment-commitment.ts:124).
 */
export async function recoverCourseAssignment(
  ctx: CourseContext,
  _txHash: string,
  authenticatedFetch: AuthenticatedFetch,
): Promise<FallbackResolution> {
  let response: Response;
  try {
    response = await withTimeout(
      authenticatedFetch(
        `${GATEWAY_API_BASE}/course/student/assignment-commitment/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: ctx.courseId,
            course_module_code: ctx.moduleCode,
            slt_hash: ctx.sltHash,
          }),
        },
      ),
      INDEXER_FALLBACK_TIMEOUT_MS,
      "indexer-fallback-course",
    );
  } catch (err) {
    console.warn("[tx-indexer-fallback] course fetch threw", err);
    return { kind: "unresolved" };
  }

  if (response.status === 401 || response.status === 404) {
    return { kind: "unresolved" };
  }
  if (!response.ok) {
    console.warn(`[tx-indexer-fallback] course returned ${response.status}`);
    return { kind: "unresolved" };
  }

  let payload: StudentAssignmentCommitmentResponse;
  try {
    payload = (await response.json()) as StudentAssignmentCommitmentResponse;
  } catch {
    return { kind: "unresolved" };
  }

  const item: StudentAssignmentCommitmentItem | undefined = payload?.data;
  if (!item) return { kind: "unresolved" };

  // Read raw fields directly — do NOT inherit the transform's
  // `?? "PENDING_APPROVAL"` default for sparse responses.
  const content: AssignmentCommitmentContent | undefined = item.content;
  const rawCommitmentStatus = content?.commitment_status;
  const rawOnChainStatus = item.on_chain_status;

  // Both absent → no evidence; stay unresolved.
  if (!rawCommitmentStatus && !rawOnChainStatus) {
    return { kind: "unresolved" };
  }

  // Only "SUBMITTED" (off-chain) or "PENDING_APPROVAL" (on-chain) attributable
  // to THIS commit-TX resolves as success. Everything else — ACCEPTED / REFUSED
  // / CREDENTIAL_CLAIMED / LEFT / AWAITING_SUBMISSION — is either a prior
  // commitment or implies the TX didn't land; stay unresolved.
  const off = rawCommitmentStatus?.toUpperCase();
  const on = rawOnChainStatus?.toUpperCase();
  if (off === "SUBMITTED" || on === "PENDING_APPROVAL") {
    return { kind: "resolved", state: "updated" };
  }
  return { kind: "unresolved" };
}

// =============================================================================
// Dispatcher
// =============================================================================

/**
 * Route a recoveryContext to the right fallback function.
 */
export function runIndexerFallback(
  recoveryContext: TxRecoveryContext,
  txHash: string,
  authenticatedFetch: AuthenticatedFetch,
): Promise<FallbackResolution> {
  switch (recoveryContext.kind) {
    case "project_contributor":
      return recoverProjectContributor(
        { projectId: recoveryContext.projectId, taskHash: recoveryContext.taskHash },
        txHash,
        authenticatedFetch,
      );
    case "course_assignment":
      return recoverCourseAssignment(
        {
          courseId: recoveryContext.courseId,
          moduleCode: recoveryContext.moduleCode,
          sltHash: recoveryContext.sltHash,
        },
        txHash,
        authenticatedFetch,
      );
    case "course_credential_claim":
      // No fallback resolver: the on-chain credential token is authoritative,
      // and the variant lacks the per-module identifier a list-endpoint
      // resolver would need to disambiguate. On budget_404 the polling layer's
      // synthetic terminal fires `failed` (never `updated`), so no false
      // success can result.
      return Promise.resolve({ kind: "unresolved" });
    default: {
      // Exhaustiveness check — if a new TxRecoveryContext variant is added
      // without extending this switch, TypeScript will flag the assignment.
      const _exhaustive: never = recoveryContext;
      void _exhaustive;
      return Promise.resolve({ kind: "unresolved" });
    }
  }
}
