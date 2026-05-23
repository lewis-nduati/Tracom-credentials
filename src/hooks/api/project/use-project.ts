/**
 * React Query hooks for Project API endpoints
 *
 * Provides cached, deduplicated access to project data across the app.
 * Returns app-level types (Project, Task) - not raw API types.
 *
 * Architecture: Colocated Types Pattern
 * - App-level types (Project, Task, TaskCommitment) defined here with camelCase fields
 * - Transform functions convert API snake_case to app camelCase
 * - Components import types from this hook, never from generated types
 *
 * @example
 * ```tsx
 * import { useProject, type Project, type Task } from "~/hooks/api/project/use-project";
 *
 * // Get a project by ID - cached across all components
 * const { data: project, isLoading } = useProject(projectId);
 * // project is type Project with flat fields: project.title, project.description
 * ```
 */

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// Import directly from gateway.ts to avoid circular dependency with ~/types/generated/index.ts
import type {
  MergedProjectDetailResponse,
  MergedProjectsResponse,
  MergedTasksResponse,
  MergedProjectDetail,
  MergedProjectListItem,
  MergedTaskListItem,
  ProjectTaskOnChain,
  ProjectContributorOnChain,
  ProjectSubmissionOnChain,
  ProjectAssessmentOnChain,
  ProjectTreasuryFundingOnChain,
  ProjectCredentialClaimOnChain,
  ProjectPrerequisite as ApiProjectPrerequisite,
} from "~/types/generated/gateway";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import { getPreAssignedAlias } from "~/lib/task-metadata";

// =============================================================================
// App-Level Types (exported for components)
// =============================================================================

/**
 * Lifecycle status for a project
 * - "draft": In DB only, not yet published on-chain
 * - "active": On-chain and registered in DB (fully operational)
 * - "unregistered": On-chain but missing DB registration (needs /register endpoint)
 */
export type ProjectStatus = "draft" | "active" | "unregistered";

/**
 * Derive semantic status from API source field
 *
 * API source values: "merged", "chain_only", "db_only"
 *
 * Status derivation logic:
 * | source     | → status      |
 * |------------|---------------|
 * | merged     | active        |
 * | chain_only | unregistered  |
 * | db_only    | draft         |
 */
export function getProjectStatusFromSource(source: string | undefined): ProjectStatus {
  switch (source) {
    case "merged":
      return "active";
    case "chain_only":
      return "unregistered";
    case "db_only":
    default:
      return "draft";
  }
}

/**
 * Task token (native asset)
 */
export interface TaskToken {
  policyId: string;
  assetName: string;
  quantity: number;
}

/**
 * Task status values from the API
 * - "DRAFT": Task exists in DB but not on-chain
 * - "PENDING_TX": Task transaction submitted, awaiting confirmation
 * - "ON_CHAIN": Task has been published on-chain
 */
export type TaskStatusValue = "DRAFT" | "PENDING_TX" | "ON_CHAIN";

/**
 * Task - flattened task type for components
 * Uses taskHash as primary identifier (content-addressed)
 */
export interface Task {
  // Identity - taskHash is content-addressed, projectId is Cardano policy ID
  taskHash: string;
  projectId: string;
  index?: number;

  // Content (flattened from nested content object)
  title: string;
  description: string;
  imageUrl?: string;
  contentJson?: unknown;

  // Status & metadata
  status: ProjectStatus;
  /** Task publication status: "DRAFT" or "ON_CHAIN" */
  taskStatus?: TaskStatusValue;
  /** Number of active commitments (excludes ABANDONED, DENIED). From dbapi#188. */
  commitmentCount: number;
  createdByAlias?: string;

  // Rewards
  lovelaceAmount: string;
  expirationTime?: string;
  expirationPosix?: number;
  tokens?: TaskToken[];

  // Evidence (for commitments)
  taskEvidenceHash?: string;

  // On-chain data
  onChainContent?: string;
  contributorStateId?: string;

  // Pre-assignment (Web2 only, stored in contentJson._metadata)
  preAssignedAlias: string | null;
}

