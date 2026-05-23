/**
 * TaskAction Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for contributors to perform actions on their current task (update submission, etc).
 * Uses PROJECT_CONTRIBUTOR_TASK_ACTION transaction with gateway auto-confirmation.
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-stream.ts
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
import { AndamioText } from "~/components/andamio/andamio-text";
import { TaskIcon, TransactionIcon, AlertIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";
import type { JSONContent } from "@tiptap/core";

export interface TaskActionProps {
  /**
   * Project NFT Policy ID
   */
  projectNftPolicyId: string;

  /**
   * Contributor state ID (56 char hex)
   */
  contributorStateId: string;

  /**
   * Task hash (64 char hex)
   */
  taskHash: string;

  /**
   * Task code for display
   */
  taskCode: string;

  /**
   * Task title for display
   */
  taskTitle?: string;

  /**
   * Optional project info to include
   */
  projectInfo?: string;

  /**
   * Updated task evidence content (Tiptap JSON)
   */
  taskEvidence?: JSONContent;

  /**
   * Callback fired when action is successful
   * @param result - Transaction result including txHash
   */
  onSuccess?: (result: { txHash: string }) => void | Promise<void>;
}

/**
 * TaskAction - Contributor UI for task actions (V2)
 *
 * Use cases:
 * - Updating task submission evidence
 * - Performing task state transitions
 *
 * @example
 * ```tsx
 * <TaskAction
 *   projectNftPolicyId="abc123..."
 *   taskHash="def456..."
 *   taskCode="TASK_001"
 *   taskTitle="Create Documentation"
 *   taskEvidence={updatedContent}
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 */
export function TaskAction({
  projectNftPolicyId,
  contributorStateId,
  taskHash,
  taskCode,
  taskTitle,
  projectInfo,
  taskEvidence,
  onSuccess,
}: TaskActionProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        const isStalled = status.state === "confirmed" && !!status.last_error;

        if (status.state === "updated" || isStalled) {
          console.log("[TaskAction] TX confirmed:", status.state, isStalled ? "(stalled)" : "");

          toast.success("Task Action Completed!", {
            description: isStalled
              ? `Confirmed on-chain. Gateway sync pending — your data will update shortly.`
              : `Action on ${taskTitle ?? taskCode} recorded successfully`,
          });

          if (result?.txHash) {
            void onSuccess?.({ txHash: result.txHash });
          }
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Action Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  // Compute evidence hash for display if evidence provided
  const computedHash = useMemo(() => {
    if (!taskEvidence || Object.keys(taskEvidence).length === 0) return null;
    try {
      return computeAssignmentInfoHash(taskEvidence);
    } catch {
      return null;
    }
  }, [taskEvidence]);

  const ui = TRANSACTION_UI.PROJECT_CONTRIBUTOR_TASK_ACTION;

  const handleAction = async () => {
    if (!user?.accessTokenAlias) {
      return;
    }

    // Use pre-computed evidence hash as project_info (on-chain evidence hash).
    // Falls back to explicit projectInfo prop if no evidence provided.
    const projectInfoValue = computedHash ?? projectInfo;

    await execute({
      txType: "PROJECT_CONTRIBUTOR_TASK_ACTION",
      params: {
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        project_info: projectInfoValue ?? "",
      },
      metadata: computedHash
        ? {
            task_hash: taskHash,
            evidence: JSON.stringify(taskEvidence),
            evidence_hash: computedHash,
          }
        : undefined,
      onSuccess: async (txResult) => {
        console.log("[TaskAction] TX submitted:", txResult.txHash);
      },
      onError: (txError) => {
        console.error("[TaskAction] Error:", txError);
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <TaskIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>
              Update your submission for {taskTitle ?? taskCode}
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Task Info */}
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="secondary" className="text-xs">
            {taskTitle ?? taskCode}
          </AndamioBadge>
        </div>

        {/* What Happens */}
        <div className="rounded-sm border bg-muted/30 p-4 space-y-2">
          <AndamioText className="font-medium">What happens:</AndamioText>
          <AndamioText variant="small" className="text-xs">
            Your task action is recorded on-chain. This may include updating your submission evidence or transitioning task state.
          </AndamioText>
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
            Task actions are recorded on-chain. Ensure your submission is ready before continuing.
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
                  Task Action Completed!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {computedHash
                    ? `Recorded with hash ${computedHash.slice(0, 16)}...`
                    : "Your action has been recorded on-chain"}
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {state !== "success" && !txConfirmed && (
          <TransactionButton
            txState={state}
            onClick={handleAction}
            disabled={!hasAccessToken}
            stateText={{
              idle: ui.buttonText,
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Recording on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
