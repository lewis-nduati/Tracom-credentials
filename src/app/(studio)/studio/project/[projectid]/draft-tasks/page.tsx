"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";
import {
  AndamioBadge,
  AndamioButton,
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioSectionHeader,
  AndamioTableContainer,
  AndamioEmptyState,
  AndamioText,
  AndamioBackButton,
  AndamioAddButton,
  AndamioRowActions,
  AndamioErrorAlert,
  AndamioScrollArea,
} from "~/components/andamio";
import {
  TaskIcon,
  OnChainIcon,
  SuccessIcon,
  PendingIcon,
  AlertIcon,
  UserIcon,
  NeutralIcon,
  ErrorIcon,
  SortIcon,
  LockedIcon,
} from "~/components/icons";
import { formatLovelace } from "~/lib/cardano-utils";
import { useProject, type Task } from "~/hooks/api/project/use-project";
import { useManagerTasks, useDeleteTask, useManagerCommitments, type ManagerCommitment } from "~/hooks/api/project/use-project-manager";

// =============================================================================
// Task Lifecycle Types
// =============================================================================

type TaskLifecycle = "available" | "in_progress" | "pending_review" | "accepted" | "reward_claimed" | "refused" | "denied";

interface TaskLifecycleInfo {
  lifecycle: TaskLifecycle;
  contributor?: string;
  commitment?: ManagerCommitment;
}

function getLifecycleFromStatus(status: string | undefined): TaskLifecycle {
  switch (status) {
    case "COMMITTED":
      return "pending_review";
    case "ACCEPTED":
      return "accepted";
    case "REWARDED":
      return "reward_claimed";
    case "REFUSED":
      return "refused";
    case "DENIED":
      return "denied";
    case "AWAITING_SUBMISSION":
    case "PENDING_TX_COMMIT":
    case "PENDING_TX_ASSESS":
    case "DRAFT":
      return "in_progress";
    default:
      if (status) console.warn(`[draft-tasks] Unknown commitment status: ${status}`);
      return "in_progress";
  }
}

function getLifecycleLabel(lifecycle: TaskLifecycle): string {
  switch (lifecycle) {
    case "available":
      return "Available";
    case "in_progress":
      return "In Progress";
    case "pending_review":
      return "Pending Review";
    case "accepted":
      return "Accepted";
    case "reward_claimed":
      return "Reward Claimed";
    case "refused":
      return "Refused";
    case "denied":
      return "Denied";
  }
}

function getLifecycleBadgeVariant(lifecycle: TaskLifecycle): "default" | "secondary" | "outline" | "destructive" {
  switch (lifecycle) {
    case "available":
      return "outline";
    case "in_progress":
      return "secondary";
    case "pending_review":
      return "secondary";
    case "accepted":
      return "default";
    case "reward_claimed":
      return "default";
    case "refused":
      return "destructive";
    case "denied":
      return "destructive";
  }
}

function getLifecycleIcon(lifecycle: TaskLifecycle) {
  switch (lifecycle) {
    case "available":
      return <NeutralIcon className="h-3 w-3 mr-1" />;
    case "in_progress":
      return <PendingIcon className="h-3 w-3 mr-1" />;
    case "pending_review":
      return <AlertIcon className="h-3 w-3 mr-1" />;
    case "accepted":
      return <SuccessIcon className="h-3 w-3 mr-1" />;
    case "reward_claimed":
      return <SuccessIcon className="h-3 w-3 mr-1" />;
    case "refused":
      return <ErrorIcon className="h-3 w-3 mr-1" />;
    case "denied":
      return <ErrorIcon className="h-3 w-3 mr-1" />;
  }
}

/** Priority order: pending_review needs attention most, then in_progress, etc. */
const LIFECYCLE_PRIORITY: Record<TaskLifecycle, number> = {
  pending_review: 6,
  in_progress: 5,
  accepted: 4,
  reward_claimed: 3,
  refused: 2,
  denied: 1,
  available: 0,
};

function shouldReplace(existing: TaskLifecycle, incoming: TaskLifecycle): boolean {
  return LIFECYCLE_PRIORITY[incoming] > LIFECYCLE_PRIORITY[existing];
}

/**
 * Draft Tasks List - View and manage draft tasks for a project
 *
 * Uses React Query hooks:
 * - useProject(projectId) - Project detail for contributorStateId
 * - useManagerTasks(projectId) - All tasks including DRAFT
 * - useDeleteTask() - Delete task mutation
 */
