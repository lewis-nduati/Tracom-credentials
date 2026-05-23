/**
 * TasksAssess Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for project managers to assess (accept/refuse/deny) contributor task submissions.
 * Uses PROJECT_MANAGER_TASKS_ASSESS transaction with gateway auto-confirmation.
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-stream.ts
 */

"use client";

import React, { useState } from "react";
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
import { AssessIcon, SuccessIcon, ErrorIcon, AlertIcon, BlockIcon, LoadingIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

type AssessmentOutcome = "accept" | "refuse" | "deny";

export interface TasksAssessProps {
  /**
   * Project NFT Policy ID
   */
  projectNftPolicyId: string;

  /**
   * Contributor state ID (required for task assessment)
   */
  contributorStateId: string;

  /**
   * Contributor's access token alias
   */
  contributorAlias: string;

  /**
   * Task hash being assessed (64 char hex)
   */
  taskHash: string;

  /**
   * Task title for display (optional)
   */
  taskTitle?: string;

  /**
   * Callback fired when assessment is successful
   */
  onSuccess?: (result: AssessmentOutcome) => void | Promise<void>;
}

/**
 * TasksAssess - Manager UI for assessing contributor task submissions (V2)
 *
 * Assessment outcomes:
 * - **Accept**: Contributor receives the task reward, task is marked complete
 * - **Refuse**: Task is rejected but contributor can resubmit
 * - **Deny**: Task is permanently rejected, contributor's deposit is returned
 *
 * @example
 * ```tsx
 * <TasksAssess
 *   projectNftPolicyId="abc123..."
 *   contributorStateId="def456..."
 *   contributorAlias="alice"
 *   taskHash="ghi789..."
 *   onSuccess={(result) => refetchSubmissions()}
 * />
 * ```
 */
export function TasksAssess({
  projectNftPolicyId,
  contributorStateId,
  contributorAlias,
  taskHash: _taskHash,
  taskTitle: _taskTitle,
  onSuccess,
}: TasksAssessProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  const [assessmentResult, setAssessmentResult] = useState<AssessmentOutcome | null>(null);

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        // "updated" means Gateway has confirmed TX AND updated DB
        if (status.state === "updated") {
          console.log("[TasksAssess] TX confirmed and DB updated by gateway");

          const actionText =
            assessmentResult === "accept"
              ? "accepted"
              : assessmentResult === "refuse"
                ? "refused"
                : "denied";

          toast.success(`Commitment ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}!`, {
            description: `${contributorAlias}'s commitment has been ${actionText}`,
          });

          if (assessmentResult) {
            void onSuccess?.(assessmentResult);
          }
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Assessment Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  const ui = TRANSACTION_UI.PROJECT_MANAGER_TASKS_ASSESS;

  const handleAssess = async (decision: AssessmentOutcome) => {
    if (!user?.accessTokenAlias) {
      return;
    }

    setAssessmentResult(decision);

    await execute({
      txType: "PROJECT_MANAGER_TASKS_ASSESS",
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        contributor_state_id: contributorStateId,
        task_decisions: [
          { alias: contributorAlias, outcome: decision },
        ],
      },
      onSuccess: async (txResult) => {
        console.log("[TasksAssess] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[TasksAssess] Error:", txError);
        setAssessmentResult(null);
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
            <AssessIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>
              Review and assess {contributorAlias}&apos;s task submission
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Task Info */}
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="outline" className="text-xs font-mono">
            Contributor: {contributorAlias}
          </AndamioBadge>
        </div>

        {/* Assessment Outcomes Explanation */}
        <div className="space-y-2 rounded-sm border bg-muted/30 p-3">
          <AndamioText variant="small" className="font-medium">Decision Options:</AndamioText>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <SuccessIcon className="h-3 w-3 text-primary" />
              <span><strong>Accept</strong>: Approve and release reward</span>
            </div>
            <div className="flex items-center gap-2">
              <ErrorIcon className="h-3 w-3 text-muted-foreground" />
              <span><strong>Refuse</strong>: Reject, allow resubmission</span>
            </div>
            <div className="flex items-center gap-2">
              <BlockIcon className="h-3 w-3 text-destructive" />
              <span><strong>Deny</strong>: Permanently reject, deposit is returned</span>
            </div>
          </div>
        </div>

        {/* Warning about irreversibility */}
        <div className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/10 p-3">
          <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
          <AndamioText variant="small" className="text-xs text-muted-foreground">
            Decisions are recorded on-chain and cannot be undone.
          </AndamioText>
        </div>

        {/* Transaction Status - Only show during processing, not when showing gateway confirmation */}
        {state !== "idle" && !txConfirmed && !(state === "success" && result?.requiresDBUpdate) && (
          <TransactionStatus
            state={state}
            result={result}
            error={parseTxErrorMessage(error?.message)}
            onRetry={() => {
              setAssessmentResult(null);
              reset();
            }}
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
                  Commitment Recorded!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {assessmentResult === "accept"
                    ? `${contributorAlias}'s commitment accepted`
                    : assessmentResult === "refuse"
                      ? `${contributorAlias}'s commitment refused`
                      : `${contributorAlias}'s commitment denied`}
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Buttons */}
        {state === "idle" && hasAccessToken && !txConfirmed && (
          <div className="flex gap-2">
            <AndamioButton
              variant="default"
              className="flex-1"
              onClick={() => handleAssess("accept")}
            >
              <SuccessIcon className="h-4 w-4 mr-2" />
              Accept
            </AndamioButton>
            <AndamioButton
              variant="outline"
              className="flex-1"
              onClick={() => handleAssess("refuse")}
            >
              <ErrorIcon className="h-4 w-4 mr-2" />
              Refuse
            </AndamioButton>
            <AndamioButton
              variant="destructive"
              className="flex-1"
              onClick={() => handleAssess("deny")}
            >
              <BlockIcon className="h-4 w-4 mr-2" />
              Deny
            </AndamioButton>
          </div>
        )}

        {/* In-progress state */}
        {state !== "idle" && state !== "success" && state !== "error" && !txConfirmed && (
          <TransactionButton
            txState={state}
            onClick={() => undefined}
            disabled
            stateText={{
              idle:
                assessmentResult === "accept"
                  ? "Accept"
                  : assessmentResult === "refuse"
                    ? "Refuse"
                    : "Deny",
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
