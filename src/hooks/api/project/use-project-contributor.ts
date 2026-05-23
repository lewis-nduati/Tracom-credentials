/**
 * React Query hooks for Contributor Project API endpoints
 *
 * Contributor hooks handle project participation operations:
 * - Listing projects the user contributes to
 * - Managing task commitments (create, update, delete)
 * - Viewing commitment status
 *
 * ## Reward Claim Lifecycle
 *
 * Task rewards are NOT claimed via a standalone endpoint. Instead, rewards
 * are claimed implicitly through two paths:
 *
 * **Path A — Commit to next task**: When a contributor commits to a new task
 * via `useCreateCommitment`, they automatically receive rewards from their
 * previously completed (accepted) task. The on-chain TX handles both the
 * new commitment and the reward payout in a single transaction.
 *
 * **Path B — Leave project**: When a contributor un-enrolls from a project,
 * they claim rewards from their latest completed task as part of exiting.
 * This is handled by the `ProjectCredentialClaim` TX component using
 * `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` — no separate hook needed.
 *
 * This means there is no `useClaimReward` hook — reward distribution is
 * built into the commit and leave operations at the protocol level.
 *
 * Architecture: Role-based hook file
 * - Imports types and transforms from use-project.ts (entity file)
 * - Exports contributor-specific query keys and hooks
 *
 * @example
 * ```tsx
 * import { useContributorProjects, type ContributorProject } from "~/hooks/api/project/use-project-contributor";
 *
 * function ContributorDashboard() {
 *   const { data: projects, isLoading } = useContributorProjects();
 *
 *   return projects?.map(project => (
 *     <ProjectCard key={project.projectId} project={project} />
 *   ));
 * }
 * ```
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import type { JSONContent } from "@tiptap/core";
import type {
  ContributorProjectsResponse as ApiContributorProjectsResponse,
  ContributorCommitmentsResponse as ApiContributorCommitmentsResponse,
  ContributorCommitmentResponse as ApiContributorCommitmentResponse,
  ContributorProjectListItem,
  ContributorCommitmentItem,
  MyCommitmentSummary as ApiMyCommitmentSummary,
} from "~/types/generated/gateway";
import {
  getProjectStatusFromSource,
  type ProjectStatus,
  type ProjectPrerequisite,
} from "./use-project";
import { GATEWAY_API_BASE } from "~/lib/api-utils";

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query keys for contributor project operations
 * Extends the base projectKeys for cache invalidation
 */
export const projectContributorKeys = {
  all: ["contributor-projects"] as const,
  list: () => [...projectContributorKeys.all, "list"] as const,
  commitments: (projectId?: string) =>
    [...projectContributorKeys.all, "commitments", projectId] as const,
  commitment: (projectId: string, taskHash: string) =>
    [...projectContributorKeys.all, "commitment", projectId, taskHash] as const,
};

// =============================================================================
// App-Level Types (exported for components)
// =============================================================================

/**
 * Commitment summary from contributor's perspective
 */
export interface MyCommitmentSummary {
  taskHash: string;
  commitmentStatus: string;
  taskEvidenceHash?: string;
  evidence?: unknown;
  evidenceUrl?: string;
  notes?: string;
}

/**
 * Contributor project item with camelCase fields
 * Contains both on-chain and off-chain data
 */
export interface ContributorProject {
  // Identity
  projectId: string;
  status: ProjectStatus;

  // Content (flattened from content.*)
  title: string;
  description?: string;
  imageUrl?: string;

  // On-chain fields
  projectAddress?: string;
  treasuryAddress?: string;
  contributorStateId?: string;
  owner?: string;
  managers?: string[];
  createdTx?: string;
  createdSlot?: number;
  createdAt?: string;

  // Prerequisites
  prerequisites?: ProjectPrerequisite[];

  // Contributor-specific: user's own commitments
  myCommitments?: MyCommitmentSummary[];
}

/**
 * Contributor commitment item with camelCase fields
 * Contains the contributor's task commitment details
 */
export interface ContributorCommitment {
  // Identifiers
  projectId: string;
  taskHash: string;