/**
 * TaskGroup - groups tasks with the same taskHash (content hash)
 *
 * When a project manager creates multiple identical tasks (e.g., "Review PR" × 5),
 * they share the same taskHash. Each instance is a separate on-chain UTxO with
 * unique contributorStateId.
 *
 * Use groupTasksByHash() to convert Task[] → TaskGroup[] for display.
 */
export interface TaskGroup {
  /** The shared taskHash (content hash) */
  taskHash: string;
  /** Number of task instances with this hash */
  count: number;
  /** Representative task (first in the group) for display purposes */
  representative: Task;
  /** All task instances with this hash */
  instances: Task[];
}

/**
 * Group tasks by taskHash for display
 *
 * @param tasks - Array of tasks (may include duplicates by taskHash)
 * @returns Array of TaskGroups, each containing tasks with the same hash
 *
 * @example
 * ```tsx
 * const tasks = useProjectTasks(projectId);
 * const groups = groupTasksByHash(tasks.data ?? []);
 *
 * groups.map(group => (
 *   <div key={group.taskHash}>
 *     {group.representative.title}
 *     {group.count > 1 && <span>(×{group.count})</span>}
 *   </div>
 * ));
 * ```
 */
export function groupTasksByHash(tasks: Task[]): TaskGroup[] {
  const groupMap = new Map<string, Task[]>();

  for (const task of tasks) {
    const hash = task.taskHash || "";
    const existing = groupMap.get(hash);
    if (existing) {
      existing.push(task);
    } else {
      groupMap.set(hash, [task]);
    }
  }

  return Array.from(groupMap.entries()).map(([taskHash, instances]) => ({
    taskHash,
    count: instances.length,
    representative: instances[0]!,
    instances,
  }));
}

/**
 * Project prerequisite
 */
export interface ProjectPrerequisite {
  courseId: string;
  sltHashes?: string[];
}

/**
 * Project contributor (on-chain)
 */
export interface ProjectContributor {
  alias: string;
}

/**
 * Project submission (on-chain)
 */
export interface ProjectSubmission {
  taskHash: string;
  submittedBy: string;
  submissionTx?: string;
  onChainContent?: string;
  slot?: number;
}

/**
 * Project assessment (on-chain)
 */
export interface ProjectAssessment {
  taskHash: string;
  assessedBy: string;
  decision: string;
  tx?: string;
  slot?: number;
}

/**
 * Treasury funding (on-chain)
 */
export interface TreasuryFunding {
  alias: string;
  lovelaceAmount: number;
  slot?: number;
  txHash?: string;
  assets?: unknown;
}

/**
 * Credential claim (on-chain)
 */
export interface CredentialClaim {
  alias: string;
  tx?: string;
}

/**
 * Project - flattened project type for components
 * Uses projectId (Cardano policy ID) as primary identifier
 */
export interface Project {
  // Identity - projectId is Cardano policy ID
  projectId: string;
  status: ProjectStatus;

  // Content (flattened from nested content object)
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  category?: string;
  isPublic?: boolean;

  // Ownership & management
  owner?: string;
  ownerAlias?: string;
  managers?: string[];

  // Addresses
  projectAddress?: string;
  treasuryAddress?: string;
  contributorStateId?: string;

  // Timestamps
  createdAt?: string;
  createdSlot?: number;
  createdTx?: string;

  // Prerequisites
  prerequisites?: ProjectPrerequisite[];

  // Reward aggregation (v2.1.3) — null/absent when detail call failed
  totalRewardLovelace?: number;
  availableTaskCount?: number;
}

/**
 * Project state info (for accessing contributor_state_id)
 * @deprecated Use contributorStateId directly on Project/ProjectDetail
 */
export interface ProjectState {
  projectNftPolicyId?: string;
}

/**
 * ProjectDetail - extends Project with related data
 * Available from the detail endpoint
 */
export interface ProjectDetail extends Project {
  // Related data (from merged endpoints)
  tasks?: Task[];
  contributors?: ProjectContributor[];
  submissions?: ProjectSubmission[];
  assessments?: ProjectAssessment[];
  treasuryFundings?: TreasuryFunding[];
  credentialClaims?: CredentialClaim[];

  /**
   * Spendable lovelace in the treasury (from API, accounts for min-UTxO reserve).
   * Use this instead of summing treasuryFundings, which only reflects historical deposits.
   */
  treasuryBalance?: number;

