/**
 * TransactionStatus Component
 *
 * Displays transaction progress and results.
 * Shows tx hash, blockchain explorer link, and error messages.
 *
 * Will be extracted to @andamio/transactions package.
 */

import React from "react";
import { VerifiedIcon, ErrorIcon, ExternalLinkIcon, LoadingIcon, CloseIcon } from "~/components/icons";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { isCollateralError } from "~/lib/tx-error-messages";
import type { TransactionResult, TransactionState } from "~/types/transaction";

export interface TransactionStatusProps {
  /**
   * Current transaction state
   */
  state: TransactionState;

  /**
   * Transaction result (if completed)
   */
  result?: TransactionResult | null;

  /**
   * Error message (if failed)
   */
  error?: string | null;

  /**
   * Optional callback to reset/retry transaction.
   * Called by both "Try again" link and dismiss button in error state.
   * Callers should pass a reset function (not a re-execute function).
   */
  onRetry?: () => void;

  /**
   * Optional custom messages for each state
   */
  messages?: Partial<Record<TransactionState, string>>;
}

const DEFAULT_MESSAGES: Record<TransactionState, string> = {
  idle: "",
  fetching: "Preparing your transaction...",
  signing: "Please sign the transaction in your wallet",
  submitting: "Submitting transaction to the blockchain...",
  confirming: "Waiting for blockchain confirmation...",
  success: "Transaction submitted successfully!",
  error: "Transaction failed",
};

/**
 * TransactionStatus - Display transaction progress and results
 *
 * @example
 * ```tsx
 * const { state, result, error } = useTransaction();
 *
 * <TransactionStatus
 *   state={state}
 *   result={result}
 *   error={error}
 *   onRetry={() => execute({ ... })}
 * />
 * ```
 */
export function TransactionStatus({
  state,
  result,
  error,
  onRetry,
  messages = {},
}: TransactionStatusProps) {
  // Don't render anything if idle
  if (state === "idle") {
    return null;
  }

  const text = { ...DEFAULT_MESSAGES, ...messages };

  // Success state
  if (state === "success" && result?.success) {
    return (
      <div className="rounded-sm border border-primary/30 bg-primary/5 p-4" role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <VerifiedIcon className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 space-y-2">
            <AndamioText variant="small" className="font-medium text-foreground">{text.success}</AndamioText>
            {result.txHash && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <code className="font-mono">{result.txHash.slice(0, 16)}...{result.txHash.slice(-8)}</code>
                {result.blockchainExplorerUrl && (
                  <a
                    href={result.blockchainExplorerUrl}
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
        </div>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-4" role="alert" aria-live="assertive">
        <div className="flex items-start gap-3">
          <ErrorIcon className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1 space-y-2">
            <AndamioText variant="small" className="font-medium text-foreground">{error ?? text.error}</AndamioText>
            {error && isCollateralError(error) && (
              <AndamioText variant="small" className="text-xs">
                <a
                  href="https://docs.cardano.org/about-cardano/learn/collateral-mechanism"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Learn about collateral <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </AndamioText>
            )}
            {onRetry && (
              <AndamioButton
                variant="link"
                size="sm"
                onClick={onRetry}
                className="h-auto p-0 text-xs"
              >
                Try again
              </AndamioButton>
            )}
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 rounded-full p-1 hover:bg-destructive/10"
              aria-label="Dismiss"
            >
              <CloseIcon className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loading states (fetching, signing, submitting, confirming)
  return (
    <div className="rounded-sm border bg-muted/30 p-4" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <LoadingIcon className="h-5 w-5 animate-spin text-muted-foreground" />
        <div>
          <AndamioText variant="small" className="font-medium text-foreground">{text[state]}</AndamioText>
          {state === "signing" && (
            <AndamioText variant="small" className="text-xs">A signing request is waiting in your wallet</AndamioText>
          )}
          {state === "confirming" && (
            <AndamioText variant="small" className="text-xs text-muted-foreground">This usually takes 20–60 seconds.</AndamioText>
          )}
        </div>
      </div>
    </div>
  );
}
