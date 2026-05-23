"use client";

import React, { useState, useCallback } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
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
import { TeacherIcon, AlertIcon, LoadingIcon, SuccessIcon, CloseIcon, OnChainIcon } from "~/components/icons";
import { AliasListInput } from "./alias-list-input";
import { toast } from "sonner";
import { TX_COSTS } from "~/config/ui-constants";
import { parseTxErrorMessage } from "~/lib/tx-error-messages";

export interface TeachersUpdateProps {
  courseId: string;
  currentTeachers?: string[];
  onSuccess?: () => void | Promise<void>;
}

export function TeachersUpdate({
  courseId,
  currentTeachers = [],
  onSuccess,
}: TeachersUpdateProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  const [aliasesToAdd, setAliasesToAdd] = useState<string[]>([]);
  const [aliasesToRemove, setAliasesToRemove] = useState<string[]>([]);

  // Optimistic state: track teachers from successful TXs that the API hasn't reflected yet
  const [optimisticAdds, setOptimisticAdds] = useState<string[]>([]);
  const [optimisticRemoves, setOptimisticRemoves] = useState<string[]>([]);

  // Merge API data with optimistic state for display
  const effectiveTeachers = React.useMemo(() => {
    const fromApi = new Set(currentTeachers);
    for (const alias of optimisticRemoves) {
      fromApi.delete(alias);
    }
    for (const alias of optimisticAdds) {
      fromApi.add(alias);
    }
    return Array.from(fromApi);
  }, [currentTeachers, optimisticAdds, optimisticRemoves]);

  // Clear optimistic state once API catches up
  React.useEffect(() => {
    setOptimisticAdds((prev) => prev.filter((a) => !currentTeachers.includes(a)));
    setOptimisticRemoves((prev) => prev.filter((a) => currentTeachers.includes(a)));
  }, [currentTeachers]);

  const hasChanges = aliasesToAdd.length > 0 || aliasesToRemove.length > 0;

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          toast.success("Teachers Updated!", {
            description: "Course teachers have been updated.",
          });
          setOptimisticAdds((prev) => [...prev, ...aliasesToAdd]);
          setOptimisticRemoves((prev) => [...prev, ...aliasesToRemove]);
          setAliasesToAdd([]);
          setAliasesToRemove([]);
          void onSuccess?.();
          reset();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Update Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
          reset();
        }
      },
    }
  );

  const getExcludeReason = useCallback((alias: string): string | null => {
    if (effectiveTeachers.includes(alias)) {
      return `"${alias}" is already a teacher on this course.`;
    }
    if (aliasesToAdd.includes(alias)) {
      return `"${alias}" is already queued to be added.`;
    }
    return null;
  }, [effectiveTeachers, aliasesToAdd]);

  const toggleRemove = useCallback((alias: string) => {
    setAliasesToRemove((prev) =>
      prev.includes(alias) ? prev.filter((a) => a !== alias) : [...prev, alias]
    );
  }, []);

  const handleSubmit = async () => {
    if (!user?.accessTokenAlias || !hasChanges) return;
    // Minimum-1 guard: prevent removing all teachers unless adding replacements
    if (remainingCount === 0 && aliasesToAdd.length === 0) return;

    await execute({
      txType: "COURSE_OWNER_TEACHERS_MANAGE",
      params: {
        alias: user.accessTokenAlias,
        course_id: courseId,
        teachers_to_add: aliasesToAdd,
        teachers_to_remove: aliasesToRemove,
      },
      onSuccess: async (txResult) => {
        console.log("[TeachersUpdate] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[TeachersUpdate] Error:", txError);
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const isProcessing = state !== "idle" && state !== "error";
  const showAction = state !== "success" && !txConfirmed;

  // Minimum-1 enforcement: count teachers that would remain after pending removals
  const remainingCount = effectiveTeachers.filter(
    (t) => !aliasesToRemove.includes(t)
  ).length;
  const canSubmit = hasAccessToken && hasChanges && (remainingCount > 0 || aliasesToAdd.length > 0);

  // Compute dialog description based on what's changing
  const confirmDescription = (() => {
    const addCount = aliasesToAdd.length;
    const removeCount = aliasesToRemove.length;
    if (addCount > 0 && removeCount > 0) {
      return `This will add ${addCount} teacher(s) (${addCount * TX_COSTS.PER_TEACHER_ADA} ADA) and remove ${removeCount} teacher(s). Removed teachers lose course access. This action is recorded on-chain.`;
    }
    if (addCount > 0) {
      return `This will add ${addCount} teacher(s) at a cost of ${addCount * TX_COSTS.PER_TEACHER_ADA} ADA. Teachers can manage modules and assess assignments. This action is recorded on-chain.`;
    }
    return `This will remove ${removeCount} teacher(s) and revoke their course management access. This action is recorded on-chain.`;
  })();

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <AndamioCardTitle className="text-base flex items-center gap-2">
          <TeacherIcon className="h-4 w-4" />
          Manage Course Teachers
        </AndamioCardTitle>
        <AndamioCardDescription>
          Manage who can teach this course and assess assignments
        </AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-5">
        {/* Current Teachers — interactive badges */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <OnChainIcon className="h-3.5 w-3.5 text-primary" />
            <AndamioText variant="small" className="font-medium">
              Teachers
            </AndamioText>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {effectiveTeachers.length === 0 ? (
              <AndamioText variant="small" className="text-muted-foreground">
                No teachers assigned
              </AndamioText>
            ) : (
              effectiveTeachers.map((teacher) => {
                const isMarkedForRemoval = aliasesToRemove.includes(teacher);
                const isLastRemaining = remainingCount <= 1 && !isMarkedForRemoval;
                const showRemoveButton = !isProcessing && !isLastRemaining;
                return (
                  <AndamioBadge
                    key={teacher}
                    variant={isMarkedForRemoval ? "destructive" : "secondary"}
                    className={`font-mono text-xs ${
                      showRemoveButton || isMarkedForRemoval ? "gap-1 pr-1" : ""
                    } ${isMarkedForRemoval ? "line-through opacity-70" : ""}`}
                  >
                    {teacher}
                    {showRemoveButton && (
                      <button
                        type="button"
                        onClick={() => toggleRemove(teacher)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                        aria-label={
                          isMarkedForRemoval
                            ? `Undo remove ${teacher}`
                            : `Remove ${teacher}`
                        }
                      >
                        <CloseIcon className="h-3 w-3" />
                      </button>
                    )}
                  </AndamioBadge>
                );
              })
            )}
          </div>
          {effectiveTeachers.length > 0 && !isProcessing && (
            <AndamioText variant="small" className="text-xs text-muted-foreground">
              {effectiveTeachers.length === 1
                ? "At least one teacher must remain on the course."
                : "Click \u00d7 on a teacher to mark them for removal"}
            </AndamioText>
          )}
        </div>

        {/* Pending Additions badges */}
        {aliasesToAdd.length > 0 && (
          <div className="space-y-2">
            <AndamioText variant="small" className="font-medium">
              Adding
            </AndamioText>
            <div className="flex flex-wrap gap-1.5">
              {aliasesToAdd.map((alias) => (
                <AndamioBadge
                  key={alias}
                  variant="outline"
                  className="font-mono text-xs gap-1 pr-1 border-primary/30 bg-primary/5"
                >
                  <SuccessIcon className="h-3 w-3 text-primary shrink-0" />
                  {alias}
                  {!isProcessing && (
                    <button
                      type="button"
                      onClick={() =>
                        setAliasesToAdd((prev) => prev.filter((a) => a !== alias))
                      }
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

        <div className="border-t" />

        {/* Add Teacher Input */}
        {!isProcessing && !txConfirmed && (
          <AliasListInput
            value={aliasesToAdd}
            onChange={setAliasesToAdd}
            label="Add a Teacher"
            placeholder="Enter alias"
            excludeAliases={[...effectiveTeachers, ...aliasesToAdd]}
            getExcludeReason={getExcludeReason}
            helperText="Press Enter or click + to add. Each alias is verified on-chain."
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

        {/* Removal warning */}
        {aliasesToRemove.length > 0 && !isProcessing && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
            <AndamioText variant="small" className="text-xs">
              Removing teachers will revoke their ability to manage modules and assess assignments.
            </AndamioText>
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

        {/* Cost Breakdown — additions only */}
        {aliasesToAdd.length > 0 && !isProcessing && !txConfirmed && (
          <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
            <AndamioText variant="small" className="text-muted-foreground">
              Transaction cost
            </AndamioText>
            <AndamioText variant="small" className="font-medium">
              {aliasesToAdd.length} &times; {TX_COSTS.PER_TEACHER_ADA} ADA = {aliasesToAdd.length * TX_COSTS.PER_TEACHER_ADA} ADA
            </AndamioText>
          </div>
        )}

        {/* Submit Button — idle state shows confirmation dialog */}
        {showAction && hasChanges && state === "idle" && (
          <AndamioConfirmDialog
            trigger={
              <AndamioButton className="w-full sm:w-auto" disabled={!canSubmit}>
                Save Teacher Changes
              </AndamioButton>
            }
            title="Save Teacher Changes?"
            description={confirmDescription}
            confirmText="Save Teacher Changes"
            onConfirm={handleSubmit}
          />
        )}
        {showAction && hasChanges && state !== "idle" && (
          <TransactionButton
            txState={state}
            onClick={handleSubmit}
            disabled={!canSubmit}
            stateText={{
              idle: "Save Teacher Changes",
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
