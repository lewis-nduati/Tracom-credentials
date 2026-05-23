/**
 * useTxStream Hook
 *
 * Subscribes to the global TX watcher store for real-time transaction
 * state updates. The store manages SSE connections and polling fallback
 * at the module level, surviving component unmounts.
 *
 * ## Usage
 *
 * ```tsx
 * const { status, isSuccess, isFailed } = useTxStream(txHash);
 *
 * if (isSuccess) {
 *   // Transaction complete, DB updated
 * }
 * ```
 *
 * ## How It Works
 *
 * 1. `useTransaction.execute()` registers the TX with the global store
 * 2. The store opens an SSE connection to `/api/gateway-stream/api/v2/tx/stream/{hash}`
 * 3. This hook subscribes to the store for state updates (read-only)
 * 4. On mount, increments `subscriberCount`; on unmount, decrements it
 * 5. When subscriberCount is 0 (user navigated away), the store fires toasts
 * 6. When subscriberCount > 0 (user on page), the component handles its own toasts
 *
 * ## Confirmed-State Timeout (Issue #449)
 *
 * The store manages a 30-second timeout for TXs stuck in "confirmed" state.
 * If the SSE `complete` event is lost, the store calls `handleTerminal` with
 * a synthetic `last_error`, which this hook picks up as `isStalled: true`.
 *
 * @see ~/stores/tx-watcher-store.ts - Global store managing connections + timeout
 * @see ~/types/tx-stream.ts - SSE event types
 * @see ~/lib/tx-polling-fallback.ts - Polling fallback
 * @see ~/hooks/tx/use-tx-watcher.ts - Original polling-only hook
 */

import { useState, useEffect, useRef } from "react";
import type { TxStatus } from "~/hooks/tx/use-tx-watcher";
import { TERMINAL_STATES } from "~/hooks/tx/use-tx-watcher";
import { txWatcherStore } from "~/stores/tx-watcher-store";

// =============================================================================
// Types
// =============================================================================

export interface UseTxStreamOptions {
  /** Callback when TX reaches terminal state */
  onComplete?: (status: TxStatus) => void;
  /** Callback on stream/polling error */
  onError?: (error: Error) => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Watch a transaction's status via the global TX watcher store.
 *
 * Same consumer API as the previous implementation — can be used as a
 * drop-in replacement in all TX components.
 *
 * @param txHash - Transaction hash to watch (null to disable)
 * @param options - Configuration options
 */
export function useTxStream(
  txHash: string | null,
  options: UseTxStreamOptions = {}
) {
  const [status, setStatus] = useState<TxStatus | null>(null);

  // Refs for callbacks to avoid effect restarts
  const onCompleteRef = useRef(options.onComplete);
  const onErrorRef = useRef(options.onError);
  // Track whether we've already fired onComplete for this txHash
  const completeFiredRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = options.onComplete;
  }, [options.onComplete]);

  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  // Subscribe to store for this txHash
  useEffect(() => {
    if (!txHash) {
      setStatus(null);
      completeFiredRef.current = false;
      return;
    }

    const currentHash = txHash;
    completeFiredRef.current = false;

    // Increment subscriber count so the store knows a component is watching
    txWatcherStore.getState().incrementSubscriber(currentHash);

    // Read initial state if the store already has it
    const existing = txWatcherStore.getState().getWatchedTx(currentHash);
    if (existing?.status) {
      setStatus(existing.status);

      // If already terminal, fire onComplete immediately
      if (existing.isTerminal) {
        completeFiredRef.current = true;
        onCompleteRef.current?.(existing.status);
      }
    }

    // Subscribe to store changes for this txHash
    const unsubscribe = txWatcherStore.subscribe((state) => {
      const tx = state.transactions.get(currentHash);
      if (!tx) return;

      if (tx.status) {
        setStatus(tx.status);

        // Fire onComplete exactly once when terminal state is reached
        if (tx.isTerminal && !completeFiredRef.current) {
          completeFiredRef.current = true;
          onCompleteRef.current?.(tx.status);
        }
      }
    });

    return () => {
      unsubscribe();
      // Decrement subscriber count on unmount
      txWatcherStore.getState().decrementSubscriber(currentHash);
    };
  }, [txHash]);

  // Derived state
  const isStalled =
    status?.state === "confirmed" && !!status.last_error;

  return {
    status,
    /** Whether TX is in a terminal state (or stalled) */
    isTerminal: status
      ? TERMINAL_STATES.includes(status.state) || isStalled
      : false,
    /** Whether TX completed successfully (DB updated, or confirmed on-chain but DB sync stalled) */
    isSuccess: status?.state === "updated" || isStalled,
    /** Whether TX failed */
    isFailed: status?.state === "failed" || status?.state === "expired",
    /** Whether TX confirmed on-chain but gateway DB update is stuck */
    isStalled,
  };
}
