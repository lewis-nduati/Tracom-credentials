/**
 * useTransaction Hook
 *
 * Primary transaction hook for the V2 gateway auto-confirmation flow.
 * The gateway handles all DB updates automatically via TxTypeRegistry.
 *
 * ## TX Lifecycle
 *
 * 1. **BUILD**: POST to `/api/v2/tx/*` endpoint → get unsigned CBOR
 * 2. **SIGN**: User signs with wallet
 * 3. **SUBMIT**: Submit to blockchain → get txHash
 * 4. **REGISTER**: POST to `/api/v2/tx/register` → gateway starts monitoring
 * 5. **(auto) CONFIRM**: Gateway monitors and updates DB automatically
 *
 * ## Tracking Confirmation
 *
 * After execution, use `useTxStream(result?.txHash)` for real-time confirmation:
 *
 * ```tsx
 * const { execute, result } = useTransaction();
 * const { status, isSuccess } = useTxStream(result?.txHash);
 *
 * // status.state will be: pending → confirmed → updated
 * ```
 *
 * ## Usage
 *
 * ```tsx
 * import { useTransaction } from "~/hooks/tx/use-transaction";
 * import { useTxStream } from "~/hooks/tx/use-tx-stream";
 *
 * function MintAccessToken() {
 *   const { execute, state, result, reset } = useTransaction();
 *   const { status, isSuccess } = useTxStream(result?.txHash);
 *
 *   const handleMint = async () => {
 *     await execute({
 *       txType: "GLOBAL_GENERAL_ACCESS_TOKEN_MINT",
 *       params: {
 *         initiator_data: walletAddress,
 *         alias: "myalias",
 *       },
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <TransactionButton state={state} onClick={handleMint} />
 *       {status && <div>Gateway status: {status.state}</div>}
 *       {isSuccess && <div>✓ Transaction complete!</div>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @see ~/hooks/use-tx-watcher.ts - TX status polling hook
 * @see ~/config/transaction-ui.ts - UI strings and endpoints
 * @see ~/config/transaction-schemas.ts - Zod validation schemas
 */

import React, { useState, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import { toast } from "sonner";
import { LoadingIcon } from "~/components/icons";
import { env } from "~/env";
import { txLogger } from "~/lib/tx-logger";
import { getTransactionExplorerUrl } from "~/lib/constants";
import {
  type TransactionType,
  TRANSACTION_ENDPOINTS,
  getTransactionUI,
} from "~/config/transaction-ui";
import { validateTxParams, type TxParams } from "~/config/transaction-schemas";
import { registerTransaction, getGatewayTxType } from "~/hooks/tx/use-tx-watcher";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { PROXY_BASE } from "~/lib/gateway";
import { txWatcherStore } from "~/stores/tx-watcher-store";
import { pendingTxRegistrations } from "~/lib/pending-tx-registrations";
import { parseTxErrorMessage } from "~/lib/tx-error-messages";
import type { TxRecoveryContext } from "~/types/tx-recovery";
import { buildWatcherToastConfig } from "~/lib/tx-watcher-toast-config";
import { validateRecoveryContext } from "~/hooks/tx/validate-recovery-context";

export { validateRecoveryContext };

/** Spinner icon for dismissible loading toasts (toast.loading doesn't support closeButton) */
const loadingSpinner = React.createElement(LoadingIcon, { className: "size-4 animate-spin" });

/** Map raw TX/wallet error messages to user-friendly text.
 * Handles wallet SDK errors (user declined) first, then delegates to
 * parseTxErrorMessage for API errors (ACCESS_TOKEN_ERROR, SCRIPT_FAILURE, etc.)
 * and nested JSON extraction. */
function humanizeTxError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("user declined") || lower.includes("user rejected") || lower.includes("user denied")) {
    return "You declined to sign the transaction.";
  }
  return parseTxErrorMessage(message) ?? message;
}

// =============================================================================
// Types
// =============================================================================

/**
 * Transaction states - compatible with TransactionState from ~/types/transaction
 * for seamless use with existing UI components (TransactionButton, TransactionStatus)
 */
export type SimpleTransactionState =
  | "idle"
  | "fetching"   // Building transaction (fetching unsigned CBOR)
  | "signing"
  | "submitting"
  | "success"
  | "error";

/**
 * Transaction result - compatible with TransactionResult from ~/types/transaction
 */
export interface SimpleTransactionResult {
  txHash: string;
  success: boolean;
  blockchainExplorerUrl?: string;
  /** Raw API response (may contain additional fields like course_id, project_id) */
  apiResponse?: Record<string, unknown>;
  /** Whether this TX requires DB updates (determines if polling is needed) */
  requiresDBUpdate: boolean;
  /** Whether this TX is registered for on-chain confirmation tracking */
  requiresOnChainConfirmation: boolean;
}

