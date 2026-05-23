/**
 * AssessAssignment Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for teachers to assess (accept/refuse) student assignment submissions.
 * Uses COURSE_TEACHER_ASSIGNMENTS_ASSESS transaction with gateway auto-confirmation.
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
import { SuccessIcon, ErrorIcon, AssessIcon, AlertIcon, LoadingIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

export interface AssessAssignmentProps {
  /**
   * Course NFT Policy ID
   */
  courseId: string;

  /**
   * Student's access token alias
   */
  studentAlias: string;

  /**
   * Module code for the assignment
   */
  moduleCode: string;

  /**
   * Module title for display
   */
  moduleTitle?: string;

  /**
   * Callback fired when assessment is successful
   */
  onSuccess?: (result: "accept" | "refuse") => void | Promise<void>;
}

/**
 * AssessAssignment - Teacher UI for accepting/refusing student submissions (V2)
 *
 * @example
 * ```tsx
 * <AssessAssignment
 *   courseId="abc123..."
 *   studentAlias="alice"
 *   moduleCode="MODULE_1"
 *   onSuccess={(result) => refetchCommitments()}
 * />
 * ```
 */
export function AssessAssignment({
  courseId,
  studentAlias,
  moduleCode,
  moduleTitle,
  onSuccess,
}: AssessAssignmentProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  const [assessmentResult, setAssessmentResult] = useState<"accept" | "refuse" | null>(null);

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        // "updated" means Gateway has confirmed TX AND updated DB
        if (status.state === "updated") {
          console.log("[AssessAssignment] TX confirmed and DB updated by gateway");

          const actionText = assessmentResult === "accept" ? "accepted" : "refused";
          toast.success("Assessment Submitted!", {
            description: `${studentAlias}'s assignment has been ${actionText}`,
          });

          void onSuccess?.(assessmentResult!);
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Assessment Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  const ui = TRANSACTION_UI.COURSE_TEACHER_ASSIGNMENTS_ASSESS;

  const handleAssess = async (decision: "accept" | "refuse") => {
    if (!user?.accessTokenAlias) {
      return;
    }

    setAssessmentResult(decision);

    await execute({
      txType: "COURSE_TEACHER_ASSIGNMENTS_ASSESS",
      params: {
        alias: user.accessTokenAlias,
        course_id: courseId,
        assignment_decisions: [
          { alias: studentAlias, outcome: decision },
        ],
      },
      onSuccess: async (txResult) => {
        console.log("[AssessAssignment] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[AssessAssignment] Error:", txError);
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
              Review and assess {studentAlias}&apos;s assignment
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Assignment Info */}
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="outline" className="text-xs font-mono">
            Student: {studentAlias}
          </AndamioBadge>
          <AndamioBadge variant="secondary" className="text-xs">
            {moduleTitle ?? moduleCode}
          </AndamioBadge>
        </div>

        {/* Warning about irreversibility */}
        <div className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/10 p-3">
          <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
          <AndamioText variant="small" className="text-xs text-muted-foreground">
            Assessment decisions are recorded on-chain and cannot be undone.
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
                  Assessment Recorded!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {studentAlias}&apos;s submission has been {assessmentResult === "accept" ? "accepted" : "refused"}.
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Buttons */}
        {state === "idle" && hasAccessToken && (
          <div className="flex gap-3">
            <AndamioButton
              variant="default"
              className="flex-1"
              onClick={() => handleAssess("accept")}
            >
              <SuccessIcon className="h-4 w-4 mr-2" />
              Accept
            </AndamioButton>
            <AndamioButton
              variant="destructive"
              className="flex-1"
              onClick={() => handleAssess("refuse")}
            >
              <ErrorIcon className="h-4 w-4 mr-2" />
              Refuse
            </AndamioButton>
          </div>
        )}

        {/* In-progress state */}
        {state !== "idle" && state !== "success" && state !== "error" && (
          <TransactionButton
            txState={state}
            onClick={() => undefined}
            disabled
            stateText={{
              idle: assessmentResult === "accept" ? "Accept" : "Refuse",
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