  /** Native assets currently in the treasury UTxO */
  treasuryAssets?: TaskToken[];

  /**
   * Legacy states array for backward compatibility
   * @deprecated Use contributorStateId directly
   */
  states?: ProjectState[];
}

/**
 * TaskCommitment - flattened commitment type for components
 * Uses taskHash (content-addressed) + contributorAddress as composite key
 */
export interface TaskCommitment {
  // Identity - composite key: taskHash + contributorAddress
  taskHash: string;
  projectId: string;

  // Contributor
  contributorAddress: string;
  contributorAlias?: string;

  // Status
  commitmentStatus: string;
  pendingTxHash?: string;

  // Evidence
  taskEvidenceHash?: string;
  evidence?: unknown;
  evidenceUrl?: string;
  notes?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// =============================================================================
// Transform Functions (API snake_case → App camelCase)
// =============================================================================

function extractTreasuryAssets(
  api: MergedProjectDetail,
): { policy_id?: string; name?: string; amount?: string }[] | undefined {
  return api.treasury_assets;
}

/**
 * Transform API Asset[] to app-level TaskToken[]
 *
 * API schema (ApiTypesAsset): { policy_id, name, amount }
 */
function transformAssets(assets: { policy_id?: string; name?: string; amount?: string }[]): TaskToken[] {
  return assets.map((a) => ({
    policyId: a.policy_id ?? "",
    assetName: a.name ?? "",
    quantity: Number(a.amount ?? 0),
  }));
}

/**
 * Transform ProjectTaskOnChain → Task
 * Exported for use in other project hooks
 */
export function transformOnChainTask(
  api: ProjectTaskOnChain,
  projectId: string
): Task {
  // Try to decode on-chain content as title
  let title = "";
  if (api.on_chain_content) {
    try {
      const bytes = new Uint8Array(
        api.on_chain_content.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
      );
      title = new TextDecoder().decode(bytes);
    } catch {
      title = "";
    }
  }

  const taskHash = api.task_hash ?? "";
  return {
    taskHash,
    projectId,
    title,
    description: "",
    lovelaceAmount: String(api.lovelace_amount ?? 0),
    expirationTime: api.expiration_posix
      ? String(api.expiration_posix)
      : undefined,
    expirationPosix: api.expiration_posix,
    createdByAlias: api.created_by,
    onChainContent: api.on_chain_content,
    contributorStateId: api.contributor_state_id,
    tokens: api.assets ? transformAssets(api.assets) : undefined,
    preAssignedAlias: null, // On-chain-only tasks don't carry DB metadata
    status: "active", // On-chain tasks are always active
    taskStatus: "ON_CHAIN", // On-chain tasks have ON_CHAIN status
    commitmentCount: 0, // On-chain-only transform has no commitment data; cross-reference via useManagerTasks
  };
}

/**
 * @deprecated Use transformOnChainTask instead
 */
export const transformApiTask = transformOnChainTask;

/**
 * Derive taskStatus from API source field
 */
function getTaskStatusFromSource(source: string | undefined): TaskStatusValue {
  // "merged" or "chain_only" means task is on-chain
  if (source === "merged" || source === "chain_only") {
    return "ON_CHAIN";
  }
  // "db_only" means draft
  return "DRAFT";
}

/**
 * Transform MergedTaskListItem → Task
 * Exported for use in other project hooks
 *
 * Note: `task_id` in merged response IS the task_hash (content-addressed).
 */
export function transformMergedTask(api: MergedTaskListItem): Task {
  // Use DB title if available, otherwise decode on-chain content as fallback
  let title = api.content?.title ?? "";
  if (!title && api.on_chain_content) {
    try {
      const bytes = new Uint8Array(
        api.on_chain_content.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
      );
      title = new TextDecoder().decode(bytes);
    } catch {
      // leave title empty
    }
  }
  const description = api.content?.description ?? "";
  return {
    taskHash: api.task_hash ?? "",
    projectId: api.project_id ?? "",
    index: api.task_index ?? api.content?.task_index,
    title,
    description,
    contentJson: api.content?.content_json,
    preAssignedAlias: getPreAssignedAlias(api.content?.content_json),
    lovelaceAmount: String(api.lovelace_amount ?? 0),
    expirationTime: api.expiration_posix
      ? String(api.expiration_posix)
      : undefined,
    expirationPosix: api.expiration_posix,
    createdByAlias: api.created_by,
    onChainContent: api.on_chain_content,
    contributorStateId: api.contributor_state_id,
    tokens: api.assets ? transformAssets(api.assets) : undefined,
    status: getProjectStatusFromSource(api.source),
    taskStatus: getTaskStatusFromSource(api.source),
    commitmentCount: api.commitment_count ?? 0,
  };
}

/**
 * Transform ApiProjectPrerequisite → ProjectPrerequisite
 */
function transformPrerequisite(api: ApiProjectPrerequisite): ProjectPrerequisite {
  return {
    courseId: api.course_id ?? "",
    sltHashes: api.slt_hashes,
  };
}

/**
 * Transform MergedProjectListItem → Project
 * Exported for use in other project hooks
 */
export function transformProjectListItem(api: MergedProjectListItem): Project {
  // Cast content to access potential extra fields from api_types if present
  const apiContent = api.content as Record<string, unknown> | undefined;
  const title = api.content?.title ?? "";
  const description = api.content?.description ?? "";
  const imageUrl = api.content?.image_url;
  const videoUrl = apiContent?.video_url as string | undefined;
  const category = apiContent?.category as string | undefined;
  const isPublic = apiContent?.is_public as boolean | undefined;

  const totalRewardLovelace = api.total_reward_lovelace;
  const availableTaskCount = api.available_task_count;

  return {
    projectId: api.project_id ?? "",
    status: getProjectStatusFromSource(api.source),
    title,
    description,
    imageUrl,
    videoUrl,
    category,
    isPublic,
    owner: api.owner,
    ownerAlias: api.owner,
    managers: api.managers,
    projectAddress: api.project_address,
    treasuryAddress: api.treasury_address,
    contributorStateId: api.contributor_state_id,
    createdAt: api.created_at,
    createdSlot: api.created_slot,
    createdTx: api.created_tx,
    prerequisites: api.prerequisites?.map(transformPrerequisite),
    totalRewardLovelace,
    availableTaskCount,
  };
}

/**
 * Transform MergedProjectDetail → ProjectDetail
 * Exported for use in other project hooks
 */
export function transformProjectDetail(api: MergedProjectDetail): ProjectDetail {
  // Cast content to access potential extra fields from api_types if present
  const apiContent = api.content as Record<string, unknown> | undefined;
  const title = api.content?.title ?? "";
  const description = api.content?.description ?? "";
  const imageUrl = api.content?.image_url;
  const videoUrl = apiContent?.video_url as string | undefined;
  const category = apiContent?.category as string | undefined;
  const isPublic = apiContent?.is_public as boolean | undefined;

  // Transform related data — keep all task instances (same taskHash = same content, different UTxOs)
  const tasks = api.tasks?.map((t) => transformOnChainTask(t, api.project_id ?? ""));

  const contributors: ProjectContributor[] | undefined = api.contributors?.map(
    (c: ProjectContributorOnChain) => ({
      alias: c.alias ?? "",
    })
  );

  const submissions: ProjectSubmission[] | undefined = api.submissions?.map(
    (s: ProjectSubmissionOnChain) => ({
      taskHash: s.task_hash ?? "",
      submittedBy: s.submitted_by ?? "",
      submissionTx: s.submission_tx,
      onChainContent: s.on_chain_content,
      slot: s.slot,
    })
  );

  // Normalize assessment decisions: API returns "Accept"/"Refuse"/"Deny"
  // but generated types say "ACCEPTED"/"REFUSED"/"DENIED"
  const normalizeDecision = (raw: string | undefined): string => {
    if (!raw) return "";
    const upper = raw.toUpperCase();
    if (upper.startsWith("ACCEPT")) return "ACCEPTED";
    if (upper.startsWith("REFUSE")) return "REFUSED";
    if (upper.startsWith("DEN")) return "DENIED";
    return upper;
  };
  const assessments: ProjectAssessment[] | undefined = api.assessments?.map(
    (a: ProjectAssessmentOnChain) => ({
      taskHash: a.task_hash ?? "",
      assessedBy: a.assessed_by ?? "",
      decision: normalizeDecision(a.decision),
      tx: a.tx,
      slot: a.slot,
    })
  );

  const treasuryFundings: TreasuryFunding[] | undefined = api.treasury_fundings?.map(
    (f: ProjectTreasuryFundingOnChain) => ({
      alias: f.alias ?? "",
      lovelaceAmount: f.lovelace_amount ?? 0,
      slot: f.slot,
      txHash: f.tx_hash,
      assets: f.assets,
    })
  );

  const credentialClaims: CredentialClaim[] | undefined = api.credential_claims?.map(
    (c: ProjectCredentialClaimOnChain) => ({
      alias: c.alias ?? "",
      tx: c.tx,
    })
  );

  // Build legacy states array for backward compatibility
  const contributorStateId = api.contributor_state_id;
  const states: ProjectState[] | undefined = contributorStateId
    ? [{ projectNftPolicyId: contributorStateId }]
    : undefined;

  return {
    projectId: api.project_id ?? "",
    status: getProjectStatusFromSource(api.source),
    title,
    description,
    imageUrl,
    videoUrl,
    category,
    isPublic,
    owner: api.owner,
    ownerAlias: api.owner,
    managers: api.managers,
    treasuryAddress: api.treasury_address,
    contributorStateId,
    prerequisites: api.prerequisites?.map(transformPrerequisite),
    tasks,
    contributors,
    submissions,
    assessments,
    treasuryFundings,
    treasuryBalance: api.treasury_balance,
    treasuryAssets: (() => {
      const raw = extractTreasuryAssets(api);
      return raw ? transformAssets(raw) : undefined;
    })(),
    credentialClaims,
    states,
  };
}

/**
 * @deprecated Use transformProjectListItem instead
 */
export const transformApiProject = transformProjectListItem;

/**
 * @deprecated Use TaskCommitment type directly
 */
export function transformApiCommitment(api: unknown): TaskCommitment {
  // This is a stub for backward compatibility
  // The actual commitment transformation happens in use-project-contributor.ts
  const data = api as Record<string, unknown>;
  const getString = (value: unknown): string =>
    typeof value === "string" ? value : "";
  return {
    taskHash: getString(data.task_hash) || getString(data.taskHash),
    projectId: getString(data.project_id) || getString(data.projectId),
    contributorAddress: getString(data.contributor_address) || getString(data.contributorAddress),
    contributorAlias: getString(data.contributor_alias) || getString(data.contributorAlias),
    commitmentStatus: getString(data.commitment_status) || getString(data.commitmentStatus),
  };
}

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Centralized query keys for cache management
 */
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  published: () => [...projectKeys.all, "published"] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (projectId: string) => [...projectKeys.details(), projectId] as const,
  tasks: (projectId: string) => [...projectKeys.detail(projectId), "tasks"] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch a single project by ID (merged endpoint)
 *
 * Returns both on-chain data (tasks, contributors) and off-chain content.
 * Uses: GET /api/v2/project/user/project/{project_id}
 *
 * @param projectId - Project NFT Policy ID
 * @returns ProjectDetail with flat fields (title, description, etc.)
 *
 * @example
 * ```tsx
 * function ProjectHeader({ projectId }: { projectId: string }) {
 *   const { data: project, isLoading, error } = useProject(projectId);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!project) return <NotFound />;
 *
 *   return <h1>{project.title}</h1>;
 * }
 * ```
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ""),
    queryFn: async (): Promise<ProjectDetail | null> => {
      const response = await fetch(
        `${GATEWAY_API_BASE}/project/user/project/${projectId}`
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }

      const result = (await response.json()) as MergedProjectDetailResponse;

      if (result.meta?.warning) {
        console.warn("[useProject] API warning:", result.meta?.warning);
      }

      if (!result.data) return null;

      return transformProjectDetail(result.data);
    },
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

