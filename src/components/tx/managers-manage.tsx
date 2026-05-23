/**
 * ManagersManage Transaction Component (V3 - Unified Team Card)
 *
 * Unified UI for viewing, adding, and removing project managers.
 * Current managers are shown as interactive badges (click × to remove).
 * New managers are added via verified alias input.
 * Submits a single TX with managers_to_add + managers_to_remove.
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-stream.ts
 */

"use client";

import React, { useState, useCallback } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ManagerIcon, AlertIcon, LoadingIcon, SuccessIcon, CloseIcon, OnChainIcon } from "~/components/icons";
import { AliasListInput } from "./alias-list-input";
import { toast } from "sonner";
import { TX_COSTS } from "~/config/ui-constants";
import { parseTxErrorMessage } from "~/lib/tx-error-messages";

export interface ManagersManageProps {
  projectNftPolicyId: string;
  currentManagers?: string[];
  projectOwner?: string | null;
  onSuccess?: () => void | Promise<void>;
}

export function ManagersManage({
  projectNftPolicyId,
  currentManagers = [],
  projectOwner = null,
  onSuccess,
}: ManagersManageProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  const [aliasesToAdd, setAliasesToAdd] = useState<string[]>([]);
  const [aliasesToRemove, setAliasesToRemove] = useState<string[]>([]);

  // Optimistic state: track managers from successful TXs that the API hasn't reflected yet
  const [optimisticAdds, setOptimisticAdds] = useState<string[]>([]);
  const [optimisticRemoves, setOptimisticRemoves] = useState<string[]>([]);

  // Merge API data with optimistic state for display
  const effectiveManagers = React.useMemo(() => {
    const fromApi = new Set(currentManagers);
    // Remove any that were optimistically removed
    for (const alias of optimisticRemoves) {
      fromApi.delete(alias);
    }
    // Add any that were optimistically added (if API hasn't caught up)
    for (const alias of optimisticAdds) {
      fromApi.add(alias);
    }
    return Array.from(fromApi);
  }, [currentManagers, optimisticAdds, optimisticRemoves]);

  // Clear optimistic state once API catches up
  React.useEffect(() => {
    setOptimisticAdds((prev) => prev.filter((a) => !currentManagers.includes(a)));
    setOptimisticRemoves((prev) => prev.filter((a) => currentManagers.includes(a)));
  }, [currentManagers]);

  const hasChanges = aliasesToAdd.length > 0 || aliasesToRemove.length > 0;

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          toast.success("Team Updated!", {
            description: "Project managers have been updated.",
          });
          // Apply optimistic updates immediately so the UI reflects changes
          setOptimisticAdds((prev) => [...prev, ...aliasesToAdd]);
          setOptimisticRemoves((prev) => [...prev, ...aliasesToRemove]);
          // Then clear pending state
          setAliasesToAdd([]);
          setAliasesToRemove([]);
          // Trigger API refresh in background (will clear optimistic state when it catches up)
          void onSuccess?.();
          // Defer reset to next tick so React batches all state updates together,
          // preventing a brief flash of idle state before optimistic updates render
          setTimeout(() => reset(), 0);
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Update Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
          // Defer reset to next tick for consistent behavior
          setTimeout(() => reset(), 0);
        }
      },
    }
  );

  // Context-aware exclusion messages for AliasListInput
  const getExcludeReason = useCallback((alias: string): string | null => {
    if (alias === projectOwner) {
      return `"${alias}" is the project owner and already has manager access.`;
    }
    if (effectiveManagers.includes(alias)) {
      return `"${alias}" is already a manager on this project.`;
    }
    if (aliasesToAdd.includes(alias)) {
      return `"${alias}" is already queued to be added.`;
    }
    return null;
  }, [projectOwner, effectiveManagers, aliasesToAdd]);

  const showAction = state !== "success" && !txConfirmed;

  const toggleRemove = useCallback((alias: string) => {
    setAliasesToRemove((prev) =>
      prev.includes(alias) ? prev.filter((a) => a !== alias) : [...prev, alias]
    );
  }, []);

  const handleSubmit = async () => {
    if (!user?.accessTokenAlias || !hasChanges) return;

    await execute({
      txType: "PROJECT_OWNER_MANAGERS_MANAGE",
      params: {
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        managers_to_add: aliasesToAdd,
        managers_to_remove: aliasesToRemove,
      },
      onSuccess: async (txResult) => {
        console.log("[ManagersManage] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[ManagersManage] Error:", txError);
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const canSubmit = hasAccessToken && hasChanges;
  const isProcessing = state !== "idle" && state !== "error";

  // Compute dialog description based on what's changing
  const confirmDescription = (() => {
    const addCount = aliasesToAdd.length;
    const removeCount = aliasesToRemove.length;
    if (addCount > 0 && removeCount > 0) {
      return `This will add ${addCount} manager(s) (${addCount * TX_COSTS.PER_MANAGER_ADA} ADA) and remove ${removeCount} manager(s). Removed managers lose project access. This action is recorded on-chain.`;
    }
    if (addCount > 0) {
      return `This will add ${addCount} manager(s) at a cost of ${addCount * TX_COSTS.PER_MANAGER_ADA} ADA. They will be able to manage tasks and assess submissions. This action is recorded on-chain.`;
    }
    return `This will remove ${removeCount} manager(s) and revoke their project access. This action is recorded on-chain.`;
  })();

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <AndamioCardTitle className="text-base flex items-center gap-2">
          <ManagerIcon className="h-4 w-4" />
          Project Team
        </AndamioCardTitle>
        <AndamioCardDescription>
          Manage who can administer this project
        </AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-5">
        {/* Owner */}
        {projectOwner && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <OnChainIcon className="h-3.5 w-3.5 text-primary" />
              <AndamioText variant="small" className="font-medium">
                Owner
              </AndamioText>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <AndamioBadge variant="default" className="font-mono text-xs">
                {projectOwner}
              </AndamioBadge>
            </div>
          </div>
        )}

        {/* Current Managers */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <OnChainIcon className="h-3.5 w-3.5 text-primary" />
            <AndamioText variant="small" className="font-medium">
              Managers
            </AndamioText>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {effectiveManagers.length === 0 ? (
              <AndamioText variant="small" className="text-muted-foreground">
                No managers assigned
              </AndamioText>
            ) : (
              effectiveManagers.map((manager) => {
                const isOwner = manager === projectOwner;
                const isMarkedForRemoval = aliasesToRemove.includes(manager);
                return (
                  <AndamioBadge
                    key={manager}
                    variant={isMarkedForRemoval ? "destructive" : "secondary"}
                    className={`font-mono text-xs ${isMarkedForRemoval ? "gap-1 pr-1 line-through opacity-70" : isOwner ? "" : "gap-1 pr-1"}`}
                  >
                    {manager}
                    {!isOwner && !isProcessing && (
                      <button
                        type="button"
                        onClick={() => toggleRemove(manager)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                        aria-label={isMarkedForRemoval ? `Undo remove ${manager}` : `Remove ${manager}`}
                      >
                        <CloseIcon className="h-3 w-3" />
                      </button>
                    )}
                  </AndamioBadge>
                );
              })
            )}
          </div>
          {effectiveManagers.length > 0 && !isProcessing && (
            <AndamioText variant="small" className="text-xs text-muted-foreground">
              Click &times; on a manager to mark them for removal
            </AndamioText>
          )}
        </div>

        {/* Pending Additions */}
        {aliasesToAdd.length > 0 && (
          <div className="space-y-2">
            <AndamioText variant="small" className="font-medium">
              Adding
            </AndamioText>
            <div className="flex flex-wrap gap-1.5">
              {aliasesToAdd.map((alias) => (
                <AndamioBadge key={alias} variant="outline" className="font-mono text-xs gap-1 pr-1 border-primary/30 bg-primary/5">
                  <SuccessIcon className="h-3 w-3 text-primary shrink-0" />
                  {alias}
                  {!isProcessing && (
                    <button
                      type="button"
                      onClick={() => setAliasesToAdd((prev) => prev.filter((a) => a !== alias))}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      aria-label={`Cancel adding ${alias}`}
                    >
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  )}
                </AndamioBadge>
              ))}
            </div>
          </div>
        )}

        {/* Separator */}
        <div className="border-t" />

        {/* Add Manager Input */}
        {!isProcessing && !txConfirmed && (
          <AliasListInput
            value={aliasesToAdd}
            onChange={setAliasesToAdd}
            label="Add a Manager"
            placeholder="Enter alias"
            disabled={isProcessing}
            excludeAliases={[...effectiveManagers, ...aliasesToAdd]}
            getExcludeReason={getExcludeReason}
            helperText="Each alias is verified on-chain before being added."
            hideBadges
          />
        )}

        {/* Pending Changes Summary */}
        {hasChanges && !isProcessing && (
          <>
            <div className="border-t" />
            <div className="space-y-2">
              <AndamioText variant="small" className="text-xs font-medium uppercase tracking-wide">
                Pending Changes
              </AndamioText>
              <div className="space-y-1">
                {aliasesToAdd.map((alias) => (
                  <div key={`add-${alias}`} className="flex items-center gap-2 text-sm">
                    <SuccessIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Adding <span className="font-mono">{alias}</span></span>
                  </div>
                ))}
                {aliasesToRemove.map((alias) => (
                  <div key={`rm-${alias}`} className="flex items-center gap-2 text-sm text-destructive">
                    <CloseIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>Removing <span className="font-mono">{alias}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Warning for removals */}
        {aliasesToRemove.length > 0 && !isProcessing && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
            <AndamioText variant="small" className="text-xs">
              Removing managers will revoke their ability to manage tasks and assess submissions.
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

        {/* Cost Breakdown */}
        {aliasesToAdd.length > 0 && !isProcessing && !txConfirmed && (
          <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
            <AndamioText variant="small" className="text-muted-foreground">
              Transaction cost
            </AndamioText>
            <AndamioText variant="small" className="font-medium">
              {aliasesToAdd.length} &times; {TX_COSTS.PER_MANAGER_ADA} ADA = {aliasesToAdd.length * TX_COSTS.PER_MANAGER_ADA} ADA
            </AndamioText>
          </div>
        )}

        {/* Submit Button — idle state shows confirmation dialog */}
        {showAction && hasChanges && state === "idle" && (
          <AndamioConfirmDialog
            trigger={
              <AndamioButton className="w-full sm:w-auto" disabled={!canSubmit}>
                Save Team Changes
              </AndamioButton>
            }
            title="Save Team Changes?"
            description={confirmDescription}
            confirmText="Save Team Changes"
            onConfirm={handleSubmit}
          />
        )}
        {showAction && hasChanges && state !== "idle" && (
          <TransactionButton
            txState={state}
            onClick={handleSubmit}
            disabled={!canSubmit}
            stateText={{
              idle: "Verify & Add",
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Updating on Blockchain...",
            }}
            className="w-full sm:w-auto"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
