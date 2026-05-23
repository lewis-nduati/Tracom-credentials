"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import {
  AndamioBadge,
  AndamioButton,
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioDashboardStat,
  AndamioBackButton,
  AndamioErrorAlert,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioSectionHeader,
  AndamioSeparator,
  AndamioText,
} from "~/components/andamio";
import { ContentDisplay } from "~/components/content-display";
import { ContentEditor, ContentViewer } from "~/components/editor";
import { PendingIcon, TokenIcon, TeacherIcon, EditIcon, SuccessIcon, ContributorIcon, CredentialIcon, AlertIcon, OnChainIcon, RefreshIcon, CourseIcon, LockedIcon } from "~/components/icons";
import type { JSONContent } from "@tiptap/core";
import { computeAssignmentInfoHash } from "@andamio/core/hashing";
import { formatLovelace } from "~/lib/cardano-utils";
import { formatCommitmentStatus, formatTaskStatus } from "~/lib/format-status";
import { TaskCommit, TaskAction, ProjectCredentialClaim } from "~/components/tx";
import { ConnectWalletPrompt } from "~/components/auth/connect-wallet-prompt";
import { useProjectTask, useProject, useProjectTasks, projectKeys } from "~/hooks/api/project/use-project";
import { useContributorCommitment, useContributorCommitments, projectContributorKeys } from "~/hooks/api/project/use-project-contributor";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTransactionExplorerUrl } from "~/lib/constants";
import { useStudentCompletionsForPrereqs } from "~/hooks/api/course/use-student-completions-for-prereqs";
import { checkProjectEligibility } from "~/lib/project-eligibility";
import { PrerequisiteList } from "~/components/project/prerequisite-list";

// ── Pure helpers (no component state dependency) ──────────────────────────

function formatPosixTimestamp(timestamp: string): string {
  const ms = parseInt(timestamp);
  if (isNaN(ms)) return timestamp;
  return new Date(ms).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCommitmentStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status.includes("ACCEPTED") || status === "REWARDS_CLAIMED" || status === "REWARDED") return "default";
  if (status.includes("DENIED") || status.includes("REFUSED")) return "destructive";
  if (status.includes("PENDING")) return "outline";
  return "secondary";
}

function truncateAlias(alias: string | undefined, maxLength = 12): string {
  if (!alias) return "Unknown";
  if (alias.length <= maxLength) return alias;
  return alias.slice(0, maxLength) + "\u2026";
}

/**
 * Task Detail Page - Public view of a task with full commitment lifecycle
 *
 * Data strategy: Three hooks, minimal redundancy.
 * - useProjectTask(projectId, taskHash) — selects one task from the shared
 *   projectKeys.tasks(projectId) cache. If the project page was visited first,
 *   this is a pure cache hit (zero network requests).
 * - useProject(projectId) — project-level data for contributor context
 *   (contributors, submissions, assessments, credentialClaims).
 * - useContributorCommitment(projectId, taskHash) — authenticated-only query
 *   for the user's commitment status on this task. 404 = no commitment yet.
 */
