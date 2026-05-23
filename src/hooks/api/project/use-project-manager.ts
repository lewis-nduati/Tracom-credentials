/**
 * React Query hooks for Manager Project API endpoints
 *
 * Manager hooks handle project management operations:
 * - Listing managed projects
 * - Viewing pending task assessments
 * - Managing tasks (create, update, delete)
 *
 * ## Assessment Workflow
 *
 * Task assessment is an **on-chain transaction**, not an API mutation.
 * Use `useTransaction({ txType: "PROJECT_MANAGER_TASKS_ASSESS", ... })`
 * to accept, refuse, or deny contributor submissions.
 *
 * The query hooks here (`useManagerCommitments`) fetch pending submissions
 * awaiting assessment. The assessment TX itself is built/signed/submitted
 * through the transaction system, which handles gateway registration and
 * confirmation tracking automatically.
 *
 * ```
 * useManagerCommitments() → list pending submissions
 * useTransaction(PROJECT_MANAGER_TASKS_ASSESS) → assess on-chain
 * useTxStream(txHash) → track confirmation
 * ```
 *
 * ## Reward Claim Note
 *
 * After a manager accepts a submission, the contributor claims their
 * reward by either:
 * - Committing to their next task (automatic reward payout)
 * - Leaving the project (final reward claim on exit)
 *
 * Architecture: Role-based hook file
 * - Imports types and transforms from use-project.ts (entity file)
 * - Exports manager-specific query keys and hooks
 *
 * @example
 * ```tsx
 * import { useManagerProjects, type ManagerProject } from "~/hooks/api/project/use-project-manager";
 *
 * function ManagerStudio() {
 *   const { data: projects, isLoading } = useManagerProjects();
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
import type {
  ManagerProjectsResponse as ApiManagerProjectsResponse,
  ManagerCommitmentsResponse as ApiManagerCommitmentsResponse,
  MergedTasksResponse,
  ManagerProjectListItem,
  ManagerCommitmentItem,
  MergedTaskListItem,
  PendingAssessmentSummary as ApiPendingAssessmentSummary,
  CreateTaskToken,
} from "~/types/generated/gateway";
import {
  projectKeys,
  getProjectStatusFromSource,
  transformMergedTask,
  type ProjectStatus,
  type Task,
  type ProjectPrerequisite,
} from "./use-project";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import { normalizeProjectCommitmentStatus } from "./use-project-contributor";

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query keys for manager project operations
 * Extends the base projectKeys for cache invalidation
 */
export const projectManagerKeys = {
  all: ["manager-projects"] as const,
  list: () => [...projectManagerKeys.all, "list"] as const,
  commitments: (projectId?: string) =>
    [...projectManagerKeys.all, "commitments", projectId] as const,
  tasks: (projectId: string) =>
    [...projectManagerKeys.all, "tasks", projectId] as const,
};

// =============================================================================
// App-Level Types (exported for components)
// =============================================================================

/**
 * Pending assessment summary with camelCase fields
 */
export interface PendingAssessment {
  taskHash: string;
  submittedBy: string;
  submissionTx?: string;
  onChainContent?: string;
}

/**
 * Manager project item with camelCase fields
 * Contains both on-chain and off-chain data
 */
export interface ManagerProject {
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

  // Manager-specific: pending assessments
  pendingAssessments?: PendingAssessment[];
}

/**
 * Task context info from manager commitment
 */
export interface ManagerCommitmentTaskInfo {
  lovelaceAmount?: number;
  expirationTime?: string;
  expirationPosix?: number;
  onChainContent?: string;
  assets?: unknown;
}

/**
 * Manager commitment item with camelCase fields
 * Contains pending task submissions awaiting manager assessment
 */
export interface ManagerCommitment {
  // Identifiers
  projectId: string;
  taskHash: string;
  submittedBy: string;

  // On-chain submission info
  submissionTx?: string;
  onChainContent?: string;

  // Off-chain content (contributor's evidence)
  commitmentStatus?: string;
  taskEvidenceHash?: string;
  evidence?: unknown;
  assessedBy?: string;
  taskOutcome?: string;

  // Task context
  task?: ManagerCommitmentTaskInfo;

