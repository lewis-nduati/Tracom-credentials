/**
 * TaskCommit Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * Unified UI for all task commitments. The COMMIT transaction handles:
 * 1. Enrolling the contributor (if not already enrolled)
 * 2. Claiming rewards from previous approved task (if any)
 * 3. Committing to a new task
 *
 * Uses PROJECT_CONTRIBUTOR_TASK_COMMIT transaction with gateway auto-confirmation.
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-stream.ts
 * @see .claude/skills/project-manager/CONTRIBUTOR-TRANSACTION-MODEL.md
 */

"use client";

import React, { useMemo } from "react";
import { computeAssignmentInfoHash } from "@andamio/core/hashing";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { parseTxErrorMessage } from "~/lib/tx-error-messages";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { TaskIcon, TransactionIcon, AlertIcon, SuccessIcon, ContributorIcon, LoadingIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";
import type { JSONContent } from "@tiptap/core";

export interface TaskCommitProps {
  /**
   * Project NFT Policy ID
   */
  projectNftPolicyId: string;

  /**
   * Contributor state ID (56 char hex) - used for top-level API param
   */
  contributorStateId: string;

  /**
   * Project title for display
   */
  projectTitle?: string;

  /**
   * Task hash to commit to (64 char hex)
   */
  taskHash: string;

  /**
   * Task code for side effects
   */
  taskCode: string;

  /**
   * Task title for display
   */
  taskTitle?: string;

  /**
   * Task evidence content (Tiptap JSON)
   * May be null if user hasn't entered evidence yet
   */
  taskEvidence: JSONContent | null;

  /**
   * Is this the contributor's first commit (enrollment)?
   * Changes messaging to emphasize enrollment aspect.
   */
  isFirstCommit?: boolean;

  /**
   * Will this commit also claim rewards from a previous approved task?
   * Shows reward claiming info in the UI.
   */
  willClaimRewards?: boolean;

  /**
   * Task hash of the contributor's previous ACCEPTED commitment in this project.
   * Sent as `previous_task_hash` in TX registration metadata so the gateway can
   * transition the previous commitment from ACCEPTED to REWARDED.
   */
  previousAcceptedTaskHash?: string;

  /**
   * Task status from API - used for defensive validation.
   * If provided and not "ON_CHAIN", the component will not allow commits.
   */
  taskStatus?: "DRAFT" | "PENDING_TX" | "ON_CHAIN";

  /**
   * Callback fired when commitment is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * TaskCommit - Unified contributor UI for all task commits (V2)
 *
 * This single component handles:
 * - First-time enrollment (isFirstCommit=true)
 * - Subsequent task commitments
 * - Committing while claiming rewards (willClaimRewards=true)
 *
 * @example
 * ```tsx
 * // First commit (enrollment)
 * <TaskCommit
 *   projectNftPolicyId="abc123..."
 *   contributorStateId="def456..."
 *   taskHash="ghi789..."
 *   taskEvidence={editorContent}
 *   isFirstCommit={true}
 *   onSuccess={() => router.refresh()}
 * />
 *
 * // Subsequent commit with rewards
 * <TaskCommit
 *   projectNftPolicyId="abc123..."
 *   taskHash="ghi789..."
 *   taskEvidence={editorContent}
 *   willClaimRewards={true}
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 */
export function TaskCommit({
  projectNftPolicyId,
  contributorStateId,
  projectTitle,
  taskHash,
  taskCode,
  taskTitle,
  taskEvidence,
  isFirstCommit = false,
  willClaimRewards = false,
  previousAcceptedTaskHash,
  taskStatus,
  onSuccess,
}: TaskCommitProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        const isStalled = status.state === "confirmed" && !!status.last_error;

        if (status.state === "updated" || isStalled) {
          let successTitle: string;
          let successDescription: string;

          if (isStalled) {
            successTitle = "Confirmed On-Chain!";
            successDescription = "Confirmed on-chain. Gateway sync pending — your data will update shortly.";
          } else if (isFirstCommit) {
            successTitle = "Welcome to the Project!";
            successDescription = `You've joined ${projectTitle ?? "this project"}`;
          } else if (willClaimRewards) {
            successTitle = "Committed & Rewards Claimed!";
            successDescription = `You've committed to ${taskTitle ?? taskCode} and claimed your rewards`;
          } else {
            successTitle = "Task Commitment Recorded!";
            successDescription = `You've committed to ${taskTitle ?? taskCode}`;
          }

          toast.success(successTitle, { description: successDescription });
          void onSuccess?.();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Commitment Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  // Compute evidence hash for display
  const computedHash = useMemo(() => {
    if (!taskEvidence || Object.keys(taskEvidence).length === 0) return null;
    try {
      return computeAssignmentInfoHash(taskEvidence);
    } catch {
      return null;
    }
  }, [taskEvidence]);

  const ui = TRANSACTION_UI.PROJECT_CONTRIBUTOR_TASK_COMMIT;
  const showAction = state !== "success" && !txConfirmed;

  const handleCommit = async () => {
    if (!user?.accessTokenAlias) return;

    if (!computedHash) {
      toast.error("Task evidence is required");
      return;
    }

    if (taskHash.length !== 64) {
      toast.error("Invalid task - please select a valid task");
      return;
    }

    await execute({
      txType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
      params: {
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        contributor_state_id: contributorStateId,
        task_hash: taskHash,
        task_info: computedHash,
      },
      metadata: {
        task_hash: taskHash,
        evidence: JSON.stringify(taskEvidence),
        evidence_hash: computedHash,
        ...(previousAcceptedTaskHash && { previous_task_hash: previousAcceptedTaskHash }),
      },
      recoveryContext: {
        kind: "project_contributor",
        projectId: projectNftPolicyId,
        taskHash,
      },
      onSuccess: async (txResult) => {
        console.log("[TaskCommit] TX submitted:", txResult.txHash);
      },
      onError: (txError) => {
        console.error("[TaskCommit] Error:", txError);
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const hasEvidence = taskEvidence && Object.keys(taskEvidence).length > 0;
  const hasValidTaskHash = taskHash.length === 64;
  const isTaskPublished = taskStatus === undefined || taskStatus === "ON_CHAIN";
  const canCommit = hasAccessToken && hasEvidence && hasValidTaskHash && isTaskPublished;

  // Dynamic title, description, and button text based on context
  const cardTitle = isFirstCommit ? "Join & Commit" : ui.title;

  let cardDescription: string;
  let buttonText: string;

  let successTitle: string;
  let successSubtitle: string;

  if (isFirstCommit) {
    cardDescription = projectTitle
      ? `Join ${projectTitle} and commit to your first task`
      : "Join this project and commit to your first task";
    buttonText = "Join & Commit";
    successTitle = "Welcome to the Project!";
    successSubtitle = `You've joined ${projectTitle ?? "this project"}`;
  } else if (willClaimRewards) {
    cardDescription = "Continue contributing and claim your rewards";
    buttonText = "Commit & Claim Rewards";
    successTitle = "Committed & Rewards Claimed!";
    successSubtitle = `Committed to ${taskTitle ?? taskCode} and claimed rewards`;
  } else {
    cardDescription = projectTitle
      ? `Take on a new task in ${projectTitle}`
      : "Commit to your next task";
    buttonText = ui.buttonText;
    successTitle = "Task Commitment Recorded!";
    successSubtitle = `You've committed to ${taskTitle ?? taskCode}`;
  }

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            {isFirstCommit ? (
              <ContributorIcon className="h-5 w-5 text-primary" />
            ) : (
              <TaskIcon className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{cardTitle}</AndamioCardTitle>
            <AndamioCardDescription>{cardDescription}</AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Task Info */}
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="secondary" className="text-xs">
            <TaskIcon className="h-3 w-3 mr-1" />
            {taskTitle ?? taskCode}
          </AndamioBadge>
          {willClaimRewards && (
            <AndamioBadge variant="default" className="text-xs bg-primary text-primary-foreground">
              <SuccessIcon className="h-3 w-3 mr-1" />
              + Claim Rewards
            </AndamioBadge>
          )}
        </div>

        {/* What Happens */}
        <div className="rounded-sm border bg-muted/30 p-4 space-y-2">
          <AndamioText className="font-medium">What happens:</AndamioText>
          {isFirstCommit ? (
            <AndamioText variant="small" className="text-xs">
              A contributor state token is minted to your wallet, adding you to the project.
              Your task commitment is recorded on-chain.
            </AndamioText>
          ) : willClaimRewards ? (
            <AndamioText variant="small" className="text-xs">
              Your rewards from the previous approved task are claimed, and your new task
              commitment is recorded on-chain.
            </AndamioText>
          ) : (
            <AndamioText variant="small" className="text-xs">
              Your task commitment is recorded on-chain. Complete your task and submit for review.
            </AndamioText>
          )}
          {computedHash && (
            <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
              <TransactionIcon className="h-3 w-3 shrink-0" />
              <code className="font-mono text-primary">{computedHash.slice(0, 24)}...</code>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/10 p-3">
          <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
          <AndamioText variant="small" className="text-xs text-muted-foreground">
            {isFirstCommit
              ? "This transaction adds you as a project contributor. Make sure your submission is ready."
              : "Task commitments are recorded on-chain. Ensure your submission is ready before committing."}
          </AndamioText>
        </div>

        {/* Transaction Status - Only show during processing, not when showing gateway confirmation */}
        {state !== "idle" && !txConfirmed && !(state === "success" && result?.requiresDBUpdate) && (
          <TransactionStatus
            state={state}
            result={result}
            error={parseTxErrorMessage(error?.message)}
            onRetry={() => reset()}
            messages={{
              success: "Transaction submitted! Waiting for confirmation...",
            }}
          />
        )}

        {/* Gateway Confirmation Status */}
        {state === "success" && result?.requiresDBUpdate && !txConfirmed && !txFailed && (
          <div className="rounded-sm border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
              <div className="flex-1">
                <AndamioText className="font-medium">Confirming on blockchain...</AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {txStatus?.state === "pending" && "Waiting for block confirmation"}
                  {txStatus?.state === "confirmed" && "Processing database updates"}
                  {!txStatus && "Registering transaction..."}
                </AndamioText>
                <AndamioText variant="small" className="text-xs text-muted-foreground">
                  This usually takes 20–60 seconds.
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {txConfirmed && (
          <div className="rounded-sm border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <SuccessIcon className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <AndamioText className="font-medium text-primary">
                  {successTitle}
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {successSubtitle}
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Invalid Task Warning */}
        {(!hasValidTaskHash || !isTaskPublished) && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
            <AndamioText variant="small" className="text-xs text-destructive">
              {!hasValidTaskHash
                ? "Invalid task hash. Tasks must have a valid 64-character hash."
                : "This task is not yet published on-chain. Tasks must be published before contributors can commit."}
            </AndamioText>
          </div>
        )}

        {/* Commission Notice */}
        {willClaimRewards && showAction && (
          <AndamioText variant="small" className="text-xs text-muted-foreground">
            A small commission is deducted from task rewards to support the Andamio platform.
          </AndamioText>
        )}

        {/* Commit Button — idle state shows confirmation dialog */}
        {showAction && state === "idle" && (
          <AndamioConfirmDialog
            trigger={
              <AndamioButton className="w-full" disabled={!canCommit}>
                {buttonText}
              </AndamioButton>
            }
            title={isFirstCommit ? "Join This Project?" : "Submit Your Work?"}
            description={
              isFirstCommit
                ? "This enrolls you in the project and records your commitment on-chain. This action cannot be undone."
                : "This records your work submission on-chain. Your project manager will review it."
            }
            confirmText={buttonText}
            onConfirm={handleCommit}
          />
        )}
        {showAction && state !== "idle" && (
          <TransactionButton
            txState={state}
            onClick={handleCommit}
            disabled={!canCommit}
            stateText={{
              idle: buttonText,
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: isFirstCommit ? "Joining..." : "Recording on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