  // On-chain info
  submissionTx?: string;
  onChainContent?: string;
  onChainStatus?: string;

  // Off-chain content (contributor's evidence)
  commitmentStatus?: string;
  taskEvidenceHash?: string;
  evidence?: unknown;
  evidenceUrl?: string;
  notes?: string;
  assessedBy?: string;
  taskOutcome?: string;

  // Transaction tracking
  pendingTxHash?: string;

  // Metadata
  status: ProjectStatus;
}

// =============================================================================
// Status Normalization
// =============================================================================

/**
 * Normalize project commitment status to uppercase display values.
 *
 * The gateway may send lowercase (OpenAPI: "committed, submitted, approved")
 * or uppercase (DB: "DRAFT, COMMITTED, ACCEPTED"). Components expect uppercase.
 * This normalizer handles both and maps legacy values.
 *
 * Valid statuses: DRAFT, COMMITTED, ACCEPTED, REFUSED, DENIED, REWARDED, ABANDONED,
 *   PENDING_TX_COMMIT, PENDING_TX_ASSESS, PENDING_TX_CLAIM, PENDING_TX_LEAVE
 * Legacy aliases: APPROVED → ACCEPTED, REJECTED → REFUSED,
 *   SUBMITTED → COMMITTED (#469), PENDING_TX_SUBMIT → PENDING_TX_COMMIT (#460)
 */
const PROJECT_STATUS_MAP: Record<string, string> = {
  ACCEPTED: "ACCEPTED",
  REFUSED: "REFUSED",
  REWARDED: "REWARDED",
  DENIED: "DENIED",
  // Legacy aliases
  APPROVED: "ACCEPTED",
  REJECTED: "REFUSED",
  // API normalization (#469): SUBMITTED renamed to COMMITTED in v2.1.3
  SUBMITTED: "COMMITTED",
  PENDING_TX_SUBMIT: "PENDING_TX_COMMIT",
};