/**
 * Fetch raw project data without transformation
 * Use this when you need the original API response structure
 */
export function useProjectRaw(projectId: string | undefined) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId ?? ""), "raw"] as const,
    queryFn: async (): Promise<MergedProjectDetail | null> => {
      const response = await fetch(
        `${GATEWAY_API_BASE}/project/user/project/${projectId}`
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }

      const result = (await response.json()) as MergedProjectDetailResponse;

      if (result.meta?.warning) {
        console.warn("[useProjectRaw] API warning:", result.meta?.warning);
      }

      return result.data ?? null;
    },
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

/**
 * Fetch all published projects (merged endpoint)
 *
 * Uses: GET /api/v2/project/user/projects/list
 *
 * @returns Project[] with flat fields
 *
 * @example
 * ```tsx
 * function ProjectCatalog() {
 *   const { data: projects, isLoading } = useProjects();
 *
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       {projects?.map(project => (
 *         <ProjectCard
 *           key={project.projectId}
 *           title={project.title}
 *           description={project.description}
 *           status={project.status}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.published(),
    queryFn: async (): Promise<Project[]> => {
      const response = await fetch(
        `${GATEWAY_API_BASE}/project/user/projects/list`
      );

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const result = (await response.json()) as
        | MergedProjectsResponse
        | MergedProjectListItem[];

      // Handle both wrapped { data: [...] } and raw array formats
      let items: MergedProjectListItem[];

      if (Array.isArray(result)) {
        // Legacy/raw array format
        items = result;
      } else {
        // Wrapped format with data property
        if (result.meta?.warning) {
          console.warn("[useProjects] API warning:", result.meta?.warning);
        }
        items = result.data ?? [];
      }

      return items.map(transformProjectListItem);
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch tasks for a project
 *
 * Uses: POST /api/v2/project/user/tasks/list with { project_id }
 * Returns Task[] with flat camelCase fields
 *
 * @param projectId - Project ID
 *
 * @example
 * ```tsx
 * function TaskList({ projectId }: { projectId: string }) {
 *   const { data: tasks, isLoading } = useProjectTasks(projectId);
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return tasks?.map(task => (
 *     <TaskCard key={task.taskHash} task={task} />
 *   ));
 * }
 * ```
 */
