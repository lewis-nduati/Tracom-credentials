/**
 * ProjectCredentialClaim Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for contributors to claim credential tokens after completing project tasks.
 * Uses PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM transaction type with gateway auto-confirmation.
 *
 * This transaction has no additional database side effects because:
 * 1. By the time a contributor claims credentials, all task completions have already been recorded.
 * 2. The credential token itself IS the proof of completion.
 * 3. Credential ownership is verified via blockchain queries, not database lookups.
 *
 * The gateway still tracks the transaction for analytics and state updates.
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
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import { CredentialIcon, LoadingIcon, SuccessIcon, TreasuryIcon } from "~/components/icons";
import { formatLovelace } from "~/lib/cardano-utils";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

export interface ProjectCredentialClaimProps {
  /**
   * Project NFT Policy ID
   */
  projectNftPolicyId: string;

  /**
   * Contributor state ID (56 char hex)
   */
  contributorStateId: string;

  /**
   * Project title for display
   */
  projectTitle?: string;

  /**
   * Task hash for the commitment being claimed. Passed as TX registration
   * metadata so the gateway can reliably transition the commitment to REWARDED.
   */
  taskHash: string;

  /**
   * Pending reward amount in lovelace. When provided, the component
   * shows "Leave Project & Claim Rewards" messaging instead of the
   * default "Claim Project Credentials" messaging.
   */
  pendingRewardLovelace?: string;

  /**
   * Callback fired when claim is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * ProjectCredentialClaim - Contributor UI for claiming project credentials (V2)
 *
 * This is the culmination of the contribution journey - a tamper-evident,
 * on-chain proof of achievement.
 *
 * @example
 * ```tsx
 * <ProjectCredentialClaim
 *   projectNftPolicyId="abc123..."
 *   contributorStateId="def456..."
 *   projectTitle="Bounty Program"
 *   onSuccess={() => refetchCredentials()}
 * />
 * ```
 */
export function ProjectCredentialClaim({
  projectNftPolicyId,
  contributorStateId,
  taskHash,
  projectTitle,
  pendingRewardLovelace,
  onSuccess,
}: ProjectCredentialClaimProps) {
  const hasRewards = !!pendingRewardLovelace && pendingRewardLovelace !== "0";
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        // "updated" means Gateway has confirmed TX AND updated DB
        if (status.state === "updated") {
          console.log("[ProjectCredentialClaim] TX confirmed and tracked by gateway");

          toast.success(hasRewards ? "Rewards Claimed!" : "Credentials Claimed!", {
            description: hasRewards
              ? `You've left the project and claimed ${formatLovelace(pendingRewardLovelace)} + your credential`
              : projectTitle
                ? `You've earned your credentials from ${projectTitle}`
                : "Your project credentials have been minted",
          });

          void onSuccess?.();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Claim Failed", {
            description: status.last_error ?? "Transaction failed on-chain. Please try again.",
          });
        }
      },
    }
  );

  const ui = TRANSACTION_UI.PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM;

  const handleClaim = async () => {
    if (!user?.accessTokenAlias) {
      return;
    }

    await execute({
      txType: "PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM",
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        contributor_state_id: contributorStateId,
      },
      metadata: {
        task_hash: taskHash,
      },
      onSuccess: async (txResult) => {
        console.log("[ProjectCredentialClaim] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[ProjectCredentialClaim] Error:", txError);
        toast.error("Claim Failed", {
          description: txError.message || "Failed to claim credentials",
        });
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
          title={projectTitle ?? "Project Credentials"}
          description={hasRewards
            ? `Leave project and claim ${formatLovelace(pendingRewardLovelace)}`
            : undefined}
          iconColor="text-primary"
        />
      </AndamioCardHeader>
      <AndamioCardContent>
        {/* Pending Rewards — only when leaving with rewards */}
        {hasRewards && (
          <div className="flex items-center gap-2 rounded-sm border border-primary/30 bg-primary/5 px-4 py-3">
            <TreasuryIcon className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm font-medium">Pending Rewards:</span>
            <span className="text-sm font-bold text-primary">{formatLovelace(pendingRewardLovelace)}</span>
          </div>
        )}

        {/* Transaction Status */}
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
                  {txStatus?.state === "confirmed" && "Processing credential mint"}
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
                <span className="font-medium text-primary">
                  {hasRewards ? "Rewards & Credentials Claimed!" : "Credentials Claimed!"}
                </span>
                <AndamioText variant="small">
                  {hasRewards
                    ? `${formatLovelace(pendingRewardLovelace)} sent to your wallet`
                    : "Your credential has been recorded on-chain"}
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Commission Notice */}
        {hasRewards && !txConfirmed && (
          <AndamioText variant="small" className="text-xs text-muted-foreground">
            A small commission is deducted from task rewards to support the Andamio platform.
          </AndamioText>
        )}

        {/* Claim Button */}
        {!txConfirmed && (
          <TransactionButton
            txState={state}
            onClick={handleClaim}
            disabled={!hasAccessToken}
            stateText={{
              idle: hasRewards ? "Leave & Claim" : ui.buttonText,
              fetching: "Preparing Claim...",
              signing: "Sign in Wallet",
              submitting: hasRewards ? "Leaving & Claiming..." : "Minting Credentials...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
