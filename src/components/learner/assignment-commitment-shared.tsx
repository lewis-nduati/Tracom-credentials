"use client";

import React from "react";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ContentEditor } from "~/components/editor";
import { TransactionButton } from "~/components/tx/transaction-button";
import { TransactionStatus } from "~/components/tx/transaction-status";
import {
  SuccessIcon,
  LoadingIcon,
  ExternalLinkIcon,
} from "~/components/icons";
import { hashNormalizedContent } from "~/lib/hashing";
import type { JSONContent } from "@tiptap/core";
import type { TxStatus } from "~/hooks/tx/use-tx-watcher";
import type { SimpleTransactionResult } from "~/hooks/tx/use-transaction";
import type { TransactionState } from "~/types/transaction";

// =============================================================================
// TxConfirmationProgress
// =============================================================================

interface TxConfirmationProgressProps {
  txStatus: TxStatus | null;
  txHash?: string | null;
  explorerUrl?: string | null;
}

/**
 * "Confirming on blockchain..." spinner with optional TX hash + explorer link.
 */
export function TxConfirmationProgress({
  txStatus,
  txHash,
  explorerUrl,
}: TxConfirmationProgressProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
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
      {txHash && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <code className="font-mono bg-muted px-2 py-1 rounded">
            {txHash.slice(0, 16)}...{txHash.slice(-8)}
          </code>
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              View <ExternalLinkIcon className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TxConfirmationSuccess
// =============================================================================

interface TxConfirmationSuccessProps {
  message: string;
  description?: string;
}

/**
 * Green success banner after TX confirmation.
 */
export function TxConfirmationSuccess({
  message,
  description = "Your assignment is now pending teacher review.",
}: TxConfirmationSuccessProps) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-3">
        <SuccessIcon className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <AndamioText className="font-medium text-primary">{message}</AndamioText>
          <AndamioText variant="small" className="text-xs">{description}</AndamioText>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EvidenceHashDisplay
// =============================================================================

interface EvidenceHashDisplayProps {
  label: string;
  hash: string;
  truncate?: boolean;
}

/**
 * Mono-font hash display line.
 */
export function EvidenceHashDisplay({
  label,
  hash,
  truncate = true,
}: EvidenceHashDisplayProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
      <span>{label}</span>
      <span className="font-mono bg-muted px-2 py-1 rounded">
        {truncate ? `${hash.slice(0, 16)}...` : hash}
      </span>
    </div>
  );
}

// =============================================================================
// EvidenceEditorSection
// =============================================================================

interface EvidenceEditorSectionProps {
  label: string;
  description: string;
  placeholder: string;
  content: JSONContent | null;
  onContentChange: (content: JSONContent) => void;
  showHash?: boolean;
  onLock?: () => void;
  lockDisabled?: boolean;
}

/**
 * Evidence editor with label, description, content hash, and optional lock button.
 */
export function EvidenceEditorSection({
  label,
  description,
  placeholder,
  content,
  onContentChange,
  showHash = false,
  onLock,
  lockDisabled,
}: EvidenceEditorSectionProps) {
  return (
    <div className="space-y-2">
      <AndamioLabel>{label}</AndamioLabel>
      <AndamioText variant="small" className="text-xs mb-2">
        {description}
      </AndamioText>
      <div className="border border-foreground/30 dark:border-muted-foreground rounded-md overflow-hidden">
        <ContentEditor
          content={content}
          onContentChange={onContentChange}
          minHeight="200px"
          placeholder={placeholder}
        />
      </div>
      {showHash && content && (
        <EvidenceHashDisplay label="New Hash:" hash={hashNormalizedContent(content)} />
      )}
      {onLock && (
        <div className="flex justify-end pt-2">
          <AndamioButton onClick={onLock} disabled={lockDisabled}>
            <SuccessIcon className="h-4 w-4 mr-2" />
            Lock My Work
          </AndamioButton>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// UpdateTxStatusSection
// =============================================================================

interface UpdateTxStatusSectionProps {
  txState: TransactionState;
  txResult: SimpleTransactionResult | null;
  txError: string | null;
  txStatus: TxStatus | null;
  txConfirmed: boolean;
  onRetry: () => void;
  successMessage: string;
}

/**
 * Renders TransactionStatus + TxConfirmationProgress + TxConfirmationSuccess
 * for an update/commit TX. Replaces 3 identical blocks across branches.
 */
export function UpdateTxStatusSection({
  txState,
  txResult,
  txError,
  txStatus,
  txConfirmed,
  onRetry,
  successMessage,
}: UpdateTxStatusSectionProps) {
  return (
    <>
      {txState !== "idle" && txState !== "success" && (
        <TransactionStatus
          state={txState}
          result={txResult}
          error={txError}
          onRetry={onRetry}
          messages={{ success: "Transaction submitted! Waiting for confirmation..." }}
        />
      )}

      {txState === "success" && txResult?.requiresDBUpdate && !txConfirmed && (
        <TxConfirmationProgress txStatus={txStatus} />
      )}

      {txConfirmed && (
        <TxConfirmationSuccess message={successMessage} />
      )}
    </>
  );
}

// =============================================================================
// UpdateEvidenceActions
// =============================================================================

interface UpdateEvidenceActionsProps {
  txState: TransactionState;
  txConfirmed: boolean;
  localEvidenceContent: JSONContent | null;
  accessTokenAlias: string | null;
  courseId: string;
  sltHash: string;
  onExecuteTx: (evidenceHash: string) => Promise<void>;
  onRefresh?: () => void;
  submitLabel: string;
}

/**
 * Action buttons: Refresh Status + TransactionButton for update flows.
 */
export function UpdateEvidenceActions({
  txState,
  txConfirmed,
  localEvidenceContent,
  accessTokenAlias,
  onExecuteTx,
  onRefresh,
  submitLabel,
}: UpdateEvidenceActionsProps) {
  if (txState !== "idle" || txConfirmed) return null;

  return (
    <div className="flex justify-end gap-2">
      {onRefresh && (
        <AndamioButton variant="outline" size="sm" onClick={onRefresh}>
          Refresh Status
        </AndamioButton>
      )}
      {accessTokenAlias && localEvidenceContent && (
        <TransactionButton
          txState={txState}
          onClick={async () => {
            const evidenceHash = hashNormalizedContent(localEvidenceContent);
            await onExecuteTx(evidenceHash);
          }}
          stateText={{
            idle: submitLabel,
            fetching: "Preparing...",
            signing: "Sign in Wallet",
            submitting: "Submitting...",
          }}
        />
      )}
    </div>
  );
}