  // Metadata
  status: ProjectStatus;
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform ApiPendingAssessmentSummary → PendingAssessment
 */
function transformPendingAssessment(
  api: ApiPendingAssessmentSummary
): PendingAssessment {
  return {
    taskHash: api.task_hash ?? "",
    submittedBy: api.submitted_by ?? "",
    submissionTx: api.submission_tx,
    onChainContent: api.on_chain_content,
  };
}

/**
 * Transform ManagerProjectListItem → ManagerProject
 */
function transformManagerProject(api: ManagerProjectListItem): ManagerProject {
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

    // Manager-specific
    pendingAssessments: api.pending_assessments?.map(transformPendingAssessment),
  };
}

/**
 * Transform ManagerCommitmentItem → ManagerCommitment
 */
function transformManagerCommitment(api: ManagerCommitmentItem): ManagerCommitment {
  return {
    // Identifiers
    projectId: api.project_id ?? "",
    taskHash: api.task_hash ?? "",
    submittedBy: api.submitted_by ?? "",

    // On-chain submission info
    submissionTx: api.submission_tx,
    onChainContent: api.on_chain_content,

    // Off-chain content (chain_only items in pending list are always COMMITTED)
    commitmentStatus: api.content?.commitment_status
      ? normalizeProjectCommitmentStatus(api.content.commitment_status)
      : api.source === "chain_only"
        ? "COMMITTED"
        : "UNKNOWN",
    taskEvidenceHash: api.content?.task_evidence_hash,
    evidence: api.content?.evidence,
    assessedBy: api.content?.assessed_by,
    taskOutcome: api.content?.task_outcome,

    // Task context
    task: api.task
      ? {
          lovelaceAmount: api.task.lovelace_amount,
          expirationTime: api.task.expiration_posix
            ? String(api.task.expiration_posix)
            : undefined,
          expirationPosix: api.task.expiration_posix,
          onChainContent: api.task.on_chain_content,
          assets: api.task.assets,
        }
      : undefined,

    // Metadata
    status: getProjectStatusFromSource(api.source),
  };
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch projects the authenticated user manages
 *
 * Uses merged endpoint: POST /api/v2/project/manager/projects/list
 * Returns projects with both on-chain state and DB content.
 *
 * @example
 * ```tsx
 * function ProjectStudio() {
 *   const { data: projects, isLoading, error, refetch } = useManagerProjects();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!projects?.length) return <EmptyState />;
 *
 *   return <ProjectList projects={projects} />;
 * }
 * ```
 */
export function useManagerProjects() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: projectManagerKeys.list(),
    queryFn: async (): Promise<ManagerProject[]> => {
      // Merged endpoint: POST /api/v2/project/manager/projects/list
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/manager/projects/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      // 404 means no projects or endpoint not implemented - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch manager projects: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiManagerProjectsResponse;

      // Log warning if partial data returned
      if (result.meta?.warning) {
        console.warn("[useManagerProjects] API warning:", result.meta?.warning);
      }

      // Transform to app-level types with camelCase fields
      return (result.data ?? []).map(transformManagerProject);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/**
 * Fetch pending task commitments for a manager
 *
 * Uses merged endpoint: POST /api/v2/project/manager/commitments/list
 * Returns pending task submissions awaiting assessment.
 *
 * @param projectId - Required project ID to scope the query.
 *   Gateway returns 400 if project_id is empty/missing (andamio-api#373).
 *
 * @example
 * ```tsx
 * function PendingReviews({ projectId }: { projectId: string }) {
 *   const { data: commitments, isLoading, error } = useManagerCommitments(projectId);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!commitments?.length) return <AllCaughtUp />;
 *
 *   return <CommitmentList commitments={commitments} />;
 * }
 * ```
 */
export function useManagerCommitments(
  projectId: string,
  options?: { enabled?: boolean }
) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: projectManagerKeys.commitments(projectId),
    queryFn: async (): Promise<ManagerCommitment[]> => {
      // Merged endpoint: POST /api/v2/project/manager/commitments/list
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/manager/commitments/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId }),
        }
      );

      // 404 means no commitments - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch manager commitments: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiManagerCommitmentsResponse;

      // Log warning if partial data returned
      if (result.meta?.warning) {
        console.warn("[useManagerCommitments] API warning:", result.meta?.warning);
      }

      // Transform to app-level types with camelCase fields
      return (result.data ?? []).map(transformManagerCommitment);
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 60_000,
  });
}