export function normalizeProjectCommitmentStatus(raw: string | undefined): string {
  if (!raw) return "UNKNOWN";
  const upper = raw.toUpperCase();
  return PROJECT_STATUS_MAP[upper] ?? upper;
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform ApiMyCommitmentSummary → MyCommitmentSummary
 */
function transformMyCommitmentSummary(
  api: ApiMyCommitmentSummary
): MyCommitmentSummary {
  return {
    taskHash: api.task_hash ?? "",
    commitmentStatus: normalizeProjectCommitmentStatus(api.commitment_status),
    taskEvidenceHash: api.content?.task_evidence_hash,
    evidence: api.content?.evidence,
  };
}

/**
 * Transform ContributorProjectListItem → ContributorProject
 */
function transformContributorProject(
  api: ContributorProjectListItem
): ContributorProject {
  return {
    // Identity
    projectId: api.project_id ?? "",
    status: getProjectStatusFromSource(api.source),

    // Flattened content fields
    title: api.content?.title ?? "",
    description: api.content?.description,
    imageUrl: api.content?.image_url,

    // On-chain fields
    projectAddress: api.project_address,
    treasuryAddress: api.treasury_address,
    contributorStateId: api.contributor_state_id,
    owner: api.owner,
    managers: api.managers,
    createdTx: api.created_tx,
    createdSlot: api.created_slot,
    createdAt: api.created_at,

    // Prerequisites
    prerequisites: api.prerequisites?.map((p) => ({
      courseId: p.course_id ?? "",
      sltHashes: p.slt_hashes,
    })),

    // Contributor-specific
    myCommitments: api.my_commitments?.map(transformMyCommitmentSummary),
  };
}

/**
 * Transform ContributorCommitmentItem → ContributorCommitment
 */
function transformContributorCommitment(
  api: ContributorCommitmentItem
): ContributorCommitment {
  // Content may include pending_tx_hash not in the generated type
  const content = api.content as
    | (ContributorCommitmentItem["content"] & {
        pending_tx_hash?: string;
      })
    | undefined;

  return {
    // Identifiers
    projectId: api.project_id ?? "",
    taskHash: api.task_hash ?? "",

    // On-chain info
    submissionTx: api.submission_tx,
    onChainContent: api.on_chain_content,
    onChainStatus: api.on_chain_status,

    // Off-chain content (normalized to uppercase)
    // Chain-only items have no DB content — derive status from on_chain_status.
    // Unlike the manager hook (which hardcodes "COMMITTED" since its list only
    // contains pending assessments), the contributor view shows all states.
    commitmentStatus: content?.commitment_status
      ? normalizeProjectCommitmentStatus(content.commitment_status)
      : api.source === "chain_only"
        ? normalizeProjectCommitmentStatus(api.on_chain_status)
        : "UNKNOWN",
    taskEvidenceHash: content?.task_evidence_hash,
    evidence: content?.evidence,
    assessedBy: content?.assessed_by,
    taskOutcome: content?.task_outcome,

    // Transaction tracking
    pendingTxHash: content?.pending_tx_hash,

    // Metadata
    status: getProjectStatusFromSource(api.source),
  };
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch projects the authenticated user contributes to
 *
 * Uses merged endpoint: POST /api/v2/project/contributor/projects/list
 * Returns projects with both on-chain state and DB content.
 *
 * @example
 * ```tsx
 * function ContributorDashboard() {
 *   const { data: projects, isLoading, error, refetch } = useContributorProjects();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!projects?.length) return <EmptyState />;
 *
 *   return <ProjectList projects={projects} />;
 * }
 * ```
 */
export function useContributorProjects() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: projectContributorKeys.list(),
    queryFn: async (): Promise<ContributorProject[]> => {
      // Merged endpoint: POST /api/v2/project/contributor/projects/list
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/contributor/projects/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      // 404 means no projects - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch contributor projects: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiContributorProjectsResponse;

      // Log warning if partial data returned
      if (result.meta?.warning) {
        console.warn("[useContributorProjects] API warning:", result.meta?.warning);
      }

      // Transform to app-level types with camelCase fields
      return (result.data ?? []).map(transformContributorProject);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/**
 * Fetch contributor's task commitments
 *
 * Uses merged endpoint: POST /api/v2/project/contributor/commitments/list
 * Returns the contributor's task commitments with status.
 *
 * @param projectId - Optional project ID to filter commitments
 *
 * @example
 * ```tsx
 * function MyCommitments() {
 *   const { data: commitments, isLoading, error, refetch } = useContributorCommitments();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!commitments?.length) return <NoCommitments />;
 *
 *   return <CommitmentList commitments={commitments} />;
 * }
 * ```
 */
export function useContributorCommitments(projectId?: string) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: projectContributorKeys.commitments(projectId),
    queryFn: async (): Promise<ContributorCommitment[]> => {
      // Merged endpoint: POST /api/v2/project/contributor/commitments/list
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/contributor/commitments/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectId ? { project_id: projectId } : {}),
        }
      );

      // 404 means no commitments - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch contributor commitments: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiContributorCommitmentsResponse;

      // Log warning if partial data returned
      if (result.meta?.warning) {
        console.warn("[useContributorCommitments] API warning:", result.meta?.warning);
      }

      // Transform to app-level types with camelCase fields
      return (result.data ?? []).map(transformContributorCommitment);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/**
 * Fetch a specific contributor commitment
 *
 * Uses: POST /api/v2/project/contributor/commitment/get
 * Returns a single commitment with full details.
 *
 * @param projectId - Project ID
 * @param taskHash - Task hash (content-addressed task identifier)
 *
 * @example
 * ```tsx
 * function CommitmentDetail({ projectId, taskHash }: { projectId: string; taskHash: string }) {
 *   const { data: commitment, isLoading } = useContributorCommitment(projectId, taskHash);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!commitment) return <NotFound />;
 *
 *   return <CommitmentDetails commitment={commitment} />;
 * }
 * ```
 */
export function useContributorCommitment(
  projectId: string | undefined,
  taskHash: string | undefined
) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: projectContributorKeys.commitment(projectId ?? "", taskHash ?? ""),
    queryFn: async (): Promise<ContributorCommitment | null> => {
      // Endpoint: POST /api/v2/project/contributor/commitment/get
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/contributor/commitment/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            task_hash: taskHash,
          }),
        }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch commitment: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiContributorCommitmentResponse;

      if (result.meta?.warning) {
        console.warn("[useContributorCommitment] API warning:", result.meta.warning);
      }

      if (!result.data) return null;

      return transformContributorCommitment(result.data);
    },
    enabled: !!projectId && !!taskHash && isAuthenticated,
    staleTime: 60_000,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new task commitment
 *
 * **Reward claim (Path A):** When a contributor already has a completed
 * (accepted) task in this project, committing to a new task automatically
 * claims the reward from the previous task. The on-chain transaction
 * handles both the new commitment and the reward payout atomically.
 *
 * UX should inform contributors that committing to a new task will also
 * release their pending rewards from the previous task.
 *
 * @example
 * ```tsx
 * function CommitToTask({ projectId, taskHash }: { projectId: string; taskHash: string }) {
 *   const createCommitment = useCreateCommitment();
 *
 *   const handleCommit = async () => {
 *     await createCommitment.mutateAsync({
 *       projectId,
 *       taskHash,
 *     });
 *     toast.success("Committed to task!");
 *   };
 *
 *   return <Button onClick={handleCommit} disabled={createCommitment.isPending}>Commit</Button>;
 * }
 * ```
 */