export interface SimpleTransactionConfig<T extends TransactionType> {
  /** Transaction type from TransactionType union */
  txType: T;
  /** Transaction parameters (validated against schema) */
  params: TxParams[T];
  /** Callback fired on successful submission and registration */
  onSuccess?: (result: SimpleTransactionResult) => void | Promise<void>;
  /** Callback fired on error */
  onError?: (error: Error) => void;
  /** Skip schema validation (use with caution) */
  skipValidation?: boolean;
  /** Optional metadata for TX registration (e.g., course title for instance creation) */
  metadata?: Record<string, string>;
  /**
   * Optional typed entity context. Two consumers read it: the indexer-fallback
   * path on polling timeout, and the R5 precision filter in
   * `assignment-tx-filter.ts`. Supply for:
   * - PROJECT_CONTRIBUTOR_TASK_COMMIT — fallback resolves via contributor commitment GET
   * - COURSE_STUDENT_ASSIGNMENT_COMMIT — fallback resolves via assignment commitment GET
   * - COURSE_STUDENT_CREDENTIAL_CLAIM — no fallback resolver (on-chain credential token
   *   is authoritative); required for the R5 strip-pulse precision filter
   * The `kind` must match the `txType` — mismatches are logged and the context is dropped.
   * @see src/types/tx-recovery.ts
   * @see src/lib/assignment-tx-filter.ts
   */
  recoveryContext?: TxRecoveryContext;
}

interface UnsignedTxResponse {
  unsigned_tx?: string;
  unsignedTxCBOR?: string;
  // Additional fields returned by some endpoints
  course_id?: string;
  project_id?: string;
  slt_hashes?: string[];  // modules/manage endpoint returns affected SLT hashes
  [key: string]: unknown;
}

// =============================================================================
// Hook
// =============================================================================

