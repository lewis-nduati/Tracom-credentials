/**
 * TransactionButton Component
 *
 * Reusable button for initiating Cardano transactions.
 * Shows loading states and transaction status during the flow.
 *
 * Will be extracted to @andamio/transactions package.
 */

import React from "react";
import { AndamioButton, type AndamioButtonProps } from "~/components/andamio/andamio-button";
import { LoadingIcon } from "~/components/icons";
import type { TransactionState } from "~/types/transaction";

export interface TransactionButtonProps extends Omit<AndamioButtonProps, "isLoading"> {
  /**
   * Current transaction state
   */
  txState: TransactionState;

  /**
   * Text to display for each transaction state
   */
  stateText?: Partial<Record<TransactionState, string>>;

  /**
   * Whether to disable the button during transaction
   * Default: true
   */
  disableDuringTx?: boolean;
}

const DEFAULT_STATE_TEXT: Record<TransactionState, string> = {
  idle: "Confirm",
  fetching: "Preparing...",
  signing: "Sign in Your Wallet",
  submitting: "Submitting...",
  confirming: "Confirming...",
  success: "Done",
  error: "Something Went Wrong",
};

/**
 * TransactionButton - Button component for transaction execution
 *
 * @example
 * ```tsx
 * const { state, execute } = useTransaction();
 *
 * <TransactionButton
 *   txState={state}
 *   onClick={() => execute({ endpoint: "/tx/mint-token", params: {...} })}
 * >
 *   Mint Access Token
 * </TransactionButton>
 * ```
 */
export function TransactionButton({
  txState,
  stateText = {},
  disableDuringTx = true,
  children,
  ...props
}: TransactionButtonProps) {
  const isLoading = txState === "fetching" || txState === "signing" || txState === "submitting" || txState === "confirming";
  const isDisabled = disableDuringTx && (isLoading || txState === "success");

  // Merge default state text with custom state text
  const text = { ...DEFAULT_STATE_TEXT, ...stateText };

  // Determine button text based on state
  const getButtonText = () => {
    if (txState !== "idle") {
      return text[txState];
    }
    return children ?? text.idle;
  };

  // Determine button variant based on state
  const getVariant = (): AndamioButtonProps["variant"] => {
    if (txState === "success") return "default";
    if (txState === "error") return "destructive";
    return props.variant ?? "default";
  };

  return (
    <AndamioButton
      {...props}
      variant={getVariant()}
      disabled={isDisabled || props.disabled}
      isLoading={isLoading}
      leftIcon={isLoading ? <LoadingIcon className="h-4 w-4 animate-spin" /> : props.leftIcon}
    >
      {getButtonText()}
    </AndamioButton>
  );
}
