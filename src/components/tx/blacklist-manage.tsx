/**
 * BlacklistManage Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for adding or removing contributors from a project's blacklist.
 * Uses PROJECT_OWNER_BLACKLIST_MANAGE transaction with gateway auto-confirmation.
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
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { BlockIcon, AddIcon, DeleteIcon, AlertIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

export interface BlacklistManageProps {
  /**
   * Project NFT Policy ID
   */
  projectNftPolicyId: string;

  /**
   * Current blacklisted aliases (for display)
   */
  currentBlacklist?: string[];

  /**
   * Callback fired when blacklist is successfully updated
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * BlacklistManage - UI for adding/removing contributors from project blacklist (V2)
 *
 * @example
 * ```tsx
 * <BlacklistManage
 *   projectNftPolicyId="abc123..."
 *   currentBlacklist={["badactor1", "badactor2"]}
 *   onSuccess={() => refetchProject()}
 * />
 * ```
 */
export function BlacklistManage({
  projectNftPolicyId,
  currentBlacklist = [],
  onSuccess,
}: BlacklistManageProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  const [aliasInput, setAliasInput] = useState("");
  const [action, setAction] = useState<"add" | "remove">("add");

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        // "updated" means Gateway has confirmed TX AND updated DB
        if (status.state === "updated") {
          console.log("[BlacklistManage] TX confirmed and DB updated by gateway");

          const actionText = action === "add" ? "added to" : "removed from";
          toast.success("Blacklist Updated!", {
            description: `Contributors ${actionText} blacklist`,
          });

          // Clear input
          setAliasInput("");

          // Call callback
          void onSuccess?.();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Update Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  const ui = TRANSACTION_UI.PROJECT_OWNER_BLACKLIST_MANAGE;

  const handleUpdateBlacklist = async () => {
    if (!user?.accessTokenAlias || !aliasInput.trim()) {
      return;
    }

    // Parse aliases (comma-separated)
    const aliases = aliasInput
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    if (aliases.length === 0) {
      toast.error("No aliases specified");
      return;
    }

    // Build params based on action
    const aliases_to_add = action === "add" ? aliases : [];
    const aliases_to_remove = action === "remove" ? aliases : [];

    await execute({
      txType: "PROJECT_OWNER_BLACKLIST_MANAGE",
      params: {
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        aliases_to_add,
        aliases_to_remove,
      },
      onSuccess: async (txResult) => {
        console.log("[BlacklistManage] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[BlacklistManage] Error:", txError);
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const hasAliases = aliasInput.trim().length > 0;
  const canSubmit = hasAccessToken && hasAliases;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <BlockIcon className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>
              Block or unblock contributors from this project
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Current Blacklist */}
        {currentBlacklist.length > 0 && (
          <div className="space-y-2">
            <AndamioText variant="small" className="text-xs font-medium uppercase tracking-wide">
              Currently Blacklisted
            </AndamioText>
            <div className="flex flex-wrap gap-2">
              {currentBlacklist.map((alias) => (
                <AndamioBadge key={alias} variant="destructive" className="text-xs font-mono">
                  {alias}
                </AndamioBadge>
              ))}
            </div>
          </div>
        )}

        {/* Action Toggle */}
        <div className="flex gap-2">
          <AndamioButton
            variant={action === "add" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setAction("add")}
            disabled={state !== "idle" && state !== "error"}
          >
            <AddIcon className="h-4 w-4 mr-1" />
            Blacklist
          </AndamioButton>
          <AndamioButton
            variant={action === "remove" ? "default" : "outline"}
            size="sm"
            onClick={() => setAction("remove")}
            disabled={state !== "idle" && state !== "error"}
          >
            <DeleteIcon className="h-4 w-4 mr-1" />
            Unblock
          </AndamioButton>
        </div>

        {/* Alias Input */}
        <div className="space-y-2">
          <AndamioLabel htmlFor="aliases">
            {action === "add" ? "Contributors to Blacklist" : "Contributors to Unblock"}
          </AndamioLabel>
          <AndamioInput
            id="aliases"
            type="text"
            placeholder="badactor1, badactor2"
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            disabled={state !== "idle" && state !== "error"}
          />
          <AndamioText variant="small" className="text-xs">
            Enter access token aliases, separated by commas
          </AndamioText>
        </div>

        {/* Warning for blacklist */}
        {action === "add" && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
            <AndamioText variant="small" className="text-xs text-destructive-foreground">
              Blacklisted contributors cannot join, commit to tasks, or receive rewards from this project.
            </AndamioText>
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
                  Blacklist Updated!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  Contributors {action === "add" ? "blacklisted" : "unblocked"} successfully.
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {state !== "success" && !txConfirmed && (
          <TransactionButton
            txState={state}
            onClick={handleUpdateBlacklist}
            disabled={!canSubmit}
            stateText={{
              idle: action === "add" ? "Blacklist Contributors" : "Unblock Contributors",
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Updating on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
