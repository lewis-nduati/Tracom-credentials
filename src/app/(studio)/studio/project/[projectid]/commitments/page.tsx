"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useManagerCommitments, useProject, type ManagerCommitment } from "~/hooks/api";
import { useInvalidateManagerProjects } from "~/hooks/api/project/use-project-manager";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "~/components/tx/transaction-button";
import { ContentDisplay } from "~/components/content-display";
import type { JSONContent } from "@tiptap/core";
import { formatCommitmentStatus } from "~/lib/format-status";
import {
  AndamioBadge,
  AndamioButton,
  AndamioPageLoading,
  AndamioBackButton,
  AndamioErrorAlert,
  AndamioSearchInput,
  AndamioText,
  AndamioScrollArea,
  AndamioLabel,
  AndamioTooltip,
  AndamioTooltipContent,
  AndamioTooltipProvider,
  AndamioTooltipTrigger,
} from "~/components/andamio";
import {
  AndamioResizablePanelGroup,
  AndamioResizablePanel,
  AndamioResizableHandle,
} from "~/components/andamio/andamio-resizable";
import {
  ManagerIcon,
  SuccessIcon,
  ErrorIcon,
  CloseIcon,
  BlockIcon,
  LoadingIcon,
  AlertIcon,
  NextIcon,
} from "~/components/icons";
import { AndamioHeading } from "~/components/andamio/andamio-heading";

// =============================================================================
// Types
// =============================================================================

type AssessmentOutcome = "accept" | "refuse" | "deny";

// =============================================================================
// TX Stream Watcher
// =============================================================================

function TxStreamWatcher({
  txHash,
  onConfirmed,
  onFailed,
}: {
  txHash: string;
  onConfirmed: (txHash: string) => void;
  onFailed: (txHash: string) => void;
}) {
  const { isSuccess, isFailed, isStalled } = useTxStream(txHash);

  useEffect(() => {
    if (isSuccess) {
      onConfirmed(txHash);
    } else if (isFailed || isStalled) {
      onFailed(txHash);
    }
  }, [isSuccess, isFailed, isStalled, txHash, onConfirmed, onFailed]);

  return null;
}

// =============================================================================
// Helpers
// =============================================================================

const getStatusVariant = (
  status: string | undefined | null
): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return "outline";
  if (status === "SUBMITTED") return "secondary";
  if (status === "ACCEPTED") return "default";
  if (status === "REFUSED" || status === "DENIED") return "destructive";
  return "outline";
};


const getManagerStatusHint = (status: string | undefined | null): string | null => {
  switch (status) {
    case "AWAITING_SUBMISSION":
      return "Contributor committed to this task. Waiting for evidence submission.";
    case "SUBMITTED":
      return "Evidence submitted. Ready for your review.";
    case "PENDING_TX_COMMIT":
    case "PENDING_TX_ASSESS":
      return "A transaction is in progress.";
    case "ACCEPTED":
      return "You accepted this work. Reward is available to the contributor.";
    case "REFUSED":
      return "You refused this work. The contributor can resubmit with updated evidence.";
    case "DENIED":
      return "Permanently rejected. The contributor's deposit has been returned.";
    default:
      return null;
  }
};

// =============================================================================
// Page Component
// =============================================================================

/**
 * Project Commitments Page
 *
 * Manager review UI for contributor task submissions.
 * Uses a resizable two-panel layout:
 * - Left: browsable list with quick decision buttons
 * - Right: full detail view with evidence rendering
 *
 * Supports single assessment per submission (accept/refuse/deny).
 */
