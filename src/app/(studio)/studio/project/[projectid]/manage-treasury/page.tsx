"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import {
  AndamioBadge,
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
  AndamioTableContainer,
  AndamioBackButton,
  AndamioErrorAlert,
  AndamioEmptyState,
  AndamioText,
  AndamioCheckbox,
  AndamioScrollArea,
  AndamioSectionHeader,
} from "~/components/andamio";
import {
  AndamioTabs,
  AndamioTabsList,
  AndamioTabsTrigger,
  AndamioTabsContent,
} from "~/components/andamio/andamio-tabs";
import { TaskIcon, OnChainIcon, AddIcon, DeleteIcon } from "~/components/icons";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";
import { TreasuryBalanceCard } from "~/components/studio/treasury-balance-card";
import { TasksManage, TreasuryAddFunds } from "~/components/tx";
import { formatLovelace } from "~/lib/cardano-utils";
import { toast } from "sonner";
import type { Task } from "~/hooks/api/project/use-project";
import { useProject, projectKeys } from "~/hooks/api/project/use-project";
import { useManagerTasks, projectManagerKeys } from "~/hooks/api/project/use-project-manager";
import { useQueryClient } from "@tanstack/react-query";

/**
 * ListValue - Array of [asset_class, quantity] tuples
 * Format: [["lovelace", amount]] or [["policyId.tokenName", amount]]
 */
type ListValue = Array<[string, number]>;

/**
 * ProjectData - Task formatted for on-chain publishing
 *
 * IMPORTANT: This matches the Atlas API ManageTasksTxRequest schema
 * @see https://atlas-api-preprod-507341199760.us-central1.run.app/swagger.json
 *
 * @property project_content - Task content text (max 140 chars, NOT a hash!)
 * @property expiration_posix - Unix timestamp in MILLISECONDS
 * @property lovelace_amount - Reward amount in lovelace
 * @property native_assets - ListValue array of [asset_class, quantity] tuples
 */
interface ProjectData {
  project_content: string; // Task content text (max 140 chars)
  expiration_posix: number; // Unix timestamp in MILLISECONDS
  lovelace_amount: number;
  native_assets: ListValue; // [["policyId.tokenName", qty], ...]
}

/**
 * Decode hex string to UTF-8 text
 */
