/**
 * TreasuryAddFunds Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for adding funds (ADA) to a project treasury.
 * Uses PROJECT_USER_TREASURY_ADD_FUNDS transaction with gateway auto-confirmation.
 *
 * @see ~/hooks/tx/use-transaction.ts
 * @see ~/hooks/tx/use-tx-stream.ts
 */

"use client";

import React, { useState } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { parseTxErrorMessage } from "~/lib/tx-error-messages";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioText } from "~/components/andamio/andamio-text";
import { TreasuryIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

export interface TreasuryAddFundsProps {
  /**
   * Project NFT Policy ID
   */
  projectNftPolicyId: string;

  /**
   * Callback fired when funds are successfully added
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * TreasuryAddFunds - UI for adding ADA to a project treasury (V2)
 *
 * @example
 * ```tsx
 * <TreasuryAddFunds
 *   projectNftPolicyId="abc123..."
 *   onSuccess={() => refetchProject()}
 * />
 * ```
 */
export function TreasuryAddFunds({
  projectNftPolicyId,
  onSuccess,
}: TreasuryAddFundsProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  const [adaAmount, setAdaAmount] = useState("");

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          console.log("[TreasuryAddFunds] TX confirmed and DB updated by gateway");
          toast.success("Funds Added!", {
            description: `${adaAmount} ADA added to project treasury`,
          });
          setAdaAmount("");
          void onSuccess?.();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Transaction Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  const ui = TRANSACTION_UI.PROJECT_USER_TREASURY_ADD_FUNDS;
  const showAction = state !== "success" && !txConfirmed;

  const handleAddFunds = async () => {
    if (!user?.accessTokenAlias || !adaAmount) {
      return;
    }

    const lovelaceAmount = Math.floor(parseFloat(adaAmount) * 1_000_000);

    if (lovelaceAmount < 1_000_000) {
      toast.error("Minimum deposit is 1 ADA");
      return;
    }

    await execute({
      txType: "PROJECT_USER_TREASURY_ADD_FUNDS",
      params: {
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        deposit_value: [["lovelace", lovelaceAmount]],
      },
      onSuccess: async (txResult) => {
        console.log("[TreasuryAddFunds] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[TreasuryAddFunds] Error:", txError);
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const parsedAmount = parseFloat(adaAmount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= 1;
  const canSubmit = hasAccessToken && isValidAmount;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <TreasuryIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>
              {ui.description[0]}
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Amount Input */}
        <div className="space-y-2">
          <AndamioLabel htmlFor="ada-amount">Amount (ADA)</AndamioLabel>
          <AndamioInput
            id="ada-amount"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 50"
            value={adaAmount}
            onChange={(e) => setAdaAmount(e.target.value)}
            disabled={state !== "idle" && state !== "error"}
          />
          <AndamioText variant="small" className="text-xs">
            Minimum 1 ADA. Funds will be available for task rewards.
          </AndamioText>
        </div>

        {/* Amount Preview */}
        {isValidAmount && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Deposit amount</span>
              <span className="font-bold">{parsedAmount.toLocaleString()} ADA</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-muted-foreground text-xs">In lovelace</span>
              <span className="font-mono text-xs">{(parsedAmount * 1_000_000).toLocaleString()}</span>
            </div>
          </div>
        )}

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
                  {txStatus?.state === "confirmed" && "Processing treasury update"}
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
                  Funds Added!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  Treasury has been funded successfully.
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button — idle state shows confirmation dialog */}
        {showAction && state === "idle" && (
          isValidAmount ? (
            <AndamioConfirmDialog
              trigger={
                <AndamioButton className="w-full" disabled={!canSubmit}>
                  {ui.buttonText}
                </AndamioButton>
              }
              title="Add Funds to Treasury?"
              description={`This will transfer ${parsedAmount} ADA from your wallet to the project treasury. Funds are used for task rewards. This action is recorded on-chain.`}
              confirmText={`Add ${parsedAmount} ADA`}
              onConfirm={handleAddFunds}
            />
          ) : (
            <AndamioButton className="w-full" disabled>
              {ui.buttonText}
            </AndamioButton>
          )
        )}
        {showAction && state !== "idle" && (
          <TransactionButton
            txState={state}
            onClick={handleAddFunds}
            disabled={!canSubmit}
            stateText={{
              idle: ui.buttonText,
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Adding Funds...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