/**
 * Fetch tasks for a managed project
 *
 * Uses: POST /api/v2/project/manager/tasks/list
 * Returns Task[] with flat camelCase fields
 *
 * @param projectId - Project ID
 *
 * @example
 * ```tsx
 * function ManagerTaskList({ projectId }: { projectId: string }) {
 *   const { data: tasks, isLoading } = useManagerTasks(projectId);
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return tasks?.map(task => (
 *     <TaskEditor key={task.taskHash} task={task} />
 *   ));
 * }
 * ```
 */
export function useManagerTasks(projectId: string | undefined) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: projectManagerKeys.tasks(projectId ?? ""),
    queryFn: async (): Promise<Task[]> => {
      // POST /project/manager/tasks/list
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/manager/tasks/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId }),
        }
      );

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch manager tasks: ${response.statusText}`);
      }

      const result = (await response.json()) as
        | MergedTasksResponse
        | MergedTaskListItem[];

      // Handle both wrapped { data: [...] } and raw array formats
      let items: MergedTaskListItem[];

      if (Array.isArray(result)) {
        items = result;
      } else {
        if (result.meta?.warning) {
          console.warn("[useManagerTasks] API warning:", result.meta?.warning);
        }
        items = result.data ?? [];
      }

      return items.map(transformMergedTask);
    },
    enabled: !!projectId && isAuthenticated,
    staleTime: 60_000,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new task in a project
 *
 * @example
 * ```tsx
 * function CreateTaskForm({ projectId }: { projectId: string }) {
 *   const createTask = useCreateTask();
 *
 *   const handleSubmit = async (data: TaskFormData) => {
 *     await createTask.mutateAsync({
 *       projectId,
 *       title: data.title,
 *       description: data.description,
 *       lovelaceAmount: data.reward,
 *       expirationPosix: data.deadline,
 *     });
 *     toast.success("Task created!");
 *   };
 *
 *   return <TaskForm onSubmit={handleSubmit} isLoading={createTask.isPending} />;
 * }
 * ```
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      contributorStateId: string;
      title: string;
      content?: string;
      lovelaceAmount: string;
      expirationTime: string;
      contentJson?: unknown;
      tokens?: CreateTaskToken[];
    }) => {
      // Endpoint: POST /project/manager/task/create
      // API expects: contributor_state_id (required), title, lovelace_amount, expiration_time
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/manager/task/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contributor_state_id: input.contributorStateId,
            title: input.title,
            content: input.content,
            lovelace_amount: input.lovelaceAmount,
            expiration_time: input.expirationTime,
            content_json: input.contentJson,
            ...(input.tokens?.length ? { tokens: input.tokens } : {}),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to create task: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText) as { message?: string };
          errorMessage = errorData.message ?? errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: projectManagerKeys.tasks(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: projectKeys.tasks(variables.projectId),
      });
    },
  });
}

/**
 * Update an existing task
 *
 * @example
 * ```tsx
 * function EditTaskForm({ task }: { task: Task }) {
 *   const updateTask = useUpdateTask();
 *
 *   const handleSubmit = async (data: TaskFormData) => {
 *     await updateTask.mutateAsync({
 *       projectId: task.projectId,
 *       taskHash: task.taskHash,
 *       data: {
 *         title: data.title,
 *         description: data.description,
 *       },
 *     });
 *     toast.success("Task updated!");
 *   };
 *
 *   return <TaskForm task={task} onSubmit={handleSubmit} isLoading={updateTask.isPending} />;
 * }
 * ```
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      contributorStateId: string;
      index: number;
      title: string;
      content?: string;
      lovelaceAmount: string;
      expirationTime: string;
      contentJson?: unknown;
      tokens?: CreateTaskToken[];
    }) => {
      // Endpoint: POST /project/manager/task/update
      // API expects: contributor_state_id (required), index (required)
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/manager/task/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contributor_state_id: input.contributorStateId,
            index: input.index,
            title: input.title,
            content: input.content,
            lovelace_amount: input.lovelaceAmount,
            expiration_time: input.expirationTime,
            content_json: input.contentJson,
            ...(input.tokens?.length ? { tokens: input.tokens } : {}),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to update task: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText) as { message?: string };
          errorMessage = errorData.message ?? errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: projectManagerKeys.tasks(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: projectKeys.tasks(variables.projectId),
      });
    },
  });
}

/**
 * Delete a task from a project
 *
 * @example
 * ```tsx
 * function DeleteTaskButton({ task }: { task: Task }) {
 *   const deleteTask = useDeleteTask();
 *
 *   const handleDelete = async () => {
 *     if (confirm("Are you sure?")) {
 *       await deleteTask.mutateAsync({
 *         projectId: task.projectId,
 *         taskHash: task.taskHash,
 *       });
 *       toast.success("Task deleted!");
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete} variant="destructive">Delete</Button>;
 * }
 * ```
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      contributorStateId: string;
      /** Task position index (from task_index field) */
      taskIndex: number;
    }) => {
      // Endpoint: POST /project/manager/task/delete
      // API identifies tasks by contributor_state_id + index (per #148)
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/manager/task/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contributor_state_id: input.contributorStateId,
            index: input.taskIndex,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to delete task: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText) as { message?: string };
          errorMessage = errorData.message ?? errorMessage;
        } catch {
          // Use default error message
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: projectManagerKeys.tasks(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: projectKeys.tasks(variables.projectId),
      });
    },
  });
}

/**
 * Hook to invalidate manager projects cache
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateManagerProjects();
 *
 * // After creating a new project
 * await invalidate();
 * ```
 */
export function useInvalidateManagerProjects() {
  const queryClient = useQueryClient();

  return useCallback(
    async () => {
      await queryClient.invalidateQueries({
        queryKey: projectManagerKeys.all,
      });
    },
    [queryClient],
  );
}

/**
 * Input for batch task status update
 */
export interface TaskBatchStatusInput {
  projectId: string;
  contributorStateId: string;
  tasks: Array<{
    index: number;
    set_task_hash?: string;
    status: "PENDING_TX" | "ON_CHAIN";
  }>;
}

/**
 * Batch update task status
 *
 * Used to mark tasks as PENDING_TX before on-chain submission.
 * This allows the UI to show proper loading states while transactions are pending.
 *
 * @example
 * ```tsx
 * function TreasuryManager({ projectId, tasks }: Props) {
 *   const batchStatus = useTaskBatchStatus();
 *
 *   const handleSubmitToChain = async () => {
 *     // Mark tasks as pending before submitting transaction
 *     await batchStatus.mutateAsync({
 *       contributorStateId: projectId,
 *       tasks: tasks.map((t, i) => ({ index: i, status: "PENDING_TX" })),
 *     });
 *
 *     // Submit transaction...
 *   };
 *
 *   return <Button onClick={handleSubmitToChain} disabled={batchStatus.isPending}>Submit</Button>;
 * }
 * ```
 */
export function useTaskBatchStatus() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (input: TaskBatchStatusInput) => {
      // Endpoint: POST /project/manager/tasks/batch-status
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/manager/tasks/batch-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contributor_state_id: input.contributorStateId,
            tasks: input.tasks.map((t) => ({
              index: t.index,
              ...(t.set_task_hash ? { set_task_hash: t.set_task_hash } : {}),
              status: t.status,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update task status: ${response.statusText} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate manager tasks for this project
      void queryClient.invalidateQueries({
        queryKey: projectManagerKeys.tasks(variables.projectId),
      });
      // Invalidate public tasks
      void queryClient.invalidateQueries({
        queryKey: projectKeys.tasks(variables.projectId),
      });
    },
  });
}

// =============================================================================
// Response Type Aliases (for backward compatibility)
// =============================================================================

/**
 * Response wrapper for manager projects list
 * @deprecated Import ManagerProject[] directly
 */
export type ManagerProjectsResponse = ManagerProject[];

/**
 * Response wrapper for manager commitments list
 * @deprecated Import ManagerCommitment[] directly
 */
export type ManagerCommitmentsResponse = ManagerCommitment[];
