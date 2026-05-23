"use client";

import React from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { CredentialIcon, OnChainIcon } from "~/components/icons";
import { toast } from "sonner";
import { parseTxErrorMessage } from "~/lib/tx-error-messages";

export interface SetCoursePrerequisitesProps {
  courseId: string;
  moduleHashes: string[];
  prerequisiteStateId: string;
  prerequisiteCourseName: string;
  onSuccess?: () => void | Promise<void>;
}

export function SetCoursePrerequisites({
  courseId,
  moduleHashes,
  prerequisiteStateId,
  prerequisiteCourseName,
  onSuccess,
}: SetCoursePrerequisitesProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  useTxStream(result?.txHash ?? null, {
    onComplete: async () => {
      toast.success("Prerequisites set on-chain.");
      await onSuccess?.();
    },
  });

  const handleSubmit = async () => {
    if (!user) return;

    if (!user.accessTokenAlias) return;

    await execute({
      txType: "COURSE_TEACHER_MODULES_MANAGE",
      params: {
        alias: user.accessTokenAlias,
        course_id: courseId,
        modules_to_add: [],
        modules_to_update: moduleHashes.map((slt_hash) => ({
          slt_hash,
          allowed_student_state_ids: [prerequisiteStateId],
          prereq_slt_hashes: [],
        })),
        modules_to_remove: [],
      },
      onError: (txError) => {
        toast.error(parseTxErrorMessage(txError.message) ?? txError.message);
      },
    });
  };

  if (!isAuthenticated || !user) return null;

  if (state === "success") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
        <OnChainIcon className="h-4 w-4 text-green-500 shrink-0" />
        <AndamioText variant="small" className="text-green-700 dark:text-green-400">
          Done — students must now complete{" "}
          <strong>{prerequisiteCourseName}</strong> before enrolling.
        </AndamioText>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
        <CredentialIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="space-y-1 min-w-0">
          <AndamioText variant="small" className="font-medium">
            Required prerequisite
          </AndamioText>
          <AndamioBadge variant="secondary">{prerequisiteCourseName}</AndamioBadge>
          <AndamioText variant="small" className="text-muted-foreground">
            Applies to all {moduleHashes.length} modules. Students will need a credential
            from <strong>{prerequisiteCourseName}</strong> before they can enroll.
          </AndamioText>
        </div>
      </div>

      {state === "error" && (
        <AndamioText variant="small" className="text-destructive">
          {parseTxErrorMessage(error?.message) ?? "Transaction failed"}
        </AndamioText>
      )}

      {state !== "idle" && state !== "error" ? (
        <TransactionStatus state={state} result={result} error={error?.message} onRetry={reset} />
      ) : (
        <TransactionButton txState={state} onClick={handleSubmit}>
          Apply On-Chain
        </TransactionButton>
      )}

    </div>
  );
}
