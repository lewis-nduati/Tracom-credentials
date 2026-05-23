/**
 * useSponsoredTransaction Hook
 *
 * Handles the sponsored access-token migration transaction.
 * Routes through /api/sponsor-migrate which builds the tx using
 * sponsor wallet UTxOs (so the user pays no fee).
 *
 * Returns the same state/result interface as useTransaction so existing
 * UI components (TransactionButton, TransactionStatus) work unchanged.
 */

import { useState, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import { toast } from "sonner";
import { env } from "~/env";
import { txLogger } from "~/lib/tx-logger";
import { getTransactionExplorerUrl } from "~/lib/constants";
import { getTransactionUI } from "~/config/transaction-ui";
import { registerTransaction, getGatewayTxType } from "~/hooks/tx/use-tx-watcher";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { txWatcherStore } from "~/stores/tx-watcher-store";
import type {
  SimpleTransactionState,
  SimpleTransactionResult,
} from "~/hooks/tx/use-transaction";

interface SponsoredMigrateConfig {
  alias: string;
  onSuccess?: (result: SimpleTransactionResult) => void | Promise<void>;
  onError?: (error: Error) => void;
}

export function useSponsoredTransaction() {
  const { wallet, connected } = useWallet();
  const { jwt } = useAndamioAuth();
  const [state, setState] = useState<SimpleTransactionState>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<SimpleTransactionResult | null>(null);

  const execute = useCallback(
    async (config: SponsoredMigrateConfig) => {
      const { alias, onSuccess, onError } = config;
      const txType = "GLOBAL_USER_ACCESS_TOKEN_CLAIM" as const;
      const ui = getTransactionUI(txType);

      setError(null);
      setResult(null);

      try {
        if (!connected || !wallet) {
          throw new Error("Wallet not connected");
        }

        // Step 1: Request unsigned CBOR from our API route
        // (API builds tx using sponsor wallet's UTxOs)
        setState("fetching");

        txLogger.buildRequest(txType, "/api/sponsor-migrate", "POST", {
          alias,
        });

        const response = await fetch("/api/sponsor-migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias }),
        });

        if (!response.ok) {
          const errorData = (await response
            .json()
            .catch(() => ({}))) as Record<string, unknown>;
          const errorMsg =
            (errorData.error as string) ??
            `Sponsorship error: ${response.status}`;
          throw new Error(errorMsg);
        }

        const data = (await response.json()) as Record<string, unknown>;
        const unsignedTx = data.unsigned_tx as string | undefined;

        if (!unsignedTx) {
          throw new Error("No transaction returned by API");
        }

        txLogger.buildResult(txType, true, data);

        // Step 2: User signs the CBOR (partial sign since sponsor already signed)
        setState("signing");
        const signedTx = await wallet.signTx(unsignedTx, true);

        // Step 3: Submit to blockchain
        setState("submitting");
        const txHash = await wallet.submitTx(signedTx);

        const explorerUrl = getTransactionExplorerUrl(
          txHash,
          env.NEXT_PUBLIC_CARDANO_NETWORK,
        );
        txLogger.txSubmitted(txType, txHash, explorerUrl);

        // Step 4: Register with gateway for on-chain confirmation tracking
        if (ui.requiresOnChainConfirmation) {
          try {
            const gatewayTxType = getGatewayTxType(txType);
            await registerTransaction(txHash, gatewayTxType, jwt);
          } catch (regError) {
            console.warn(
              "[sponsored-migrate] Failed to register TX:",
              regError,
            );
          }

          txWatcherStore.getState().register(txHash, txType, {
            successTitle: ui.successInfo,
            successDescription: "Transaction confirmed and database updated.",
            errorTitle: "Transaction Failed",
          });
        }

        // Step 5: Success
        setState("success");

        const txResult: SimpleTransactionResult = {
          txHash,
          success: true,
          blockchainExplorerUrl: explorerUrl,
          apiResponse: data,
          requiresDBUpdate: ui.requiresDBUpdate,
          requiresOnChainConfirmation: !!ui.requiresOnChainConfirmation,
        };
        setResult(txResult);

        toast.success(ui.successInfo, {
          description: "Sponsored transaction submitted to blockchain!",
          action: explorerUrl
            ? {
                label: "View",
                onClick: () => window.open(explorerUrl, "_blank"),
              }
            : undefined,
        });

        await onSuccess?.(txResult);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[sponsored-migrate] Transaction failed:", error);
        txLogger.txError(txType, error);

        setError(error);
        setState("error");

        toast.error("Transaction Failed", { description: error.message });
        onError?.(error);
      }
    },
    [connected, wallet, jwt],
  );

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setResult(null);
  }, []);

  return {
    state,
    error,
    result,
    execute,
    reset,
    isIdle: state === "idle",
    isFetching: state === "fetching",
    isSigning: state === "signing",
    isSubmitting: state === "submitting",
    isSuccess: state === "success",
    isError: state === "error",
    isLoading: ["fetching", "signing", "submitting"].includes(state),
  };
}
