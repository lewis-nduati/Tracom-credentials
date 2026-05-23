/**
 * AssignmentUpdate Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * Elegant UI for students to submit or update assignment evidence.
 * Supports two modes: updating existing submission or committing to a new module.
 *
 * Uses:
 * - COURSE_STUDENT_ASSIGNMENT_UPDATE for updating existing submissions
 * - COURSE_STUDENT_ASSIGNMENT_COMMIT for committing to a new module
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-stream.ts
 */

"use client";

import React, { useState, useMemo } from "react";
import { computeAssignmentInfoHash } from "@andamio/core/hashing";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { useSubmitEvidence } from "~/hooks/api/course/use-assignment-commitment";
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
import { SendIcon, EditIcon, ShieldIcon, TransactionIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";
import type { JSONContent } from "@tiptap/core";

export interface AssignmentUpdateProps {
  /**
   * Course NFT Policy ID
   */
  courseId: string;

  /**
   * Target module code
   */
  moduleCode: string;

  /**
   * Module title for display
   */
  moduleTitle?: string;

  /**
   * Whether this is a new commitment (vs updating existing)
   */
  isNewCommitment?: boolean;

  /**
   * SLT hash (64 char hex) - REQUIRED when isNewCommitment is true.
   * This is the module token name on-chain (Blake2b-256 of SLT content).
   */
  sltHash?: string;

  /**
   * Evidence content (Tiptap JSON)
   */
  evidence: JSONContent;

  /**
   * Callback fired when submission is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * AssignmentUpdate - Student UI for submitting/updating assignment evidence (V2)
 *
 * Creates a tamper-evident on-chain record of the student's submission.
 * The evidence hash stored on-chain allows verification that the database
 * content matches what was committed.
 *
 * @example
 * ```tsx
 * <AssignmentUpdate
 *   courseId="abc123..."
 *   moduleCode="MODULE_1"
 *   evidence={editorContent}
 *   isNewCommitment={false}
 *   onSuccess={() => refetchProgress()}
 * />
 * ```
 */
export function AssignmentUpdate({
  courseId,
  moduleCode,
  moduleTitle,
  isNewCommitment = false,
  sltHash,
  evidence,
  onSuccess,
}: AssignmentUpdateProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();
  const submitEvidence = useSubmitEvidence();
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        // "updated" means Gateway has confirmed TX AND updated DB
        if (status.state === "updated") {
          console.log("[AssignmentUpdate] TX confirmed and DB updated by gateway");

          const actionText = isNewCommitment ? "committed" : "updated";
          toast.success("Submission Recorded!", {
            description: `Your evidence has been ${actionText} on-chain`,
          });

          void onSuccess?.();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Submission Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  // Compute evidence hash for display
  const computedHash = useMemo(() => {
    try {
      return computeAssignmentInfoHash(evidence);
    } catch {
      return null;
    }
  }, [evidence]);

  const ui = isNewCommitment
    ? TRANSACTION_UI.COURSE_STUDENT_ASSIGNMENT_COMMIT
    : TRANSACTION_UI.COURSE_STUDENT_ASSIGNMENT_UPDATE;

  const handleSubmit = async () => {
    if (!user?.accessTokenAlias || !evidence) {
      return;
    }

    // Validate sltHash is provided for new commitments
    if (isNewCommitment && !sltHash) {
      toast.error("Missing SLT Hash", {
        description: "sltHash is required when committing to a new module",
      });
      return;
    }

    // Compute evidence hash
    const hash = computeAssignmentInfoHash(evidence);
    setEvidenceHash(hash);

    // Save evidence to DB BEFORE on-chain TX - MUST succeed
    // isNewCommitment=true means new DB record, isNewCommitment=false means update existing
    try {
      await submitEvidence.mutateAsync({
        courseId,
        sltHash: sltHash ?? "",
        moduleCode,
        evidence,
        evidenceHash: hash,
        isUpdate: !isNewCommitment,
      });
      console.log("[AssignmentUpdate] Evidence saved to DB (isUpdate:", !isNewCommitment, ")");
    } catch (dbError) {
      // STOP - evidence must be saved before TX
      console.error("[AssignmentUpdate] Failed to save evidence:", dbError);
      toast.error("Failed to save your work", {
        description: "Please try again. Your work must be saved before submitting.",
      });
      return;
    }

    // Select transaction type based on mode
    const txType = isNewCommitment
      ? "COURSE_STUDENT_ASSIGNMENT_COMMIT"
      : "COURSE_STUDENT_ASSIGNMENT_UPDATE";

    // Build txParams based on transaction type
    const txParams = isNewCommitment
      ? {
          alias: user.accessTokenAlias,
          course_id: courseId,
          slt_hash: sltHash!, // Required for COMMIT
          assignment_info: hash,
        }
      : {
          alias: user.accessTokenAlias,
          course_id: courseId,
          assignment_info: hash,
        };

    // Side effect params are the same for both
    const sideEffectParams = {
      course_module_code: moduleCode,
      network_evidence: evidence,
      network_evidence_hash: hash,
    };

    await execute({
      txType,
      params: {
        ...txParams,
        ...sideEffectParams,
      },
      metadata: {
        slt_hash: sltHash ?? "",
        course_module_code: moduleCode,
        evidence: JSON.stringify(evidence),
        evidence_hash: hash,
      },
      onSuccess: (txResult) => {
        console.log("[AssignmentUpdate] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[AssignmentUpdate] Error:", txError);
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const hasEvidence = evidence && Object.keys(evidence).length > 0;
  const hasSltHash = !isNewCommitment || !!sltHash; // sltHash only required for new commitments
  const canSubmit = hasAccessToken && hasEvidence && hasSltHash;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            {isNewCommitment ? (
              <SendIcon className="h-5 w-5 text-primary" />
            ) : (
              <EditIcon className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>
              {isNewCommitment
                ? `Start working on ${moduleTitle ?? moduleCode}`
                : "Record your updated evidence on-chain"}
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Module Info */}
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="secondary" className="text-xs">
            {moduleTitle ?? moduleCode}
          </AndamioBadge>
          {isNewCommitment && (
            <AndamioBadge variant="outline" className="text-xs">
              New Commitment
            </AndamioBadge>
          )}
        </div>

        {/* Tamper-Evidence Explanation */}
        <div className="rounded-sm border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-4 w-4 text-primary" />
            <AndamioText className="font-medium">Tamper-Evident Record</AndamioText>
          </div>
          <AndamioText variant="small" className="text-xs">
            Your submission is hashed and recorded on-chain, creating a permanent, verifiable record.
          </AndamioText>
          {computedHash && (
            <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
              <TransactionIcon className="h-3 w-3 shrink-0" />
              <code className="font-mono text-primary">{computedHash.slice(0, 24)}...</code>
            </div>
          )}
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
                  Submission Recorded!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {evidenceHash
                    ? `Hash: ${evidenceHash.slice(0, 16)}...`
                    : "Your evidence has been recorded on-chain"}
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {state !== "success" && !txConfirmed && (
          <TransactionButton
            txState={state}
            onClick={handleSubmit}
            disabled={!canSubmit}
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