export function useTransaction() {
  const { wallet, connected } = useWallet();
  const { jwt } = useAndamioAuth();
  const [state, setState] = useState<SimpleTransactionState>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<SimpleTransactionResult | null>(null);

  const execute = useCallback(
    async <T extends TransactionType>(config: SimpleTransactionConfig<T>) => {
      const { txType, params, onSuccess, onError, skipValidation, metadata } = config;
      const ui = getTransactionUI(txType);

      // Validate recoveryContext.kind matches the TX type. Mismatches are a
      // caller bug; drop the context rather than misrouting the indexer fallback.
      const recoveryContext = validateRecoveryContext(txType, config.recoveryContext);

      // Reset state
      setError(null);
      setResult(null);

      try {
        // Step 0: Check wallet connection
        if (!connected || !wallet) {
          throw new Error("Wallet not connected");
        }

        // Step 1: Validate params (part of "fetching" state)
        setState("fetching");
        if (!skipValidation) {
          const validation = validateTxParams(txType, params);
          if (!validation.success) {
            const errorMsg = validation.error.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", ");
            throw new Error(`Invalid parameters: ${errorMsg}`);
          }
        }

        // Step 2: Build transaction (fetch unsigned CBOR)
        const endpoint = TRANSACTION_ENDPOINTS[txType];
        const url = `${PROXY_BASE}${endpoint}`;

        txLogger.buildRequest(txType, url, "POST", params);

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorDetails: string;
          try {
            const errorJson = JSON.parse(errorText) as Record<string, unknown>;
            // ErrorEnvelope shape: {error: {code, message, details}}
            if (
              errorJson.error != null &&
              typeof errorJson.error === "object" &&
              "message" in errorJson.error &&
              typeof (errorJson.error as { message?: unknown }).message === "string"
            ) {
              errorDetails = (errorJson.error as { message: string }).message;
            } else {
              // Legacy flat shape or unknown structure
              const flat = errorJson as { details?: string; message?: string; error?: string };
              errorDetails = flat.details ?? flat.message ?? (typeof flat.error === "string" ? flat.error : null) ?? errorText;
            }
          } catch {
            errorDetails = errorText;
          }
          txLogger.buildResult(txType, false, { status: response.status, error: errorDetails });
          throw new Error(`Transaction API error: ${response.status} - ${errorDetails}`);
        }

        const apiResponse = (await response.json()) as UnsignedTxResponse;
        const unsignedCbor = apiResponse.unsigned_tx ?? apiResponse.unsignedTxCBOR;

        if (!unsignedCbor) {
          txLogger.buildResult(txType, false, { error: "No CBOR in response" });
          throw new Error("No unsigned transaction returned from API");
        }

        txLogger.buildResult(txType, true, apiResponse);

        // Step 3: Sign transaction
        setState("signing");
        const signedTx = await wallet.signTxReturnFullTx(unsignedCbor, true); // partialSign=true for V2

        // Step 4: Submit to blockchain
        setState("submitting");
        const txHash = await wallet.submitTx(signedTx);

        const explorerUrl = getExplorerUrl(txHash);
        txLogger.txSubmitted(txType, txHash, explorerUrl);

        // Step 5: Register with gateway (for TXs that need DB updates OR on-chain confirmation tracking)
        // JWT is optional — gateway only requires X-API-Key (added by proxy).
        // This allows access token mint to be registered before the user has a JWT.
        const shouldRegister = ui.requiresDBUpdate || ui.requiresOnChainConfirmation;
        let registrationSucceeded = false;
        if (shouldRegister) {
          const gatewayTxType = getGatewayTxType(txType);
          try {
            await registerTransaction(txHash, gatewayTxType, jwt, metadata);
            registrationSucceeded = true;
            console.log(`[${txType}] Transaction registered with gateway`);
          } catch (regError) {
            // Registration failed after retries — persist for recovery on next load.
            // Diagnostic details are already logged inside registerTransaction (see issue #494).
            console.warn(`[${txType}] Failed to register TX after retries:`, regError);
            pendingTxRegistrations.add({
              txHash,
              gatewayTxType,
              frontendTxType: txType,
              metadata,
              recoveryContext,
            });
            // Persistent "tracking failed" toast. User action: reload to trigger on-load recovery.
            // Do NOT auto-dismiss — the pending-tx indicator must stay until the user sees it.
            toast("Transaction submitted but tracking failed", {
              id: txHash,
              duration: Infinity,
              description:
                "Your transaction is on the blockchain. Reload this page to retry tracking — the gateway will pick it up then.",
            });
          }

          // Step 5b: Register with global TX watcher store for persistent monitoring.
          // Only start the watcher when registration succeeded — otherwise the store
          // would poll a txHash the gateway has no record of, producing an indefinite
          // 404 loop (issue #494).
          if (registrationSucceeded) {
            txWatcherStore
              .getState()
              .register(txHash, txType, buildWatcherToastConfig(txType), recoveryContext);
          }
        } else {
          console.log(`[${txType}] Pure on-chain TX - skipping registration`);
        }

        // Step 6: Success!
        setState("success");

        const txResult: SimpleTransactionResult = {
          txHash,
          success: true,
          blockchainExplorerUrl: explorerUrl,
          apiResponse: apiResponse as Record<string, unknown>,
          requiresDBUpdate: ui.requiresDBUpdate,
          requiresOnChainConfirmation: !!ui.requiresOnChainConfirmation,
        };
        setResult(txResult);

        // Show persistent toast with txHash ID — the global watcher store will
        // replace this with success/error when the terminal state is reached.
        // Uses toast() with a custom icon instead of toast.loading() because
        // Sonner loading toasts don't support the close button (known issue).
        //
        // Gate on registrationSucceeded: if registration failed, the "tracking failed"
        // toast is already showing with the same txHash id — don't replace it with a
        // misleading "waiting for confirmation" spinner for a TX the client isn't watching.
        if (shouldRegister && registrationSucceeded) {
          toast(ui.successInfo, {
            id: txHash,
            icon: loadingSpinner,
            duration: Infinity,
            description: ui.requiresDBUpdate
              ? "Transaction submitted. Waiting for confirmation..."
              : "Transaction submitted to blockchain!",
          });
        } else if (!shouldRegister) {
          toast.success(ui.successInfo, {
            description: "Transaction submitted to blockchain!",
            action: explorerUrl
              ? {
                  label: "View Transaction",
                  onClick: () => window.open(explorerUrl, "_blank"),
                }
              : undefined,
          });
        }

        // Call success callback
        await onSuccess?.(txResult);
      } catch (err) {
        const rawError = err instanceof Error ? err : new Error(String(err));
        const friendlyMessage = humanizeTxError(rawError.message);
        const error = friendlyMessage !== rawError.message
          ? new Error(friendlyMessage)
          : rawError;
        console.error(`[${txType}] Transaction failed:`, rawError);
        txLogger.txError(txType, rawError);

        setError(error);
        setState("error");

        toast.error("Transaction Failed", {
          description: error.message,
        });

        onError?.(error);
      }
    },
    [connected, wallet, jwt]
  );

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setResult(null);
  }, []);

  return {
    // State
    state,
    error,
    result,

    // Actions
    execute,
    reset,

    // Derived state (for convenience)
    isIdle: state === "idle",
    isFetching: state === "fetching",
    isSigning: state === "signing",
    isSubmitting: state === "submitting",
    isSuccess: state === "success",
    isError: state === "error",
    isLoading: ["fetching", "signing", "submitting"].includes(state),
  };
}

// =============================================================================
// Helpers
// =============================================================================

function getExplorerUrl(txHash: string): string {
  return getTransactionExplorerUrl(txHash, env.NEXT_PUBLIC_CARDANO_NETWORK);
}