export function useProjectTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.tasks(projectId ?? ""),
    queryFn: async (): Promise<Task[]> => {
      const response = await fetch(
        `${GATEWAY_API_BASE}/project/user/tasks/list`,
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
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
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
          console.warn("[useProjectTasks] API warning:", result.meta?.warning);
        }
        items = result.data ?? [];
      }

      // Return all task instances — same taskHash = same content, different on-chain UTxOs
      // UI should group by taskHash and show counts when multiple instances exist
      return items.map(transformMergedTask);
    },
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

/**
 * Fetch a single task by hash from the project tasks list.
 *
 * Shares the same cache as useProjectTasks — no extra network request.
 * Uses React Query `select` to pick one task from the cached list.
 */
export function useProjectTask(projectId: string | undefined, taskHash: string | undefined) {
  return useQuery<Task[], Error, Task | null>({
    queryKey: projectKeys.tasks(projectId ?? ""),
    queryFn: async (): Promise<Task[]> => {
      const response = await fetch(
        `${GATEWAY_API_BASE}/project/user/tasks/list`,
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
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const result = (await response.json()) as
        | MergedTasksResponse
        | MergedTaskListItem[];

      let items: MergedTaskListItem[];

      if (Array.isArray(result)) {
        items = result;
      } else {
        if (result.meta?.warning) {
          console.warn("[useProjectTask] API warning:", result.meta?.warning);
        }
        items = result.data ?? [];
      }

      return items.map(transformMergedTask);
    },
    select: (tasks) => tasks.find((t) => t.taskHash === taskHash) ?? null,
    enabled: !!projectId && !!taskHash,
    staleTime: 60_000,
  });
}

/**
 * Hook to invalidate project cache
 */
export function useInvalidateProjects() {
  const queryClient = useQueryClient();

  const project = useCallback(
    async (projectId: string) => {
      await queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      });
    },
    [queryClient],
  );

  const all = useCallback(
    async () => {
      await queryClient.invalidateQueries({
        queryKey: projectKeys.all,
      });
    },
    [queryClient],
  );

  return useMemo(() => ({ project, all }), [project, all]);
}