export function useCreateCommitment() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      taskHash: string;
    }) => {
      // Endpoint: POST /project/contributor/commitment/create
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/contributor/commitment/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: input.projectId,
            task_hash: input.taskHash,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create commitment: ${response.statusText} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate contributor commitments
      void queryClient.invalidateQueries({
        queryKey: projectContributorKeys.commitments(variables.projectId),
      });
      // Invalidate specific commitment
      void queryClient.invalidateQueries({
        queryKey: projectContributorKeys.commitment(variables.projectId, variables.taskHash),
      });
      // Invalidate contributor projects (myCommitments changed)
      void queryClient.invalidateQueries({
        queryKey: projectContributorKeys.all,
      });
    },
  });
}

// =============================================================================
// Submit Task Evidence (fire-and-forget after TX)
// =============================================================================

/** Input for submitting task evidence to the database */
export interface SubmitTaskEvidenceInput {
  taskHash: string;
  evidence: JSONContent;
  evidenceHash: string;
  pendingTxHash: string;
}

/**
 * Submit task evidence content to the database after a successful TX.
 *
 * This is a fire-and-forget style mutation — the on-chain TX is the source of truth,
 * so DB save errors are logged but don't throw.
 *
 * On success, invalidates the matching contributor commitment query.
 *
 * @example
 * ```tsx
 * const submitEvidence = useSubmitTaskEvidence();
 *
 * // After TX success:
 * submitEvidence.mutate({
 *   taskHash: "abc123...",
 *   evidence: tiptapContent,
 *   evidenceHash: computedHash,
 *   pendingTxHash: txResult.txHash,
 * });
 * ```
 */
export function useSubmitTaskEvidence() {
  const { authenticatedFetch } = useAndamioAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitTaskEvidenceInput): Promise<void> => {
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/contributor/commitment/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_hash: input.taskHash,
            evidence: input.evidence,
            evidence_hash: input.evidenceHash,
            pending_tx_hash: input.pendingTxHash,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "[useSubmitTaskEvidence] Failed to save evidence to DB:",
          errorText,
        );
        // Don't throw — TX succeeded, evidence save is secondary
        return;
      }

      console.log("[useSubmitTaskEvidence] Evidence saved to database");
    },
    onSuccess: (_data, variables) => {
      // Invalidate contributor commitments to refetch with new evidence
      void queryClient.invalidateQueries({
        queryKey: projectContributorKeys.all,
      });
      // Also invalidate specific commitment if we know the project
      void queryClient.invalidateQueries({
        queryKey: [...projectContributorKeys.all, "commitment"],
        predicate: (query) =>
          query.queryKey.includes(variables.taskHash),
      });
    },
  });
}