function hexToText(hex: string): string {
  try {
    const bytes = new Uint8Array(
      hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
    );
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

/**
 * Manage Treasury Page
 *
 * Allows managers to publish draft tasks on-chain via the TasksManage transaction.
 * Tasks must be in DRAFT status to be published.
 */
export default function ManageTreasuryPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { isAuthenticated } = useAndamioAuth();
  const queryClient = useQueryClient();

  // React Query hooks
  const { data: projectDetail, isLoading: isProjectLoading, error: projectError } = useProject(projectId);
  const contributorStateId = projectDetail?.contributorStateId ?? null;
  const { data: tasks = [], isLoading: isTasksLoading } = useManagerTasks(projectId);

  // Track which section has an active TX to prevent unmounting the TasksManage component
  // "add" = draft tasks section, "remove" = on-chain tasks section, null = no TX in flight
  const [txInProgress, setTxInProgress] = useState<"add" | "remove" | null>(null);

  // Selected tasks for publishing
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<Set<number>>(new Set());

  // On-chain tasks for removal (derived from hook data)
  const [selectedOnChainTaskIds, setSelectedOnChainTaskIds] = useState<Set<string>>(new Set());

  // On-chain tasks from hook data, de-duplicated by taskHash
  const onChainTasks: Task[] = useMemo(() => {
    const raw = (projectDetail?.tasks ?? []).filter(t => t.taskStatus === "ON_CHAIN");
    const seen = new Set<string>();
    return raw.filter((t) => {
      if (!t.taskHash) return true;
      if (seen.has(t.taskHash)) return false;
      seen.add(t.taskHash);
      return true;
    });
  }, [projectDetail?.tasks]);

  // Derived: on-chain task count
  const onChainTaskCount = onChainTasks.length;

  // Cache invalidation for onSuccess callbacks.
  // useManagerTasks caches under projectManagerKeys.tasks(projectId),
  // so we must invalidate with projectId — not contributorStateId.
  const refreshData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
      queryClient.invalidateQueries({ queryKey: projectManagerKeys.tasks(projectId) }),
    ]);
  }, [queryClient, projectId]);

  const handleToggleTask = (taskIndex: number) => {
    setSelectedTaskIndices((prev) => {
      const next = new Set(prev);
      if (next.has(taskIndex)) {
        next.delete(taskIndex);
      } else {
        next.add(taskIndex);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const draftTasks = tasks.filter((t) => t.taskStatus === "DRAFT");
    if (selectedTaskIndices.size === draftTasks.length) {
      // Deselect all
      setSelectedTaskIndices(new Set());
    } else {
      // Select all draft tasks - filter out undefined indices
      setSelectedTaskIndices(new Set(draftTasks.map((t) => t.index).filter((idx): idx is number => idx !== undefined)));
    }
  };

  const handleToggleOnChainTask = (taskHash: string) => {
    setSelectedOnChainTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskHash)) {
        next.delete(taskHash);
      } else {
        next.add(taskHash);
      }
      return next;
    });
  };

  const handleSelectAllOnChain = () => {
    if (selectedOnChainTaskIds.size === onChainTasks.length) {
      // Deselect all
      setSelectedOnChainTaskIds(new Set());
    } else {
      // Select all on-chain tasks
      setSelectedOnChainTaskIds(new Set(onChainTasks.map((t) => t.taskHash).filter(Boolean)));
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <ConnectWalletGate
        title="Manage Treasury"
        description="Connect your wallet to manage the treasury"
      />
    );
  }

  // Loading state
  if (isProjectLoading || isTasksLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  const errorMessage = projectError instanceof Error ? projectError.message : projectError ? "Failed to load project" : null;
  if (errorMessage) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert error={errorMessage} />
      </div>
    );
  }

  // Build set of on-chain task hashes to exclude from draft list
  // (manager tasks API can lag behind project detail after publishing)
  const onChainTaskHashes = new Set(
    onChainTasks.map((t) => t.taskHash).filter(Boolean)
  );

  // Filter draft tasks, excluding any that are already on-chain
  const draftTasks = tasks.filter(
    (t) => t.taskStatus === "DRAFT" && (!t.taskHash || !onChainTaskHashes.has(t.taskHash))
  );
  const liveTasks = tasks.filter((t) => t.taskStatus === "ON_CHAIN");

  // Get selected tasks (filter for valid indices)
  const selectedTasks = draftTasks.filter((t) => t.index !== undefined && selectedTaskIndices.has(t.index));

  // Convert selected tasks to ProjectData format for the transaction
  // IMPORTANT: project_content is the task description (max 140 chars), NOT a hash!
  // expiration_posix must be in MILLISECONDS
  const tasksToAdd: ProjectData[] = selectedTasks.map((task) => {
    // Use task title/description as project_content (truncate to 140 chars)
    const projectContent = (task.title || task.description || "Task").substring(0, 140);

    // Ensure expiration_posix is in milliseconds
    // If it's a small number (< year 2000 in ms), it might be in seconds
    let expirationMs = parseInt(task.expirationTime ?? "0") || 0;
    if (expirationMs < 946684800000) {
      // If less than year 2000 in ms, assume it's in seconds
      expirationMs = expirationMs * 1000;
    }

    const projectData: ProjectData = {
      project_content: projectContent,
      expiration_posix: expirationMs,
      lovelace_amount: parseInt(task.lovelaceAmount) || 5000000,
      native_assets: [], // Empty for now - could add native tokens later
    };

    return projectData;
  });


  // Task labels for the publish summary (show title, fallback to index)
  const taskCodes = selectedTasks.map((t) => t.title || `Task ${(t.index ?? 0) + 1}`);
  const taskIndices = selectedTasks.map((t) => t.index).filter((idx): idx is number => idx !== undefined);

  // Convert selected on-chain tasks to ProjectData format for removal
  // IMPORTANT: tasks_to_remove requires full ProjectData objects, NOT just hashes!
  const selectedOnChainTasks = onChainTasks.filter((t) => t.taskHash && selectedOnChainTaskIds.has(t.taskHash));
  const tasksToRemove: ProjectData[] = selectedOnChainTasks.map((task) => {
    // On-chain content from hook data - may be hex or text
    const onChainContent = task.onChainContent ?? "";
    const projectContent = /^[0-9a-fA-F]+$/.exec(onChainContent) ? hexToText(onChainContent) : (task.title || "Task");

    // Expiration from hook data
    let expirationMs = parseInt(task.expirationTime ?? "0") || 0;
    if (expirationMs < 946684800000) {
      expirationMs = expirationMs * 1000;
    }

    return {
      project_content: projectContent,
      expiration_posix: expirationMs,
      lovelace_amount: parseInt(task.lovelaceAmount) || 5000000,
      native_assets: [],
    };
  });

  // Deposit calculation for publishing draft tasks
  const addLovelace = tasksToAdd.reduce((sum, t) => sum + t.lovelace_amount, 0);
  const removeLovelace = tasksToRemove.reduce((sum, t) => sum + t.lovelace_amount, 0);
  // Use API's treasury_balance (actual on-chain balance minus min-UTxO reserve)
  // instead of summing treasuryFundings (which only reflects historical deposits,
  // not accounting for funds already paid out to contributors).
  const treasuryBalance = projectDetail?.treasuryBalance ?? 0;
  const onChainCommitted = onChainTasks.reduce(
    (sum, t) => sum + (parseInt(t.lovelaceAmount) || 0),
    0,
  );
  const availableFunds = treasuryBalance - onChainCommitted;
  // Publishing: manager deposits the shortfall (removals handled separately, no deposit needed)
  const publishDepositAmount = Math.max(0, addLovelace - availableFunds);
  const publishDepositValue: ListValue = publishDepositAmount > 0 ? [["lovelace", publishDepositAmount]] : [];

  return (
    <AndamioScrollArea className="h-full">
    <div className="min-h-full">
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />

      <AndamioPageHeader
        title="Manage Treasury"
        description="Publish draft tasks on-chain and manage treasury settings"
      />

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <AndamioBadge variant="secondary">
          {draftTasks.length} Draft Task{draftTasks.length !== 1 ? "s" : ""}
        </AndamioBadge>
        <AndamioBadge variant="default" className="bg-primary text-primary-foreground">
          <OnChainIcon className="h-3 w-3 mr-1" />
          {onChainTaskCount} Published
        </AndamioBadge>
        {selectedTasks.length > 0 && (
          <AndamioBadge variant="outline" className="bg-primary/10">
            {selectedTasks.length} Selected
          </AndamioBadge>
        )}
      </div>

      {/* Treasury Balance */}
      <TreasuryBalanceCard
        treasuryFundings={projectDetail?.treasuryFundings ?? []}
        treasuryAddress={projectDetail?.treasuryAddress}
        treasuryBalance={projectDetail?.treasuryBalance}
        treasuryAssets={projectDetail?.treasuryAssets}
      />

      {/* Add Funds to Treasury */}
      <TreasuryAddFunds
        projectNftPolicyId={projectId}
        onSuccess={async () => {
          await refreshData();
        }}
      />

      {/* Task Management Tabs */}
      <AndamioTabs defaultValue="publish" className="w-full">
        <AndamioTabsList className="w-auto inline-flex h-9 mb-6">
          <AndamioTabsTrigger value="publish" className="text-sm gap-1.5 px-4">
            <AddIcon className="h-4 w-4" />
            Add to Treasury
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="remove" className="text-sm gap-1.5 px-4">
            <DeleteIcon className="h-4 w-4" />
            Remove from Treasury
          </AndamioTabsTrigger>
        </AndamioTabsList>

        {/* ============================================================= */}
        {/* PUBLISH TAB — Add draft tasks to the treasury                  */}
        {/* ============================================================= */}
        <AndamioTabsContent value="publish" className="space-y-4">
          {draftTasks.length > 0 ? (
            <AndamioCard>
              <AndamioCardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <AndamioCardTitle className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <AddIcon className="h-4 w-4 text-primary" />
                      </div>
                      Add to Treasury
                    </AndamioCardTitle>
                    <AndamioCardDescription>
                      Select draft tasks to publish on-chain. Each task locks its reward amount in the treasury.
                    </AndamioCardDescription>
                  </div>
                  <AndamioCheckbox
                    checked={selectedTaskIndices.size === draftTasks.length && draftTasks.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all draft tasks"
                  />
                </div>
              </AndamioCardHeader>
              <AndamioCardContent className="space-y-4">
                <AndamioTableContainer>
                  <AndamioTable>
                    <AndamioTableHeader>
                      <AndamioTableRow>
                        <AndamioTableHead className="w-12"></AndamioTableHead>
                        <AndamioTableHead>Title</AndamioTableHead>
                        <AndamioTableHead className="hidden md:table-cell">Hash</AndamioTableHead>
                        <AndamioTableHead className="w-32 text-center">Reward</AndamioTableHead>
                      </AndamioTableRow>
                    </AndamioTableHeader>
                    <AndamioTableBody>
                      {draftTasks.map((task) => {
                        const taskIndex = task.index ?? 0;
                        const isSelected = selectedTaskIndices.has(taskIndex);
                        const isValid = task.title.length > 0 && task.title.length <= 140;

                        return (
                          <AndamioTableRow
                            key={task.taskHash || `draft-${taskIndex}`}
                            className={isSelected ? "bg-primary/5" : ""}
                          >
                            <AndamioTableCell>
                              <AndamioCheckbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleTask(taskIndex)}
                                disabled={!isValid}
                                aria-label={`Select task ${taskIndex}`}
                              />
                            </AndamioTableCell>
                            <AndamioTableCell>
                              <div>
                                <AndamioText as="div" className="font-medium">{task.title || "Untitled Task"}</AndamioText>
                                {!isValid && (
                                  <AndamioText variant="small" className="text-muted-foreground">
                                    Title required (max 140 chars) for on-chain content
                                  </AndamioText>
                                )}
                              </div>
                            </AndamioTableCell>
                            <AndamioTableCell className="hidden md:table-cell font-mono text-xs">
                              {task.taskHash ? `${task.taskHash.slice(0, 16)}...` : "-"}
                            </AndamioTableCell>
                            <AndamioTableCell className="text-center">
                              <AndamioBadge variant="outline">{formatLovelace(task.lovelaceAmount)}</AndamioBadge>
                            </AndamioTableCell>
                          </AndamioTableRow>
                        );
                      })}
                    </AndamioTableBody>
                  </AndamioTable>
                </AndamioTableContainer>

                {/* Publish Transaction */}
                {(tasksToAdd.length > 0 || txInProgress === "add") && contributorStateId && (
                  <>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 space-y-3">
                      <AndamioText className="font-semibold text-base">Transaction Summary</AndamioText>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <AndamioText variant="small" className="text-sm text-muted-foreground">Publishing</AndamioText>
                          <AndamioText className="text-xl font-bold text-primary">
                            {tasksToAdd.length} {tasksToAdd.length !== 1 ? "tasks" : "task"}
                          </AndamioText>
                        </div>
                        <div className="space-y-1">
                          <AndamioText variant="small" className="text-sm text-muted-foreground">Total Rewards</AndamioText>
                          <AndamioText className="text-xl font-bold text-primary">
                            {addLovelace / 1_000_000} ADA
                          </AndamioText>
                        </div>
                        <div className="space-y-1">
                          <AndamioText variant="small" className="text-sm text-muted-foreground">Treasury Available</AndamioText>
                          <AndamioText className="text-xl font-bold">
                            {availableFunds / 1_000_000} ADA
                          </AndamioText>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <AndamioText variant="small" className={`text-sm ${publishDepositAmount > 0 ? "text-muted-foreground" : "text-primary font-medium"}`}>
                          {publishDepositAmount > 0
                            ? `Wallet deposit required: ${publishDepositAmount / 1_000_000} ADA`
                            : "No additional deposit needed — treasury covers it"}
                        </AndamioText>
                      </div>
                    </div>

                    <TasksManage
                      projectNftPolicyId={projectId}
                      contributorStateId={contributorStateId}
                      tasksToAdd={tasksToAdd}
                      tasksToRemove={[]}
                      depositValue={publishDepositValue}
                      taskCodes={taskCodes}
                      taskIndices={taskIndices}
                      onTxSubmit={() => setTxInProgress("add")}
                      onSuccess={async () => {
                        setTxInProgress(null);
                        setSelectedTaskIndices(new Set());
                        await refreshData();
                      }}
                    />
                  </>
                )}
              </AndamioCardContent>
            </AndamioCard>
          ) : (
            <AndamioEmptyState
              icon={TaskIcon}
              title="No Draft Tasks"
              description="All tasks have been published on-chain, or no tasks have been created yet."
            />
          )}
        </AndamioTabsContent>

        {/* ============================================================= */}
        {/* REMOVE TAB — Remove on-chain tasks from the treasury           */}
        {/* ============================================================= */}
        <AndamioTabsContent value="remove" className="space-y-4">
          {onChainTasks.length > 0 ? (
            <AndamioCard className="border-destructive/20">
              <AndamioCardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <AndamioCardTitle className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                        <DeleteIcon className="h-4 w-4 text-destructive" />
                      </div>
                      Remove from Treasury
                    </AndamioCardTitle>
                    <AndamioCardDescription>
                      Select on-chain tasks to remove. Removed tasks return their locked reward to the treasury.
                    </AndamioCardDescription>
                  </div>
                  <AndamioCheckbox
                    checked={selectedOnChainTaskIds.size === onChainTasks.length && onChainTasks.length > 0}
                    onCheckedChange={handleSelectAllOnChain}
                    aria-label="Select all on-chain tasks"
                  />
                </div>
              </AndamioCardHeader>
              <AndamioCardContent className="space-y-4">
                <AndamioTableContainer>
                  <AndamioTable>
                    <AndamioTableHeader>
                      <AndamioTableRow>
                        <AndamioTableHead className="w-12"></AndamioTableHead>
                        <AndamioTableHead>Content</AndamioTableHead>
                        <AndamioTableHead className="hidden md:table-cell">Hash</AndamioTableHead>
                        <AndamioTableHead className="w-32 text-center">Reward</AndamioTableHead>
                        <AndamioTableHead className="hidden sm:table-cell w-32 text-center">Expires</AndamioTableHead>
                      </AndamioTableRow>
                    </AndamioTableHeader>
                    <AndamioTableBody>
                      {onChainTasks.map((task, mapIdx) => {
                        const taskHash = task.taskHash ?? "";
                        const isSelected = selectedOnChainTaskIds.has(taskHash);
                        const displayContent = task.title || (task.onChainContent ? hexToText(task.onChainContent) : "(empty content)");
                        const expirationMs = parseInt(task.expirationTime ?? "0") || 0;
                        const expirationDate = new Date(expirationMs < 946684800000 ? expirationMs * 1000 : expirationMs);

                        return (
                          <AndamioTableRow
                            key={`${taskHash || task.index}-${mapIdx}`}
                            className={isSelected ? "bg-destructive/5" : ""}
                          >
                            <AndamioTableCell>
                              <AndamioCheckbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleOnChainTask(taskHash)}
                                disabled={!taskHash}
                                aria-label={`Select task for removal`}
                              />
                            </AndamioTableCell>
                            <AndamioTableCell>
                              <AndamioText as="div" className="font-medium">
                                {displayContent}
                              </AndamioText>
                            </AndamioTableCell>
                            <AndamioTableCell className="hidden md:table-cell font-mono text-xs">
                              {taskHash ? `${taskHash.slice(0, 16)}...` : "-"}
                            </AndamioTableCell>
                            <AndamioTableCell className="text-center">
                              <AndamioBadge variant="outline">{formatLovelace(task.lovelaceAmount)}</AndamioBadge>
                            </AndamioTableCell>
                            <AndamioTableCell className="hidden sm:table-cell text-center text-xs text-muted-foreground">
                              {expirationDate.toLocaleDateString()}
                            </AndamioTableCell>
                          </AndamioTableRow>
                        );
                      })}
                    </AndamioTableBody>
                  </AndamioTable>
                </AndamioTableContainer>

                {/* Remove Transaction */}
                {(tasksToRemove.length > 0 || txInProgress === "remove") && contributorStateId && (
                  <>
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs space-y-1">
                      <div className="font-medium">Removal Summary</div>
                      <div className="text-destructive">Removing {tasksToRemove.length} task{tasksToRemove.length !== 1 ? "s" : ""} ({removeLovelace / 1_000_000} ADA returned)</div>
                    </div>

                    <TasksManage
                      projectNftPolicyId={projectId}
                      contributorStateId={contributorStateId}
                      tasksToAdd={[]}
                      tasksToRemove={tasksToRemove}
                      depositValue={[]}
                      taskCodes={[]}
                      taskIndices={[]}
                      onTxSubmit={() => setTxInProgress("remove")}
                      onSuccess={async () => {
                        setTxInProgress(null);
                        toast.success("Tasks removed successfully!");
                        setSelectedOnChainTaskIds(new Set());
                        await refreshData();
                      }}
                    />
                  </>
                )}
              </AndamioCardContent>
            </AndamioCard>
          ) : (
            <AndamioEmptyState
              icon={OnChainIcon}
              title="No On-Chain Tasks"
              description="No tasks are currently published on-chain."
            />
          )}
        </AndamioTabsContent>
      </AndamioTabs>

    </div>
    </div>
    </AndamioScrollArea>
  );
}
