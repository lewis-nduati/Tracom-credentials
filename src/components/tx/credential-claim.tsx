/**
 * CredentialClaim Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * Elegant UI for students to claim their credential token after completing
 * all required assignments for a course module.
 *
 * This is the culmination of the learning journey - a tamper-evident,
 * on-chain proof of achievement.
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-stream.ts
 */

"use client";

import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { parseTxErrorMessage } from "~/lib/tx-error-messages";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
} from "~/components/andamio/andamio-card";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { CredentialIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

export interface CredentialClaimProps {
  /**
   * Course NFT Policy ID
   */
  courseId: string;

  /**
   * Module code for the credential being claimed
   */
  moduleCode: string;

  /**
   * Module title for display
   */
  moduleTitle?: string;

  /**
   * Course title for display
   */
  courseTitle?: string;

  /**
   * Callback fired when claim is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * CredentialClaim - Student UI for claiming a course credential (V2)
 *
 * This transaction has no database side effects because:
 * 1. By the time a student claims a credential, all assignment commitments
 *    have already been completed and recorded via earlier transactions.
 * 2. The credential token itself IS the proof of completion.
 * 3. Credential ownership is verified via blockchain queries, not database lookups.
 *
 * @example
 * ```tsx
 * <CredentialClaim
 *   courseId="abc123..."
 *   moduleCode="MODULE_1"
 *   moduleTitle="Introduction to Cardano"
 *   courseTitle="Cardano Developer Course"
 *   onSuccess={() => refetchCredentials()}
 * />
 * ```
 */
export function CredentialClaim({
  courseId,
  moduleCode,
  moduleTitle,
  courseTitle,
  onSuccess,
}: CredentialClaimProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        // "updated" means Gateway has confirmed TX AND updated DB
        if (status.state === "updated") {
          console.log("[CredentialClaim] TX confirmed and DB updated by gateway");

          toast.success("Credential Claimed!", {
            description: `You've earned your credential for ${moduleTitle ?? moduleCode}`,
          });

          void onSuccess?.();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Claim Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  const ui = TRANSACTION_UI.COURSE_STUDENT_CREDENTIAL_CLAIM;

  const handleClaim = async () => {
    if (!user?.accessTokenAlias) {
      return;
    }

    await execute({
      txType: "COURSE_STUDENT_CREDENTIAL_CLAIM",
      params: {
        alias: user.accessTokenAlias,
        course_id: courseId,
      },
      onSuccess: async (txResult) => {
        console.log("[CredentialClaim] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[CredentialClaim] Error:", txError);
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <AndamioCardIconHeader
          icon={CredentialIcon}
          title={moduleTitle ?? moduleCode}
          description={courseTitle}
          iconColor="text-primary"
        />
      </AndamioCardHeader>
      <AndamioCardContent>
        {/* Transaction Status - Only show during processing */}
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
                <span className="font-medium">Confirming on blockchain...</span>
                <AndamioText variant="small">
                  {txStatus?.state === "pending" && "Waiting for block confirmation"}
                  {txStatus?.state === "confirmed" && "Processing database updates"}
                  {!txStatus && "Registering transaction..."}
                </AndamioText>
                <AndamioText variant="muted">
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
                <span className="font-medium text-primary">Credential Claimed!</span>
                <AndamioText variant="small">
                  Your credential has been added to your wallet!
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Claim Button - confirm dialog provides context before signing (Principle 4) */}
        {!txConfirmed && state === "idle" && (
          <AndamioConfirmDialog
            trigger={
              <AndamioButton className="w-full" disabled={!hasAccessToken}>
                <CredentialIcon className="h-4 w-4 mr-2" />
                {ui.buttonText}
              </AndamioButton>
            }
            title="Claim Your Credential?"
            description={`This permanently records your completion of "${moduleTitle ?? moduleCode}" as a verifiable credential. This action cannot be undone.`}
            confirmText="Claim Credential"
            onConfirm={handleClaim}
          />
        )}
        {!txConfirmed && state !== "idle" && state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleClaim}
            disabled={!hasAccessToken}
            stateText={{
              idle: ui.buttonText,
              fetching: "Preparing Claim...",
              signing: "Sign in Wallet",
              submitting: "Claiming Credential...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