/**
 * Update an existing commitment (submit evidence)
 *
 * @example
 * ```tsx
 * function SubmitEvidence({ commitment }: { commitment: ContributorCommitment }) {
 *   const updateCommitment = useUpdateCommitment();
 *
 *   const handleSubmit = async (evidence: EvidenceData) => {
 *     await updateCommitment.mutateAsync({
 *       projectId: commitment.projectId,
 *       taskHash: commitment.taskHash,
 *       data: {
 *         evidenceUrl: evidence.url,
 *         notes: evidence.notes,
 *       },
 *     });
 *     toast.success("Evidence submitted!");
 *   };
 *
 *   return <EvidenceForm onSubmit={handleSubmit} isLoading={updateCommitment.isPending} />;
 * }
 * ```
 */
export function useUpdateCommitment() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      taskHash,
      data,
    }: {
      projectId: string;
      taskHash: string;
      data: Partial<{
        evidence: unknown;
        evidenceUrl: string;
        notes: string;
      }>;
    }) => {
      // Endpoint: POST /project/contributor/commitment/update
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/contributor/commitment/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            task_hash: taskHash,
            evidence: data.evidence,
            evidence_url: data.evidenceUrl,
            notes: data.notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update commitment: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate specific commitment
      void queryClient.invalidateQueries({
        queryKey: projectContributorKeys.commitment(variables.projectId, variables.taskHash),
      });
      // Invalidate contributor commitments list
      void queryClient.invalidateQueries({
        queryKey: projectContributorKeys.commitments(variables.projectId),
      });
      // Invalidate contributor projects (myCommitments changed)
      void queryClient.invalidateQueries({
        queryKey: projectContributorKeys.all,
      });
    },
  });
}

/**
 * Delete/abandon a task commitment
 *
 * **Note:** This abandons a single task commitment. It does NOT claim
 * rewards and does NOT un-enroll the contributor from the project.
 *
 * To un-enroll from a project AND claim pending rewards, use the
 * `ProjectCredentialClaim` TX component (`PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM`).
 *
 * @example
 * ```tsx
 * function DeleteCommitment({ commitment }: { commitment: ContributorCommitment }) {
 *   const deleteCommitment = useDeleteCommitment();
 *
 *   const handleDelete = async () => {
 *     if (confirm("Are you sure you want to abandon this task?")) {
 *       await deleteCommitment.mutateAsync({
 *         projectId: commitment.projectId,
 *         taskHash: commitment.taskHash,
 *       });
 *       toast.success("Commitment deleted");
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete} variant="destructive">Abandon Task</Button>;
 * }
 * ```
 */
export function useDeleteCommitment() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      taskHash,
    }: {
      projectId: string;
      taskHash: string;
    }) => {
      // Endpoint: POST /project/contributor/commitment/delete
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/contributor/commitment/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            task_hash: taskHash,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete commitment: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Remove specific commitment from cache
      queryClient.removeQueries({
        queryKey: projectContributorKeys.commitment(variables.projectId, variables.taskHash),
      });
      // Invalidate contributor commitments list
      void queryClient.invalidateQueries({
        queryKey: projectContributorKeys.commitments(variables.projectId),
      });
      // Invalidate contributor projects (myCommitments changed)
      void queryClient.invalidateQueries({
        queryKey: projectContributorKeys.all,
      });
    },
  });
}

/**
 * Hook to invalidate contributor projects cache
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateContributorProjects();
 *
 * // After joining a project
 * await invalidate();
 * ```
 */
export function useInvalidateContributorProjects() {
  const queryClient = useQueryClient();

  return useCallback(
    async () => {
      await queryClient.invalidateQueries({
        queryKey: projectContributorKeys.all,
      });
    },
    [queryClient],
  );
}

// =============================================================================
// Response Type Aliases (for backward compatibility)
// =============================================================================

/**
 * Response wrapper for contributor projects list
 * @deprecated Import ContributorProject[] directly
 */
export type ContributorProjectsResponse = ContributorProject[];