export default function DraftTasksPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { isAuthenticated, user } = useAndamioAuth();

  // React Query hooks
  const { data: projectDetail, isLoading: isProjectLoading, error: projectError } = useProject(projectId);
  const contributorStateId = projectDetail?.contributorStateId;

  // Compute manager status to gate the commitments query (issue #346)
  const isManagerOrOwner = useMemo(() => {
    if (!projectDetail || !user?.accessTokenAlias) return false;
    const alias = user.accessTokenAlias;
    return (
      projectDetail.ownerAlias === alias ||
      projectDetail.owner === alias ||
      projectDetail.managers?.includes(alias) === true
    );
  }, [projectDetail, user?.accessTokenAlias]);

  const { data: tasks = [], isLoading: isTasksLoading } = useManagerTasks(projectId);
  const { data: allCommitments = [], isLoading: isCommitmentsLoading } = useManagerCommitments(
    projectId,
    { enabled: isManagerOrOwner }
  );
  const deleteTask = useDeleteTask();

  const [deletingTaskIndex, setDeletingTaskIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftSortField, setDraftSortField] = useState<"title" | "reward">("title");
  const [draftSortDirection, setDraftSortDirection] = useState<"asc" | "desc">("asc");

  // Build lifecycle map: taskHash → most relevant commitment info
  const taskLifecycleMap = useMemo(() => {
    const map = new Map<string, TaskLifecycleInfo>();
    for (const commitment of allCommitments) {
      const existing = map.get(commitment.taskHash);
      // Keep the most "advanced" commitment per taskHash
      // Priority: pending_review > in_progress > accepted > refused > denied
      if (!existing || shouldReplace(existing.lifecycle, getLifecycleFromStatus(commitment.commitmentStatus))) {
        map.set(commitment.taskHash, {
          lifecycle: getLifecycleFromStatus(commitment.commitmentStatus),
          contributor: commitment.submittedBy,
          commitment,
        });
      }
    }
    return map;
  }, [allCommitments]);

  // Build set for de-duplicating draft tasks against on-chain tasks by hash.
  // Hash matching uses @andamio/core v0.3.0+ which matches on-chain Aiken hashing.
  const onChainTasks = useMemo(() => (projectDetail?.tasks ?? []).filter(
    (t) => t.taskStatus === "ON_CHAIN"
  ), [projectDetail?.tasks]);

  const onChainTaskHashes = useMemo(() => new Set(
    onChainTasks.map((t) => t.taskHash).filter(Boolean)
  ), [onChainTasks]);

  // Separate tasks by status, excluding drafts that are already on-chain
  const draftTasksRaw = useMemo(() => tasks.filter((t) => {
    if (t.taskStatus !== "DRAFT") return false;
    if (t.taskHash && onChainTaskHashes.has(t.taskHash)) return false;
    return true;
  }), [tasks, onChainTaskHashes]);

  // Sorted draft tasks
  const draftTasks = useMemo(() => {
    const sorted = [...draftTasksRaw];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (draftSortField === "title") {
        cmp = (a.title || "").localeCompare(b.title || "");
      } else {
        cmp = (parseInt(a.lovelaceAmount) || 0) - (parseInt(b.lovelaceAmount) || 0);
      }
      return draftSortDirection === "desc" ? -cmp : cmp;
    });
    return sorted;
  }, [draftTasksRaw, draftSortField, draftSortDirection]);
  // De-duplicate ON_CHAIN tasks by taskHash (API can return duplicates across data sources)
  const liveTasks = useMemo(() => {
    const onChainTasks = tasks.filter((t) => t.taskStatus === "ON_CHAIN");
    const seen = new Set<string>();
    return onChainTasks.filter((t) => {
      if (!t.taskHash) return true; // Keep tasks without hash (shouldn't happen for ON_CHAIN)
      if (seen.has(t.taskHash)) return false;
      seen.add(t.taskHash);
      return true;
    });
  }, [tasks]);
  const otherTasks = useMemo(() => tasks.filter((t) => !["DRAFT", "ON_CHAIN"].includes(t.taskStatus ?? "")), [tasks]);
  const hasDraftTasks = draftTasks.length > 0;

  // Lifecycle summary counts for live tasks
  const lifecycleCounts = useMemo(() => {
    let available = 0;
    let inProgress = 0;
    let pendingReview = 0;
    let accepted = 0;
    let rewardClaimed = 0;
    let other = 0;
    for (const task of liveTasks) {
      const info = taskLifecycleMap.get(task.taskHash);
      if (!info) {
        // commitmentCount is the ground truth: if the API says a task has
        // commitments, the UI must not show "Available" even if the lifecycle
        // map has no details (e.g., the manager commitments query hasn't loaded yet).
        if (task.commitmentCount > 0) {
          inProgress++;
        } else {
          available++;
        }
      } else {
        switch (info.lifecycle) {
          case "in_progress":
            inProgress++;
            break;
          case "pending_review":
            pendingReview++;
            break;
          case "accepted":
            accepted++;
            break;
          case "reward_claimed":
            rewardClaimed++;
            break;
          case "refused":
          case "denied":
            other++;
            break;
          default:
            available++;
        }
      }
    }
    return { available, inProgress, pendingReview, accepted, rewardClaimed, other };
  }, [liveTasks, taskLifecycleMap]);

  // Split live tasks into active (has commitments) and available (no commitments)
  const activeTasks = useMemo(() => {
    const active = liveTasks.filter((task) => {
      const info = taskLifecycleMap.get(task.taskHash);
      return info || task.commitmentCount > 0;
    });
    // Sort by lifecycle priority (highest first), then title
    active.sort((a, b) => {
      const la = taskLifecycleMap.get(a.taskHash)?.lifecycle ?? "in_progress";
      const lb = taskLifecycleMap.get(b.taskHash)?.lifecycle ?? "in_progress";
      const cmp = LIFECYCLE_PRIORITY[lb] - LIFECYCLE_PRIORITY[la];
      return cmp !== 0 ? cmp : (a.title || "").localeCompare(b.title || "");
    });
    return active;
  }, [liveTasks, taskLifecycleMap]);

  const availableTasks = useMemo(() => {
    const available = liveTasks.filter((task) => {
      const info = taskLifecycleMap.get(task.taskHash);
      return !info && task.commitmentCount === 0;
    });
    available.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return available;
  }, [liveTasks, taskLifecycleMap]);


  const toggleDraftSort = (field: "title" | "reward") => {
    if (draftSortField === field) {
      setDraftSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setDraftSortField(field);
      setDraftSortDirection("asc");
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!isAuthenticated) {
      setError("You must be authenticated to delete tasks");
      return;
    }
    if (!contributorStateId) {
      setError("Missing project contributor state. Try refreshing the page.");
      return;
    }
    if (task.index === undefined) {
      setError("Cannot delete task: missing task index");
      return;
    }

    setDeletingTaskIndex(task.index);
    setError(null);

    try {
      await deleteTask.mutateAsync({
        projectId,
        contributorStateId,
        taskIndex: task.index,
      });
    } catch (err) {
      console.error("Error deleting task:", err);
      const message = err instanceof Error ? err.message : "Failed to delete task";
      // "Bad Request" typically means the task was already published or its
      // status changed (e.g., PENDING_TX after a publish attempt). See andamio-api#195.
      if (message.includes("Bad Request")) {
        setError("This task may have already been published. Try refreshing the page to see the latest status.");
      } else {
        setError(message);
      }
    } finally {
      setDeletingTaskIndex(null);
    }
  };

  // Helper to get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "ON_CHAIN":
        return "default";
      case "DRAFT":
        return "secondary";
      case "EXPIRED":
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <ConnectWalletGate
        title="Draft Tasks"
        description="Connect your wallet to manage tasks"
      />
    );
  }

  // Loading state
  if (isProjectLoading || isTasksLoading || isCommitmentsLoading) {
    return <AndamioPageLoading variant="list" />;
  }

  // Error state
  const errorMessage = projectError instanceof Error ? projectError.message : projectError ? "Failed to load project" : error;
  if (errorMessage) {
    return (
      <div className="space-y-6">
        <AndamioBackButton
          href={`/studio/project/${projectId}`}
          label="Back to Project"
        />

        <AndamioErrorAlert error={errorMessage} />
      </div>
    );
  }

  return (
    <AndamioScrollArea className="h-full">
    <div className="min-h-full">
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <AndamioBackButton
          href={`/studio/project/${projectId}`}
          label="Back to Project"
        />

        {hasDraftTasks ? (
          <Link href={`/studio/project/${projectId}/manage-treasury`}>
            <AndamioButton variant="default" size="sm">
              <OnChainIcon className="h-4 w-4 mr-2" />
              Publish Tasks
            </AndamioButton>
          </Link>
        ) : (
          <Link href={`/studio/project/${projectId}/draft-tasks/new`}>
            <AndamioAddButton label="Create Task" />
          </Link>
        )}
      </div>

      <AndamioPageHeader
        title="Tasks"
        description="Manage tasks for this project"
      />

      {/* Status Badges */}
      <div className="flex flex-wrap items-center gap-3">
        {hasDraftTasks && (
          <AndamioBadge variant="secondary">
            {draftTasks.length} Draft
          </AndamioBadge>
        )}
        <AndamioBadge variant="default" className="bg-primary text-primary-foreground">
          <OnChainIcon className="h-3 w-3 mr-1" />
          {liveTasks.length} Published
        </AndamioBadge>
        {lifecycleCounts.available > 0 && (
          <AndamioBadge variant="outline">
            <NeutralIcon className="h-3 w-3 mr-1" />
            {lifecycleCounts.available} Available
          </AndamioBadge>
        )}
        {lifecycleCounts.inProgress > 0 && (
          <AndamioBadge variant="outline">
            <PendingIcon className="h-3 w-3 mr-1" />
            {lifecycleCounts.inProgress} In Progress
          </AndamioBadge>
        )}
        {lifecycleCounts.pendingReview > 0 && (
          <AndamioBadge variant="outline" className="text-warning border-warning/30">
            <AlertIcon className="h-3 w-3 mr-1" />
            {lifecycleCounts.pendingReview} Needs Review
          </AndamioBadge>
        )}
        {lifecycleCounts.accepted > 0 && (
          <AndamioBadge variant="outline">
            <SuccessIcon className="h-3 w-3 mr-1" />
            {lifecycleCounts.accepted} Accepted
          </AndamioBadge>
        )}
        {lifecycleCounts.rewardClaimed > 0 && (
          <AndamioBadge variant="outline">
            <SuccessIcon className="h-3 w-3 mr-1" />
            {lifecycleCounts.rewardClaimed} Claimed
          </AndamioBadge>
        )}
      </div>

      {/* Draft Tasks Section */}
      {hasDraftTasks && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <AndamioSectionHeader title="Draft Tasks" />
            <Link href={`/studio/project/${projectId}/draft-tasks/new`}>
              <AndamioAddButton label="Create Task" />
            </Link>
          </div>
          <AndamioText variant="small">These tasks are not yet published to the blockchain</AndamioText>
          <AndamioTableContainer>
            <AndamioTable>
              <AndamioTableHeader>
                <AndamioTableRow>
                  <AndamioTableHead>
                    <button onClick={() => toggleDraftSort("title")} className="inline-flex items-center gap-1 cursor-pointer hover:text-foreground">
                      Title
                      <SortIcon className={`h-3 w-3 ${draftSortField === "title" ? "text-primary" : "text-muted-foreground/50"}`} />
                    </button>
                  </AndamioTableHead>
                  <AndamioTableHead className="w-32 text-center">
                    <button onClick={() => toggleDraftSort("reward")} className="inline-flex items-center gap-1 cursor-pointer hover:text-foreground mx-auto">
                      Reward
                      <SortIcon className={`h-3 w-3 ${draftSortField === "reward" ? "text-primary" : "text-muted-foreground/50"}`} />
                    </button>
                  </AndamioTableHead>
                  <AndamioTableHead className="w-32 text-center">Status</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-right">Actions</AndamioTableHead>
                </AndamioTableRow>
              </AndamioTableHeader>
              <AndamioTableBody>
                {draftTasks.map((task, index) => {
                  const taskIndex = task.index ?? 0;
                  return (
                    <AndamioTableRow key={task.taskHash || `draft-${taskIndex}-${index}`}>

                      <AndamioTableCell className="font-medium">
                        <div>{task.title || "Untitled Task"}</div>
                        {task.preAssignedAlias && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <LockedIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-normal">
                              @{task.preAssignedAlias}
                            </span>
                          </div>
                        )}
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="outline">{formatLovelace(task.lovelaceAmount)}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant={getStatusVariant(task.taskStatus ?? "")}>{task.taskStatus}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-right">
                        <AndamioRowActions
                          editHref={`/studio/project/${projectId}/draft-tasks/${taskIndex}`}
                          onDelete={() => handleDeleteTask(task)}
                          itemName="task"
                          deleteDescription={`Are you sure you want to delete "${task.title || "Untitled Task"}"? This action cannot be undone.`}
                          isDeleting={deletingTaskIndex === taskIndex}
                        />
                      </AndamioTableCell>
                    </AndamioTableRow>
                  );
                })}
              </AndamioTableBody>
            </AndamioTable>
          </AndamioTableContainer>
        </div>
      )}

      {/* Active Tasks Section — tasks with contributor commitments */}
      {activeTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <AndamioSectionHeader title="Active Tasks" />
            {lifecycleCounts.pendingReview > 0 && (
              <Link href={`/studio/project/${projectId}/commitments`}>
                <AndamioButton variant="outline" size="sm">
                  <AlertIcon className="h-4 w-4 mr-2" />
                  Review Submissions ({lifecycleCounts.pendingReview})
                </AndamioButton>
              </Link>
            )}
          </div>
          <AndamioText variant="small">Tasks with contributor commitments. These cannot be edited or removed.</AndamioText>

          <AndamioTableContainer>
            <AndamioTable>
              <AndamioTableHeader>
                <AndamioTableRow>
                  <AndamioTableHead>Title</AndamioTableHead>
                  <AndamioTableHead>Contributor</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-center">Reward</AndamioTableHead>
                  <AndamioTableHead className="w-40 text-center">Lifecycle</AndamioTableHead>
                </AndamioTableRow>
              </AndamioTableHeader>
              <AndamioTableBody>
                {activeTasks.map((task) => {
                  const info = taskLifecycleMap.get(task.taskHash);
                  const lifecycle = info?.lifecycle ?? "in_progress";
                  return (
                    <AndamioTableRow key={task.taskHash}>
                      <AndamioTableCell className="font-medium">
                        <Link
                          href={`/project/${projectId}/${task.taskHash}`}
                          className="hover:underline"
                        >
                          {task.title || "Untitled Task"}
                        </Link>
                      </AndamioTableCell>
                      <AndamioTableCell>
                        {info?.contributor ? (
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="font-mono text-xs truncate max-w-[120px]">
                              {info.contributor}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="outline">{formatLovelace(task.lovelaceAmount)}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant={getLifecycleBadgeVariant(lifecycle)}>
                          {getLifecycleIcon(lifecycle)}
                          {getLifecycleLabel(lifecycle)}
                        </AndamioBadge>
                      </AndamioTableCell>
                    </AndamioTableRow>
                  );
                })}
              </AndamioTableBody>
            </AndamioTable>
          </AndamioTableContainer>
        </div>
      )}

      {/* Available Tasks Section — on-chain tasks with no commitments */}
      {availableTasks.length > 0 && (
        <div className="space-y-3">
          <AndamioSectionHeader title="Available Tasks" />
          <AndamioText variant="small">Published on-chain with no commitments yet. Waiting for contributors.</AndamioText>

          <AndamioTableContainer>
            <AndamioTable>
              <AndamioTableHeader>
                <AndamioTableRow>
                  <AndamioTableHead>Title</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-center">Reward</AndamioTableHead>
                </AndamioTableRow>
              </AndamioTableHeader>
              <AndamioTableBody>
                {availableTasks.map((task) => (
                  <AndamioTableRow key={task.taskHash}>
                    <AndamioTableCell className="font-medium">
                      <Link
                        href={`/project/${projectId}/${task.taskHash}`}
                        className="hover:underline"
                      >
                        {task.title || "Untitled Task"}
                      </Link>
                    </AndamioTableCell>
                    <AndamioTableCell className="text-center">
                      <AndamioBadge variant="outline">{formatLovelace(task.lovelaceAmount)}</AndamioBadge>
                    </AndamioTableCell>
                  </AndamioTableRow>
                ))}
              </AndamioTableBody>
            </AndamioTable>
          </AndamioTableContainer>
        </div>
      )}

      {/* Other Tasks Section */}
      {otherTasks.length > 0 && (
        <div className="space-y-3">
          <AndamioSectionHeader title="Other Tasks" />
          <AndamioText variant="small">Tasks with expired, cancelled, or other non-active statuses</AndamioText>
          <AndamioTableContainer>
            <AndamioTable>
              <AndamioTableHeader>
                <AndamioTableRow>
                  <AndamioTableHead>Title</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-center">Reward</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-center">Status</AndamioTableHead>
                </AndamioTableRow>
              </AndamioTableHeader>
              <AndamioTableBody>
                {otherTasks.map((task, idx) => {
                  const taskIndex = task.index ?? 0;
                  return (
                    <AndamioTableRow key={`${task.taskHash || 'other'}-${taskIndex}-${idx}`}>

                      <AndamioTableCell className="font-medium">{task.title || "Untitled Task"}</AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="outline">{formatLovelace(task.lovelaceAmount)}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant={getStatusVariant(task.taskStatus ?? "")}>{task.taskStatus}</AndamioBadge>
                      </AndamioTableCell>
                    </AndamioTableRow>
                  );
                })}
              </AndamioTableBody>
            </AndamioTable>
          </AndamioTableContainer>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <AndamioEmptyState
          icon={TaskIcon}
          title="No tasks yet"
          description="Create your first task to get started"
          action={
            <Link href={`/studio/project/${projectId}/draft-tasks/new`}>
              <AndamioAddButton label="Create Task" />
            </Link>
          }
        />
      )}
    </div>
    </div>
    </AndamioScrollArea>
  );
}