export default function TaskDetailPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const taskHash = params.taskhash as string;
  const { isAuthenticated, user } = useAndamioAuth();
  const queryClient = useQueryClient();

  // Task data from shared cache — includes contentJson, contributorStateId, etc.
  const { data: task, isLoading: isTaskLoading, error: taskError } = useProjectTask(projectId, taskHash);

  // Project-level data for contributor context
  const { data: project } = useProject(projectId);
  const { data: allTasks = [] } = useProjectTasks(projectId);

  // Available tasks: exclude consumed UTxOs, count unique hashes
  const availableTaskCount = useMemo(() => {
    const liveTasks = allTasks.filter((t) => t.taskStatus === "ON_CHAIN");
    const submittedHashes = new Set(
      (project?.submissions ?? []).map((s) => s.taskHash).filter(Boolean),
    );
    const available = liveTasks.filter((t) => !submittedHashes.has(t.taskHash ?? ""));
    return new Set(available.map((t) => t.taskHash).filter(Boolean)).size;
  }, [allTasks, project?.submissions]);

  // Prerequisite eligibility (same pattern as project detail page)
  const prereqCourseIds = useMemo(() => {
    if (!project?.prerequisites) return [];
    return project.prerequisites
      .map((p) => p.courseId)
      .filter((id): id is string => !!id);
  }, [project?.prerequisites]);

  const { completions: prereqCompletions, isLoading: isEligibilityLoading } =
    useStudentCompletionsForPrereqs(prereqCourseIds);

  const prerequisites = useMemo(() => project?.prerequisites ?? [], [project?.prerequisites]);
  const eligibility = useMemo(() => {
    if (!isAuthenticated || prerequisites.length === 0) return null;
    return checkProjectEligibility(prerequisites, prereqCompletions);
  }, [isAuthenticated, prerequisites, prereqCompletions]);

  // Commitment status (authenticated only, 404 → null = no commitment yet)
  const { data: commitment, isLoading: isCommitmentLoading } = useContributorCommitment(
    projectId,
    taskHash
  );

  // Evidence editor state
  const [evidence, setEvidence] = useState<JSONContent | null>(null);
  const [isEditingEvidence, setIsEditingEvidence] = useState(false);

  // Pending TX hash for task actions
  const [pendingActionTxHash, setPendingActionTxHash] = useState<string | null>(null);

  // Show claim flow (revealed after clicking "Leave & Claim")
  const [showClaimFlow, setShowClaimFlow] = useState(false);

  // All commitments in this project (for isFirstCommit + credential context)
  const { data: allMyCommitments = [] } = useContributorCommitments(projectId);

  // isFirstCommit: true only if user has NEVER successfully committed to any task.
  // Filter out PENDING_TX_COMMIT — those haven't confirmed on-chain, so the user
  // isn't registered as a contributor yet and needs the "join+commit" TX path.
  const isFirstCommit = allMyCommitments.filter(
    (c) => c.commitmentStatus !== "PENDING_TX_COMMIT"
  ).length === 0;

  // Previous ACCEPTED task hash — used to pass previous_task_hash in TX metadata
  // so the gateway can transition the previous commitment to REWARDED.
  const previousAcceptedTaskHash = useMemo(() => {
    return allMyCommitments.find(
      (c) => c.commitmentStatus === "ACCEPTED" && c.taskHash !== taskHash
    )?.taskHash;
  }, [allMyCommitments, taskHash]);

  const willClaimRewards = !!previousAcceptedTaskHash;

  // Fallback: when the commitment detail endpoint returns 404 (chain-only
  // commitments, REFUSED state, or other cases where the single-get endpoint
  // misses data), detect ANY matching commitment from the list endpoint.
  // This prevents the UI from showing TaskCommit (which fails with STATE_ERROR
  // since the UTxO is already consumed on-chain) instead of the correct
  // status-specific UI (TaskAction for REFUSED/COMMITTED, etc.).
  const listFallback = !commitment
    ? allMyCommitments.find(c => c.taskHash === taskHash) ?? null
    : null;

  const isTaskAccepted = commitment?.commitmentStatus === "ACCEPTED";

  // Derive accepted task reward from project tasks
  const acceptedTaskReward = useMemo(() => {
    if (!isTaskAccepted || !task) return "0";
    return task.lovelaceAmount ?? "0";
  }, [isTaskAccepted, task]);

  // Check if evidence is valid (has actual content)
  const hasValidEvidence = evidence?.content &&
    Array.isArray(evidence.content) &&
    evidence.content.length > 0 &&
    !(evidence.content.length === 1 &&
      evidence.content[0]?.type === "paragraph" &&
      (!evidence.content[0]?.content || evidence.content[0]?.content.length === 0));

  // Detect unchanged evidence: hash the current editor content and compare
  // with the on-chain evidence hash. Prevents accidental resubmission when
  // the contributor hasn't actually updated their evidence.
  const evidenceUnchanged = useMemo(() => {
    const activeEvidence = evidence ?? (commitment?.evidence as JSONContent | undefined)
      ?? (listFallback?.evidence as JSONContent | undefined);
    if (!activeEvidence || Object.keys(activeEvidence).length === 0) return false;
    const onChainHash = commitment?.taskEvidenceHash ?? listFallback?.taskEvidenceHash;
    if (!onChainHash) return false;
    try {
      return computeAssignmentInfoHash(activeEvidence) === onChainHash;
    } catch {
      return false;
    }
  }, [evidence, commitment?.evidence, commitment?.taskEvidenceHash, listFallback?.evidence, listFallback?.taskEvidenceHash]);

  // Clear stale pending TX hash when commitment status transitions
  useEffect(() => {
    setPendingActionTxHash(null);
  }, [commitment?.commitmentStatus]);

  // Refresh all data: invalidate React Query caches (parallel)
  // Must invalidate ALL contributor keys so sibling pages (contributor, project detail)
  // don't show stale commitment status after Leave & Claim or other TX flows.
  const refreshData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: projectContributorKeys.all,
      }),
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      }),
      queryClient.invalidateQueries({
        queryKey: projectKeys.tasks(projectId),
      }),
    ]);
  }, [queryClient, projectId]);

  // ── Loading / Error states ─────────────────────────────────────────────

  if (isTaskLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  const errorMessage = taskError instanceof Error ? taskError.message : taskError ? "Failed to load task" : null;
  if (errorMessage || !task) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert error={errorMessage ?? "Task not found"} />
      </div>
    );
  }

  const createdBy = truncateAlias(task.createdByAlias);

  const contributorStateId = project?.contributorStateId ?? task.contributorStateId ?? "0".repeat(56);

  // Unified reference: the commitment detail, or list-endpoint fallback.
  // Used throughout the JSX for data access (evidence, submissionTx, etc.).
  const activeCommitment = commitment ?? listFallback;
  const commitmentStatus = activeCommitment?.commitmentStatus ?? null;

  // Pre-assignment gate: check if task is reserved for a specific contributor
  const preAssignedAlias = task?.preAssignedAlias ?? null;
  const isPreAssigned = !!preAssignedAlias;
  const isAssignedToCurrentUser =
    isPreAssigned && user?.accessTokenAlias === preAssignedAlias;
  // Frontend-only gate — API has no pre-assignment awareness; enforce server-side in future
  const isBlockedByPreAssignment =
    isPreAssigned && isAuthenticated && !isAssignedToCurrentUser;

  // Task publication status — prevent commits to unpublished tasks
  const isTaskDraft = task.taskStatus === "DRAFT";
  const isTaskPendingTx = task.taskStatus === "PENDING_TX";
  const isTaskUnpublished = isTaskDraft || isTaskPendingTx;

  // Card description for the commitment status section
  let commitmentCardDescription: string;
  if (!isAuthenticated) {
    commitmentCardDescription = "Connect your wallet to commit to this task";
  } else if (isCommitmentLoading) {
    commitmentCardDescription = "Loading commitment status\u2026";
  } else if (!activeCommitment) {
    commitmentCardDescription = "Commit to this task to get started";
  } else if (commitmentStatus === "ACCEPTED") {
    commitmentCardDescription = "Your work has been accepted!";
  } else {
    commitmentCardDescription = "Track your progress on this task";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <AndamioBackButton href={`/project/${projectId}`} label="Back to Project" />
        <div className="flex items-center gap-2">
          <AndamioBadge variant="outline" className="font-mono text-xs">
            #{task.index}
          </AndamioBadge>
          <AndamioBadge variant="default">
            {formatTaskStatus(task.taskStatus ?? "")}
          </AndamioBadge>
        </div>
      </div>

      {/* Task Title and Description */}
      <AndamioPageHeader
        title={task.title || "Untitled Task"}
        description={task.description || undefined}
      />

      {/* Task Stats */}
      <div className={`grid grid-cols-2 gap-4 ${preAssignedAlias ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        <AndamioDashboardStat
          icon={TokenIcon}
          label="Reward"
          value={formatLovelace(task.lovelaceAmount ?? "0")}
          iconColor="success"
        />
        <AndamioDashboardStat
          icon={PendingIcon}
          label="Expires"
          value={formatPosixTimestamp(task.expirationTime ?? "0")}
        />
        <AndamioDashboardStat
          icon={TeacherIcon}
          label="Created By"
          value={createdBy}
          iconColor="info"
        />
        {preAssignedAlias && (
          <AndamioDashboardStat
            icon={LockedIcon}
            label="Assigned To"
            value={`@${preAssignedAlias}`}
            iconColor="info"
          />
        )}
      </div>

      {/* Task Hash */}
      <div className="p-3 bg-muted rounded-lg">
        <AndamioText variant="small" className="text-xs mb-1">Task Hash (On-Chain ID)</AndamioText>
        <AndamioText className="font-mono text-sm break-all">
          {task.taskHash || taskHash}
        </AndamioText>
      </div>

      {/* Task Content (rich content from contentJson) */}
      {!!task.contentJson && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Task Details</AndamioCardTitle>
            <AndamioCardDescription>Full task instructions and requirements</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <ContentDisplay content={task.contentJson as JSONContent} />
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Token Rewards (if any) */}
      {task.tokens && task.tokens.length > 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Additional Token Rewards</AndamioCardTitle>
            <AndamioCardDescription>Native tokens included with this task</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="space-y-2">
              {task.tokens.map((token, idx) => {
                const displayName = token.assetName || (token.policyId ? token.policyId.slice(0, 16) : `Token ${idx + 1}`);
                return (
                  <div key={token.policyId || idx} className="flex items-center justify-between p-2 border rounded">
                    <AndamioText className="font-medium font-mono text-sm">
                      {displayName}
                    </AndamioText>
                    <AndamioBadge variant="outline">{token.quantity}</AndamioBadge>
                  </div>
                );
              })}
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* ── Commitment Status Card ─────────────────────────────────────── */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Your Commitment</AndamioCardTitle>
          <AndamioCardDescription>
            {commitmentCardDescription}
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          {!isAuthenticated ? (
            /* ── Not authenticated ──────────────────────────── */
            <div className="text-center py-6">
              <AndamioText variant="muted" className="mb-4">Connect your wallet to commit to this task</AndamioText>
              <ConnectWalletPrompt />
            </div>
          ) : isCommitmentLoading ? (
            /* ── Loading ────────────────────────────────────── */
            <div className="text-center py-6">
              <AndamioText variant="muted">Checking commitment status…</AndamioText>
            </div>
          ) : commitmentStatus === "REWARDED" ? (
            /* ── Reward claimed — per-commitment REWARDED status ── */
            <div className="rounded-sm border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <SuccessIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <AndamioText className="font-medium">Reward Claimed</AndamioText>
                  <AndamioText variant="small" className="mt-1 text-muted-foreground">
                    You&apos;ve claimed your reward for this task.
                  </AndamioText>
                </div>
              </div>
            </div>
          ) : commitmentStatus === "ACCEPTED" ? (
            /* ── ACCEPTED (current) — Post-acceptance flow ────────── */
            <div className="space-y-4">
              {/* Acceptance banner */}
              <div className="rounded-sm border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <SuccessIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <AndamioText className="font-medium text-primary">
                      Your work was accepted!
                    </AndamioText>
                    <AndamioText variant="small" className="mt-1">
                      You earned {formatLovelace(acceptedTaskReward)}. Choose your next step below.
                    </AndamioText>
                  </div>
                </div>
              </div>

              {!showClaimFlow ? (
                <>
                  {/* Decision Cards */}
                  <div className={`grid grid-cols-1 ${availableTaskCount > 0 ? "md:grid-cols-2" : ""} gap-4`}>
                    {/* Option A: Continue Contributing (only when tasks are available) */}
                    {availableTaskCount > 0 ? (
                      <Link href={`/project/${projectId}`} className="block">
                        <div className="rounded-sm border p-4 space-y-3 hover:border-primary/50 transition-colors cursor-pointer h-full">
                          <div className="flex items-center gap-2">
                            <ContributorIcon className="h-5 w-5 text-primary" />
                            <AndamioText className="font-medium">Continue Contributing</AndamioText>
                          </div>
                          <AndamioText variant="small">
                            Browse {availableTaskCount} available {availableTaskCount === 1 ? "task" : "tasks"} and commit to a new one. Your {formatLovelace(acceptedTaskReward)} reward will be claimed automatically.
                          </AndamioText>
                        </div>
                      </Link>
                    ) : (
                      <div className="rounded-sm border border-muted p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertIcon className="h-5 w-5 text-muted-foreground" />
                          <AndamioText className="font-medium text-muted-foreground">No Tasks Available</AndamioText>
                        </div>
                        <AndamioText variant="small">
                          There are no open tasks in this project right now. Claim your credential and {formatLovelace(acceptedTaskReward)} reward below.
                        </AndamioText>
                      </div>
                    )}

                    {/* Option B: Leave & Claim */}
                    <button
                      type="button"
                      onClick={() => setShowClaimFlow(true)}
                      className="rounded-sm border border-primary/20 p-4 space-y-3 hover:border-primary/50 transition-colors cursor-pointer h-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <CredentialIcon className="h-5 w-5 text-primary" />
                        <AndamioText className="font-medium">Leave & Claim</AndamioText>
                      </div>
                      <AndamioText variant="small">
                        Leave the project, claim {formatLovelace(acceptedTaskReward)} in rewards, and mint your credential NFT.
                      </AndamioText>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* ProjectCredentialClaim TX component — revealed after clicking Leave & Claim */}
                  {eligibility === null || eligibility.eligible ? (
                    <ProjectCredentialClaim
                      projectNftPolicyId={projectId}
                      contributorStateId={contributorStateId}
                      taskHash={taskHash}
                      projectTitle={project?.title || undefined}
                      pendingRewardLovelace={acceptedTaskReward}
                      onSuccess={async () => {
                        await refreshData();
                      }}
                    />
                  ) : (
                    <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-4">
                      <div className="flex items-start gap-3">
                        <AlertIcon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <AndamioText className="font-medium text-destructive">
                            Prerequisites Not Met
                          </AndamioText>
                          <AndamioText variant="small" className="mt-1">
                            You need to complete the required course modules before claiming your credential.
                          </AndamioText>
                        </div>
                      </div>
                    </div>
                  )}
                  <AndamioButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClaimFlow(false)}
                    className="cursor-pointer"
                  >
                    Back to options
                  </AndamioButton>
                </>
              )}
            </div>
          ) : commitmentStatus === "PENDING_TX_COMMIT" ? (
            /* ── PENDING_TX_COMMIT — Read-only evidence + TX info ─── */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <AndamioText as="span" variant="small" className="font-medium">Status</AndamioText>
                <AndamioBadge variant="outline">
                  Awaiting Confirmation
                </AndamioBadge>
              </div>

              {activeCommitment?.pendingTxHash && (
                <>
                  <AndamioSeparator />
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <OnChainIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <AndamioText variant="small" className="font-medium truncate">Pending Transaction</AndamioText>
                    </div>
                    <a
                      href={getTransactionExplorerUrl(activeCommitment.pendingTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline truncate shrink-0"
                    >
                      {activeCommitment.pendingTxHash.slice(0, 12)}...
                    </a>
                  </div>
                </>
              )}

              <AndamioSeparator />
              <div>
                <AndamioText variant="small" className="font-medium mb-2">Submitted Evidence</AndamioText>
                <div className="min-h-[100px] border rounded-lg bg-muted/20 p-4">
                  {activeCommitment?.evidence ? (
                    <ContentViewer content={activeCommitment.evidence as JSONContent} />
                  ) : (
                    <AndamioText variant="small" className="text-muted-foreground italic">
                      No evidence recorded
                    </AndamioText>
                  )}
                </div>
              </div>

              <AndamioText variant="small" className="text-muted-foreground">
                Waiting for blockchain confirmation. This usually takes a few minutes.
              </AndamioText>

              <AndamioButton
                variant="outline"
                size="sm"
                onClick={async () => {
                  await refreshData();
                  toast.info("Data refreshed", {
                    description: "Check back in a few seconds if the transaction hasn't confirmed yet.",
                  });
                }}
              >
                <RefreshIcon className="h-4 w-4 mr-2" />
                Refresh Status
              </AndamioButton>
            </div>
          ) : commitmentStatus === "DENIED" ? (
            /* ── DENIED — Terminal state, no resubmit ── */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <AndamioText as="span" variant="small" className="font-medium">Status</AndamioText>
                <AndamioBadge variant="destructive">
                  {formatCommitmentStatus(commitmentStatus)}
                </AndamioBadge>
              </div>
              <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertIcon className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <AndamioText variant="small">
                    Your contribution has been permanently denied. You cannot rejoin this task.
                  </AndamioText>
                </div>
              </div>
            </div>
          ) : commitmentStatus === "COMMITTED" || commitmentStatus === "REFUSED" ? (
            /* ── COMMITTED / REFUSED — Evidence + TaskAction ── */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <AndamioText as="span" variant="small" className="font-medium">Status</AndamioText>
                <AndamioBadge variant={getCommitmentStatusVariant(commitmentStatus)}>
                  {formatCommitmentStatus(commitmentStatus)}
                </AndamioBadge>
              </div>

              {commitmentStatus === "REFUSED" && (
                <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertIcon className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <AndamioText variant="small">
                      Your work was not accepted. Update your evidence and resubmit below.
                    </AndamioText>
                  </div>
                </div>
              )}

              {commitmentStatus === "COMMITTED" && (
                <AndamioText variant="small" className="text-muted-foreground">
                  Evidence submitted. Waiting for manager review. You can update your evidence below.
                </AndamioText>
              )}

              {activeCommitment?.submissionTx && (
                <>
                  <AndamioSeparator />
                  <div>
                    <AndamioText variant="small" className="mb-1">Submission Transaction</AndamioText>
                    <a
                      href={getTransactionExplorerUrl(activeCommitment.submissionTx)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {activeCommitment.submissionTx.slice(0, 16)}...{activeCommitment.submissionTx.slice(-8)}
                    </a>
                  </div>
                </>
              )}

              <AndamioSeparator />

              {/* Evidence editor */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <EditIcon className="h-4 w-4 text-muted-foreground" />
                  <AndamioText className="font-medium">
                    {commitmentStatus === "REFUSED" ? "Resubmit Your Evidence" : "Update Your Evidence"}
                  </AndamioText>
                </div>
                <div className="min-h-[200px] border rounded-lg">
                  <ContentEditor
                    content={evidence ?? (activeCommitment?.evidence as JSONContent | null)}
                    onContentChange={setEvidence}
                  />
                </div>
                {!hasValidEvidence && (
                  <AndamioText variant="small" className="text-muted-foreground">
                    Please provide evidence describing your work on this task.
                  </AndamioText>
                )}
                {hasValidEvidence && (
                  <AndamioText variant="small" className="text-primary flex items-center gap-1">
                    <SuccessIcon className="h-4 w-4" />
                    Evidence ready for submission
                  </AndamioText>
                )}
              </div>

              {/* TaskAction TX component — hidden when evidence hasn't changed */}
              {evidenceUnchanged ? (
                <div className="rounded-sm border bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <SuccessIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <AndamioText className="font-medium">
                        {commitmentStatus === "REFUSED"
                          ? "Update your evidence to resubmit"
                          : "Evidence already submitted"}
                      </AndamioText>
                      <AndamioText variant="small" className="text-muted-foreground mt-1">
                        {commitmentStatus === "REFUSED"
                          ? "Your current evidence matches what was refused. Edit your evidence above before resubmitting."
                          : "Your current evidence matches what\u2019s already on chain. Edit your evidence above to submit an update."}
                      </AndamioText>
                    </div>
                  </div>
                </div>
              ) : (
                <TaskAction
                  projectNftPolicyId={projectId}
                  contributorStateId={contributorStateId}
                  taskHash={taskHash}
                  taskCode={`TASK_${task.index}`}
                  taskTitle={task.title ?? undefined}
                  taskEvidence={evidence ?? (activeCommitment?.evidence as JSONContent | undefined)}
                  onSuccess={async (result) => {
                    setPendingActionTxHash(result.txHash);
                    try {
                      await refreshData();
                    } finally {
                      // Clear after cache settles (or fails) — evidenceUnchanged
                      // guard now shows the correct state, no stale "Pending" block.
                      setPendingActionTxHash(null);
                    }
                  }}
                />
              )}

              {/* Pending action TX hash */}
              {pendingActionTxHash && (
                <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <OnChainIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <AndamioText variant="small" className="font-medium truncate">Pending Transaction</AndamioText>
                    </div>
                    <a
                      href={getTransactionExplorerUrl(pendingActionTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline truncate shrink-0"
                    >
                      {pendingActionTxHash.slice(0, 12)}...
                    </a>
                  </div>
                  <AndamioButton
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await refreshData();
                      toast.info("Data refreshed");
                    }}
                  >
                    <RefreshIcon className="h-4 w-4 mr-2" />
                    Refresh Status
                  </AndamioButton>
                </div>
              )}
            </div>
          ) : activeCommitment ? (
            /* ── Other commitment status (fallback display) ─── */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <AndamioText as="span" variant="small" className="font-medium">Status</AndamioText>
                <AndamioBadge variant={getCommitmentStatusVariant(activeCommitment.commitmentStatus ?? "")}>
                  {formatCommitmentStatus(activeCommitment.commitmentStatus ?? "")}
                </AndamioBadge>
              </div>

              {activeCommitment.submissionTx && (
                <>
                  <AndamioSeparator />
                  <div>
                    <AndamioText variant="small" className="mb-1">Pending Transaction</AndamioText>
                    <AndamioText className="font-mono text-xs break-all">{activeCommitment.submissionTx}</AndamioText>
                  </div>
                </>
              )}

              {activeCommitment.evidence != null && (
                <>
                  <AndamioSeparator />
                  <div>
                    <AndamioText variant="small" className="font-medium mb-2">Your Evidence</AndamioText>
                    <ContentDisplay
                      content={activeCommitment.evidence as JSONContent}
                      variant="muted"
                    />
                  </div>
                </>
              )}
            </div>
          ) : isEligibilityLoading && prereqCourseIds.length > 0 ? (
            /* ── Eligibility loading ────────────────────────── */
            <div className="text-center py-6">
              <AndamioText variant="muted">Checking eligibility…</AndamioText>
            </div>
          ) : eligibility?.eligible === false ? (
            /* ── Not eligible — show prerequisites ────────── */
            <div className="py-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mx-auto">
                  <CourseIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <AndamioText className="font-medium">
                  Prerequisites Required
                </AndamioText>
                <AndamioText variant="muted">
                  Complete the required courses to unlock this task
                </AndamioText>
                <div>
                  <AndamioBadge variant="outline">
                    <CredentialIcon className="h-3 w-3 mr-1" />
                    {eligibility.totalCompleted} of {eligibility.totalRequired} completed
                  </AndamioBadge>
                </div>
              </div>
              <PrerequisiteList
                prerequisites={prerequisites}
                completions={prereqCompletions}
              />
              <div className="text-center">
                <Link href={`/project/${projectId}`}>
                  <AndamioButton
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    View Project
                  </AndamioButton>
                </Link>
              </div>
            </div>
          ) : isBlockedByPreAssignment ? (
            /* ── Pre-assigned to someone else — blocked ────── */
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mx-auto">
                <AlertIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <AndamioText className="font-medium">
                  This task is reserved
                </AndamioText>
                <AndamioText variant="muted">
                  Pre-assigned to{" "}
                  <span className="font-medium">@{preAssignedAlias}</span>.
                  Only they can commit to this task.
                </AndamioText>
              </div>
              <Link href={`/project/${projectId}`}>
                <AndamioButton
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  Browse other tasks
                </AndamioButton>
              </Link>
            </div>
          ) : isTaskUnpublished ? (
            /* ── Task not published — show message ────── */
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mx-auto">
                <AlertIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <AndamioText className="font-medium">
                  Task Not Yet Published
                </AndamioText>
                <AndamioText variant="muted">
                  This task hasn&apos;t been published on-chain yet. Ask the project manager to publish tasks before committing.
                </AndamioText>
                {isTaskPendingTx && (
                  <AndamioBadge variant="outline">
                    <PendingIcon className="h-3 w-3 mr-1" />
                    Publishing in progress
                  </AndamioBadge>
                )}
              </div>
              <Link href={`/project/${projectId}`}>
                <AndamioButton
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  Back to Project
                </AndamioButton>
              </Link>
            </div>
          ) : (
            /* ── No commitment — Commit to This Task ────────── */
            <div className="text-center py-6">
              {isAssignedToCurrentUser && (
                <div className="flex items-center justify-center gap-2 rounded-sm border border-primary/20 bg-primary/5 p-3 mb-4">
                  <SuccessIcon className="h-4 w-4 text-primary shrink-0" />
                  <AndamioText variant="small">
                    This task is assigned to you
                  </AndamioText>
                </div>
              )}
              {isEditingEvidence ? (
                <AndamioText variant="muted">
                  Complete your submission below
                </AndamioText>
              ) : (
                <>
                  <AndamioText variant="muted" className="mb-4">
                    You haven&apos;t committed to this task yet
                  </AndamioText>
                  <AndamioButton
                    variant="outline"
                    onClick={() => setIsEditingEvidence(true)}
                    className="cursor-pointer"
                  >
                    <EditIcon className="h-4 w-4 mr-2" />
                    Commit to This Task
                  </AndamioButton>
                </>
              )}
            </div>
          )}
        </AndamioCardContent>
      </AndamioCard>

      {/* ── Evidence Editor and Transaction (new commitment) ────────── */}
      {isAuthenticated && !activeCommitment && eligibility?.eligible !== false && !isBlockedByPreAssignment && !isTaskUnpublished && isEditingEvidence && (
        <div className="space-y-6">
          <AndamioSectionHeader
            title="Your Work"
            icon={<EditIcon className="h-5 w-5" />}
          />

          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Your Submission</AndamioCardTitle>
              <AndamioCardDescription>
                Describe your plan or provide your work so far
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent>
              <ContentEditor
                content={evidence}
                onContentChange={setEvidence}
                showWordCount
              />
            </AndamioCardContent>
          </AndamioCard>

          {/* Transaction Component - PROJECT_CONTRIBUTOR_TASK_COMMIT */}
          {evidence && Object.keys(evidence).length > 0 && (
            <TaskCommit
              projectNftPolicyId={projectId}
              contributorStateId={contributorStateId}
              taskHash={taskHash}
              taskCode={`TASK_${task.index}`}
              taskTitle={task.title ?? undefined}
              taskEvidence={evidence}
              taskStatus={task.taskStatus}
              isFirstCommit={isFirstCommit}
              willClaimRewards={willClaimRewards}
              previousAcceptedTaskHash={previousAcceptedTaskHash}
              onSuccess={async () => {
                // Await cache refresh BEFORE clearing editing state.
                // If we clear isEditingEvidence first, React re-renders
                // while activeCommitment is still null → flashes
                // "You haven't committed" with a submit button → confused
                // contributors click it again.
                try {
                  await refreshData();
                } finally {
                  setIsEditingEvidence(false);
                }
              }}
            />
          )}

          {/* Cancel Button */}
          <div className="flex justify-end">
            <AndamioButton
              variant="ghost"
              onClick={() => {
                setIsEditingEvidence(false);
                setEvidence(null);
              }}
            >
              Cancel
            </AndamioButton>
          </div>
        </div>
      )}
    </div>
  );
}