export default function ProjectCommitmentsPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { isAuthenticated, user } = useAndamioAuth();

  // Data hooks
  const { data: project, isLoading, error: projectError } = useProject(projectId);
  const {
    data: allCommitments,
    isLoading: isLoadingCommitments,
    error: commitmentsError,
    refetch: refetchCommitments,
  } = useManagerCommitments(projectId);
  const commitments = useMemo(() => allCommitments ?? [], [allCommitments]);
  const invalidateManager = useInvalidateManagerProjects();

  // V2 Transaction hook
  const assessTx = useTransaction();

  // Selected commitment for detail view
  const [selectedCommitment, setSelectedCommitment] = useState<ManagerCommitment | null>(null);

  // Pending decision for the selected commitment
  const [pendingDecision, setPendingDecision] = useState<{
    commitment: ManagerCommitment;
    outcome: AssessmentOutcome;
  } | null>(null);

  // TX state
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<{
    txHash: string;
    outcome: AssessmentOutcome;
    contributor: string;
  } | null>(null);
  const [confirmationState, setConfirmationState] = useState<
    "idle" | "confirming" | "confirmed" | "failed"
  >("idle");

  // Filtering
  const [searchQuery, setSearchQuery] = useState("");

  // Task hash → title lookup from project tasks
  const taskTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of project?.tasks ?? []) {
      if (task.taskHash && task.title) {
        map.set(task.taskHash, task.title);
      }
    }
    return map;
  }, [project?.tasks]);

  // Derived
  const filteredCommitments = useMemo(() => {
    if (!searchQuery) return commitments;
    const q = searchQuery.toLowerCase();
    return commitments.filter(
      (c) =>
        c.submittedBy.toLowerCase().includes(q) ||
        (taskTitleMap.get(c.taskHash) ?? c.taskHash).toLowerCase().includes(q)
    );
  }, [commitments, searchQuery, taskTitleMap]);

  // Get reward from commitment task context
  const getRewardAda = useCallback((commitment: ManagerCommitment): string | null => {
    const lovelace = commitment.task?.lovelaceAmount;
    if (lovelace) return (lovelace / 1_000_000).toFixed(0);
    return null;
  }, []);

  // Handle selection
  const handleSelect = (commitment: ManagerCommitment) => {
    setSelectedCommitment(
      selectedCommitment?.taskHash === commitment.taskHash &&
        selectedCommitment?.submittedBy === commitment.submittedBy
        ? null
        : commitment
    );
  };

  // Handle decision
  const handleDecision = useCallback(
    (commitment: ManagerCommitment, outcome: AssessmentOutcome) => {
      setPendingDecision({ commitment, outcome });
    },
    []
  );

  // Submit assessment TX
  const handleSubmitAssessment = useCallback(async () => {
    if (!pendingDecision || !user?.accessTokenAlias || !project?.contributorStateId) return;

    setTxSubmitting(true);
    assessTx.reset();

    await assessTx.execute({
      txType: "PROJECT_MANAGER_TASKS_ASSESS",
      params: {
        alias: user.accessTokenAlias,
        project_id: projectId,
        contributor_state_id: project.contributorStateId,
        task_decisions: [
          {
            alias: pendingDecision.commitment.submittedBy,
            outcome: pendingDecision.outcome,
          },
        ],
      },
      onSuccess: (result) => {
        setTxResult({
          txHash: result.txHash,
          outcome: pendingDecision.outcome,
          contributor: pendingDecision.commitment.submittedBy,
        });
        setConfirmationState("confirming");
        setTxSubmitting(false);
      },
      onError: () => {
        setTxSubmitting(false);
      },
    });
  }, [pendingDecision, user?.accessTokenAlias, project?.contributorStateId, projectId, assessTx]);

  // TX stream callbacks
  const handleTxConfirmed = useCallback(
    (_txHash: string) => {
      setConfirmationState("confirmed");
      void invalidateManager();
      void refetchCommitments();
    },
    [invalidateManager, refetchCommitments]
  );

  const handleTxFailed = useCallback(() => {
    setConfirmationState("failed");
  }, []);

  // Reset after assessment
  const resetAssessment = useCallback(() => {
    setPendingDecision(null);
    setTxResult(null);
    setConfirmationState("idle");
    assessTx.reset();
    setSelectedCommitment(null);
  }, [assessTx]);

  // Find next unreviewed commitment
  const findNextPending = useCallback(
    (current: ManagerCommitment | null) => {
      const pending = commitments.filter(
        (c) =>
          c.commitmentStatus === "SUBMITTED" &&
          !(c.taskHash === current?.taskHash && c.submittedBy === current?.submittedBy)
      );
      return pending[0] ?? null;
    },
    [commitments]
  );

  // Loading / error states
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  if (!isAuthenticated || !user?.accessTokenAlias) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert
          title="Authentication Required"
          error="Please connect your wallet to access project commitments."
        />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert error={projectError?.message ?? "Project not found"} />
      </div>
    );
  }

  const pendingCount = commitments.filter(
    (c) => c.commitmentStatus === "SUBMITTED"
  ).length;

  return (
    <div className="full-bleed h-full">
      <AndamioResizablePanelGroup direction="horizontal" className="h-full w-full">
        {/* ================================================================= */}
        {/* LEFT PANEL — Submission List                                      */}
        {/* ================================================================= */}
        <AndamioResizablePanel defaultSize={40} minSize={30} maxSize={55}>
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <AndamioHeading level={2} size="lg">
                    {project.title ?? "Project"}
                  </AndamioHeading>
                  <AndamioText variant="small" className="text-muted-foreground mt-0.5">
                    Commitment Reviews
                  </AndamioText>
                </div>
                <div className="flex items-center gap-2">
                  {pendingCount > 0 && (
                    <AndamioBadge variant="secondary">{pendingCount} pending</AndamioBadge>
                  )}
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <AndamioSearchInput
                inputSize="sm"
                placeholder="Search contributor or task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Scrollable list */}
            <AndamioScrollArea className="flex-1">
              {isLoadingCommitments ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : commitmentsError ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <AlertIcon className="h-8 w-8 text-destructive mb-2" />
                  <AndamioText variant="small" className="text-destructive text-center">
                    Failed to load commitments
                  </AndamioText>
                  <AndamioButton
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => void refetchCommitments()}
                  >
                    Retry
                  </AndamioButton>
                </div>
              ) : filteredCommitments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <SuccessIcon className="h-8 w-8 text-primary mb-2" />
                  <AndamioText className="font-medium">All caught up!</AndamioText>
                  <AndamioText variant="small" className="text-muted-foreground mt-1 text-center">
                    {commitments.length === 0
                      ? "No task submissions to review"
                      : "No submissions match your search"}
                  </AndamioText>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredCommitments.map((commitment) => {
                    const isSelected =
                      selectedCommitment?.taskHash === commitment.taskHash &&
                      selectedCommitment?.submittedBy === commitment.submittedBy;
                    const reward = getRewardAda(commitment);

                    return (
                      <div
                        key={`${commitment.taskHash}-${commitment.submittedBy}`}
                        className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${isSelected
                          ? "bg-muted border-l-2 border-l-primary"
                          : "border-l-2 border-l-transparent hover:bg-muted/50"
                          }`}
                        onClick={() => handleSelect(commitment)}
                      >
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <AndamioText className="font-mono text-xs truncate">
                              {commitment.submittedBy}
                            </AndamioText>
                            {!!commitment.evidence && (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"
                                title="Has evidence"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <AndamioText variant="small" className="text-muted-foreground truncate">
                              {taskTitleMap.get(commitment.taskHash) ?? `${commitment.taskHash.slice(0, 8)}...`}
                            </AndamioText>
                            {reward && (
                              <AndamioText variant="small" className="text-muted-foreground">
                                {reward} ADA
                              </AndamioText>
                            )}
                            <AndamioBadge
                              variant={getStatusVariant(commitment.commitmentStatus)}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {formatCommitmentStatus(commitment.commitmentStatus ?? "")}
                            </AndamioBadge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </AndamioScrollArea>

            {/* Back button at bottom */}
            <div className="border-t px-4 py-3">
              <AndamioBackButton
                href={`/studio/project/${projectId}`}
                label="Back to Project"
              />
            </div>
          </div>
        </AndamioResizablePanel>

        <AndamioResizableHandle withHandle />

        {/* ================================================================= */}
        {/* RIGHT PANEL — Detail + Assessment                                 */}
        {/* ================================================================= */}
        <AndamioResizablePanel defaultSize={60}>
          <AndamioScrollArea className="h-full">
            {selectedCommitment ? (
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AndamioHeading level={3} size="lg" className="font-mono">
                        {selectedCommitment.submittedBy}
                      </AndamioHeading>
                      <AndamioBadge variant={getStatusVariant(selectedCommitment.commitmentStatus)}>
                        {formatCommitmentStatus(selectedCommitment.commitmentStatus ?? "")}
                      </AndamioBadge>
                    </div>
                    <AndamioText variant="small" className="text-muted-foreground">
                      Task: {taskTitleMap.get(selectedCommitment.taskHash) ?? selectedCommitment.taskHash.slice(0, 16) + "..."}
                    </AndamioText>
                    {getManagerStatusHint(selectedCommitment.commitmentStatus) && (
                      <AndamioText variant="small" className="text-muted-foreground">
                        {getManagerStatusHint(selectedCommitment.commitmentStatus)}
                      </AndamioText>
                    )}
                  </div>
                  <AndamioButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCommitment(null)}
                  >
                    <CloseIcon className="h-4 w-4" />
                  </AndamioButton>
                </div>

                {/* Task context */}
                {selectedCommitment.task && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedCommitment.task.lovelaceAmount != null && (
                      <div>
                        <AndamioLabel>Reward</AndamioLabel>
                        <AndamioText variant="small" className="mt-1 font-medium text-foreground">
                          {(selectedCommitment.task.lovelaceAmount / 1_000_000).toFixed(0)} ADA
                        </AndamioText>
                      </div>
                    )}
                    {selectedCommitment.task.expirationPosix && (
                      <div>
                        <AndamioLabel>Expiration</AndamioLabel>
                        <AndamioText variant="small" className="mt-1 text-foreground">
                          {new Date(selectedCommitment.task.expirationPosix * 1000).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </AndamioText>
                      </div>
                    )}
                  </div>
                )}

                {/* Submission TX */}
                {selectedCommitment.submissionTx && (
                  <div>
                    <AndamioLabel>Submission TX</AndamioLabel>
                    <AndamioText variant="small" className="font-mono mt-1 text-muted-foreground">
                      {selectedCommitment.submissionTx.slice(0, 24)}...
                    </AndamioText>
                  </div>
                )}

                {/* Evidence Section */}
                <div className="space-y-2">
                  <AndamioLabel>Submitted Evidence</AndamioLabel>
                  {selectedCommitment.evidence ? (
                    <div className="border rounded-md">
                      <ContentDisplay
                        content={selectedCommitment.evidence as JSONContent}
                        variant="muted"
                      />
                    </div>
                  ) : selectedCommitment.onChainContent ? (
                    <div className="py-4 px-3 border rounded-md bg-muted/20">
                      <AndamioText variant="small" className="font-mono break-all">
                        {selectedCommitment.onChainContent}
                      </AndamioText>
                      <AndamioText variant="small" className="text-muted-foreground italic mt-2">
                        On-chain evidence hash. Database record not available.
                      </AndamioText>
                    </div>
                  ) : (
                    <div className="py-4 px-3 border rounded-md bg-muted/20">
                      <AndamioText variant="small" className="text-muted-foreground italic">
                        No evidence submitted yet.
                      </AndamioText>
                    </div>
                  )}
                  {selectedCommitment.taskEvidenceHash && (
                    <AndamioText variant="small" className="text-muted-foreground font-mono text-xs">
                      Hash: {selectedCommitment.taskEvidenceHash.slice(0, 24)}...
                    </AndamioText>
                  )}
                </div>

                {/* Assessment Actions */}
                {confirmationState === "confirmed" && txResult ? (
                  // Success state
                  <div className="space-y-4">
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                      <div className="flex items-center gap-3">
                        <SuccessIcon className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <AndamioText className="font-medium text-primary">
                            Commitment Recorded
                          </AndamioText>
                          <AndamioText variant="small" className="text-xs text-muted-foreground">
                            {txResult.contributor}&apos;s commitment{" "}
                            {txResult.outcome === "accept"
                              ? "accepted"
                              : txResult.outcome === "refuse"
                                ? "refused"
                                : "denied"}
                          </AndamioText>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <AndamioButton variant="outline" size="sm" onClick={resetAssessment}>
                        Done
                      </AndamioButton>
                      {findNextPending(selectedCommitment) && (
                        <AndamioButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const next = findNextPending(selectedCommitment);
                            if (next) {
                              resetAssessment();
                              setSelectedCommitment(next);
                            }
                          }}
                        >
                          Next pending
                          <NextIcon className="h-4 w-4 ml-1" />
                        </AndamioButton>
                      )}
                    </div>
                  </div>
                ) : confirmationState === "confirming" ? (
                  // Confirming on chain
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
                      <div className="flex-1">
                        <AndamioText className="font-medium">Confirming on blockchain...</AndamioText>
                        <AndamioText variant="small" className="text-xs text-muted-foreground">
                          Waiting for block confirmation and database update
                        </AndamioText>
                      </div>
                    </div>
                    {txResult && (
                      <TxStreamWatcher
                        txHash={txResult.txHash}
                        onConfirmed={handleTxConfirmed}
                        onFailed={handleTxFailed}
                      />
                    )}
                  </div>
                ) : confirmationState === "failed" ? (
                  // Confirmation failed
                  <div className="space-y-3">
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                      <div className="flex items-center gap-3">
                        <AlertIcon className="h-5 w-5 text-destructive" />
                        <AndamioText className="font-medium text-destructive">
                          Confirmation failed
                        </AndamioText>
                      </div>
                    </div>
                    <AndamioButton variant="outline" size="sm" onClick={resetAssessment}>
                      Try Again
                    </AndamioButton>
                  </div>
                ) : selectedCommitment.commitmentStatus === "SUBMITTED" ? (
                  // Decision buttons
                  <div className="sticky bottom-0 bg-background border-t pt-4 pb-2 -mx-6 px-6 space-y-3">
                    {/* Irreversibility warning */}
                    <div className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/10 p-3">
                      <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <AndamioText variant="small" className="text-xs text-muted-foreground">
                        Decisions are recorded on-chain and cannot be undone.
                      </AndamioText>
                    </div>

                    {/* Pending decision indicator */}
                    {pendingDecision?.commitment.taskHash === selectedCommitment.taskHash &&
                      pendingDecision?.commitment.submittedBy === selectedCommitment.submittedBy && (
                        <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                          <div className="flex items-center gap-2">
                            <AndamioText variant="small" className="text-muted-foreground">
                              Decision:
                            </AndamioText>
                            <AndamioBadge
                              variant={
                                pendingDecision.outcome === "accept"
                                  ? "default"
                                  : pendingDecision.outcome === "refuse"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {pendingDecision.outcome.charAt(0).toUpperCase() +
                                pendingDecision.outcome.slice(1)}
                            </AndamioBadge>
                          </div>
                          <AndamioButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingDecision(null)}
                            disabled={txSubmitting}
                          >
                            Clear
                          </AndamioButton>
                        </div>
                      )}

                    {/* Decision buttons or submit */}
                    {pendingDecision?.commitment.taskHash === selectedCommitment.taskHash &&
                      pendingDecision?.commitment.submittedBy === selectedCommitment.submittedBy ? (
                      <TransactionButton
                        txState={assessTx.state}
                        onClick={handleSubmitAssessment}
                        disabled={txSubmitting}
                        stateText={{
                          idle: `Confirm ${pendingDecision.outcome.charAt(0).toUpperCase() + pendingDecision.outcome.slice(1)}`,
                          fetching: "Preparing...",
                          signing: "Sign in Wallet",
                          submitting: "Submitting...",
                        }}
                        className="w-full"
                      />
                    ) : (
                      <div className="grid gap-2">
                        <AndamioButton
                          variant="default"
                          className="w-full justify-start h-auto py-2.5 px-3"
                          onClick={() => handleDecision(selectedCommitment, "accept")}
                        >
                          <SuccessIcon className="h-4 w-4 mr-2 shrink-0" />
                          <div className="text-left">
                            <div className="font-medium">Accept</div>
                            <div className="text-xs font-normal opacity-80">Approve this work. The contributor will receive their reward.</div>
                          </div>
                        </AndamioButton>
                        <AndamioButton
                          variant="outline"
                          className="w-full justify-start h-auto py-2.5 px-3"
                          onClick={() => handleDecision(selectedCommitment, "refuse")}
                        >
                          <ErrorIcon className="h-4 w-4 mr-2 shrink-0" />
                          <div className="text-left">
                            <div className="font-medium">Refuse</div>
                            <div className="text-xs font-normal opacity-80">Send back for revision. The contributor can resubmit.</div>
                          </div>
                        </AndamioButton>
                        <AndamioTooltipProvider>
                          <AndamioTooltip>
                            <AndamioTooltipTrigger asChild>
                              <span className="w-full">
                                <AndamioButton
                                  variant="destructive"
                                  className="w-full justify-start h-auto py-2.5 px-3"
                                  onClick={() => handleDecision(selectedCommitment, "deny")}
                                  disabled={!!(selectedCommitment.task?.expirationPosix && Date.now() < selectedCommitment.task.expirationPosix * 1000)}
                                >
                                  <BlockIcon className="h-4 w-4 mr-2 shrink-0" />
                                  <div className="text-left">
                                    <div className="font-medium">Deny</div>
                                    <div className="text-xs font-normal opacity-80">
                                      {selectedCommitment.task?.expirationPosix && Date.now() < selectedCommitment.task.expirationPosix * 1000
                                        ? `Available after ${new Date(selectedCommitment.task.expirationPosix * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                                        : "Permanently reject. The contributor\u2019s deposit is returned."}
                                    </div>
                                  </div>
                                </AndamioButton>
                              </span>
                            </AndamioTooltipTrigger>
                            {!!(selectedCommitment.task?.expirationPosix && Date.now() < selectedCommitment.task.expirationPosix * 1000) && (
                              <AndamioTooltipContent>
                                Deny is available after the task expiration date passes
                              </AndamioTooltipContent>
                            )}
                          </AndamioTooltip>
                        </AndamioTooltipProvider>
                      </div>
                    )}

                    {/* TX error display */}
                    {assessTx.error && (
                      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                        <AndamioText variant="small" className="text-destructive">
                          {assessTx.error.message}
                        </AndamioText>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              /* Empty state */
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <ManagerIcon className="h-12 w-12 text-muted-foreground/50" />
                <div>
                  <AndamioText className="font-medium">Select a submission to review</AndamioText>
                  <AndamioText variant="small" className="text-muted-foreground mt-1">
                    Click on a contributor in the list to view their evidence and make an assessment decision.
                  </AndamioText>
                </div>
              </div>
            )}
          </AndamioScrollArea>
        </AndamioResizablePanel>
      </AndamioResizablePanelGroup>
    </div>
  );
}
