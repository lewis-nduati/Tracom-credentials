/**
 * Global Transaction Watcher Store
 *
 * Vanilla Zustand store (no React dependency) that manages SSE/polling
 * connections for all in-flight transactions. Survives React component
 * unmounts because it lives at module level.
 *
 * ## Why This Exists (Issue #204)
 *
 * When a user navigates away during the 20-90s Cardano TX confirmation
 * window, the per-component `useTxStream` hook unmounts, killing the SSE
 * connection. The user never learns their transaction succeeded.
 *
 * This store keeps SSE/polling connections alive regardless of which page
 * the user is on, and fires toast notifications when transactions complete.
 *
 * ## Subscriber-Aware Toasting
 *
 * Each transaction tracks a `subscriberCount`. When a component's
 * `useTxStream` is mounted, it increments the count; on unmount it
 * decrements. On terminal state:
 * - subscriberCount > 0 → component handles its own toast (existing behavior)
 * - subscriberCount === 0 → store fires the fallback toast
 *
 * @see src/hooks/tx/use-tx-stream.ts - Per-component hook that subscribes
 * @see src/hooks/tx/use-transaction.ts - Registers TXs with this store
 * @see src/components/providers/tx-watcher-provider.tsx - JWT sync bridge
 */

import React from "react";
import { createStore } from "zustand/vanilla";
import { toast } from "sonner";
import { LoadingIcon } from "~/components/icons";
import type { TxState, TxStatus } from "~/hooks/tx/use-tx-watcher";
import { TERMINAL_STATES } from "~/hooks/tx/use-tx-watcher";
import type {
  TxStateEvent,
  TxStateChangeEvent,
  TxCompleteEvent,
} from "~/types/tx-stream";
import type { TxRecoveryContext } from "~/types/tx-recovery";
import { parseSSEChunk } from "~/lib/sse-parser";
import { readSSEUntilIdle } from "~/lib/sse-idle-reader";
import { pollUntilTerminal, BUDGET_404_REASON } from "~/lib/tx-polling-fallback";
import { runIndexerFallback } from "~/lib/tx-indexer-fallback";
import { useCelebrationStore } from "./celebration-store";

// =============================================================================
// Constants
// =============================================================================

const STREAM_PROXY_BASE = "/api/gateway-stream/api/v2";

/** Transaction types that trigger celebration UI on success */
const MOMENTS_OF_COMMITMENT = [
  "GLOBAL_GENERAL_ACCESS_TOKEN_MINT",
  "INSTANCE_COURSE_CREATE",
  "INSTANCE_PROJECT_CREATE",
  "COURSE_STUDENT_CREDENTIAL_CLAIM",
  "PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM",
] as const;

/** Spinner icon for dismissible loading toasts (toast.loading doesn't support closeButton) */
const loadingSpinner = React.createElement(LoadingIcon, { className: "size-4 animate-spin" });

/** Remove completed transactions from the map after this delay */
const CLEANUP_DELAY_MS = 60_000;

/**
 * If a TX stays in "confirmed" state (on-chain) without reaching "updated"
 * (DB synced) for this duration, treat it as stalled. This covers the case
 * where the SSE `complete` event is missed due to network issues.
 */
const CONFIRMED_TIMEOUT_MS = 30_000;

/**
 * Maximum interval between SSE chunks before we treat the connection as
 * silently stalled and hand off to the polling fallback. Without this, the
 * gateway can accept the SSE connection and then never send a byte (most
 * likely on the on-load recovery path when the gateway's `pendingTx` cache
 * entry has expired) — the read loop would block in `await reader.read()`
 * forever, defeating the 404 budget and indexer fallback that exist to
 * defend exactly this case.
 *
 * Reset on every received chunk including SSE comments / heartbeats.
 */
const SSE_IDLE_TIMEOUT_MS = 20_000;

/** Maximum age before a transaction entry is considered stale */
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour (Cardano TTL max)

// =============================================================================
// Types
// =============================================================================

export interface TxToastConfig {
  /** Toast title on success (e.g., "Course Created!") */
  successTitle: string;
  /** Toast description on success */
  successDescription: string;
  /** Toast title on error */
  errorTitle: string;
  /** Optional error description (falls back to status.last_error) */
  errorDescription?: string;
}

export interface WatchedTransaction {
  txHash: string;
  txType: string;
  status: TxStatus | null;
  isTerminal: boolean;
  /** Number of mounted useTxStream hooks watching this TX */
  subscriberCount: number;
  toastConfig: TxToastConfig;
  /**
   * Optional entity context used by the indexer-fallback path when polling
   * terminates on the 404 budget. Only supplied for TX types whose commitment
   * state is queryable via a GET endpoint.
   * @see src/lib/tx-indexer-fallback.ts
   */
  recoveryContext?: TxRecoveryContext;
  registeredAt: number;
  /** @internal AbortController for the SSE/polling connection */
  _abortController: AbortController | null;
  /** @internal Timer ID for confirmed-state timeout (#449) */
  _confirmedTimeout: ReturnType<typeof setTimeout> | null;
}

interface TxWatcherState {
  transactions: Map<string, WatchedTransaction>;
  jwt: string | null;
}

interface TxWatcherActions {
  /** Register a new transaction for global watching. Idempotent. */
  register: (
    txHash: string,
    txType: string,
    toastConfig: TxToastConfig,
    recoveryContext?: TxRecoveryContext
  ) => void;
  /** Remove a transaction from the watch list */
  unregister: (txHash: string) => void;
  /** Update the JWT used for authenticated requests */
  updateJwt: (jwt: string | null) => void;
  /** Increment subscriber count (called by useTxStream on mount) */
  incrementSubscriber: (txHash: string) => void;
  /** Decrement subscriber count (called by useTxStream on unmount) */
  decrementSubscriber: (txHash: string) => void;
  /** Get a watched transaction by hash */
  getWatchedTx: (txHash: string) => WatchedTransaction | undefined;
  /** Remove stale/expired transaction entries */
  cleanup: () => void;
  /** Clear all transactions (e.g., on logout) */
  clearAll: () => void;
}

export type TxWatcherStore = TxWatcherState & TxWatcherActions;

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Create a fetch wrapper that adds JWT Authorization header.
 * Used for polling fallback (SSE proxy handles auth via the header too).
 */
function makeAuthFetch(
  jwt: string | null
): (url: string, init?: RequestInit) => Promise<Response> {
  return (url: string, init: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string> | undefined),
    };
    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }
    return fetch(url, { ...init, headers });
  };
}

/**
 * Convert SSE event data to TxStatus shape.
 */
function toTxStatus(
  txHash: string,
  state: TxState,
  extra?: Partial<TxStatus>
): TxStatus {
  return {
    tx_hash: txHash,
    tx_type: extra?.tx_type ?? "",
    state,
    retry_count: extra?.retry_count ?? 0,
    confirmed_at: extra?.confirmed_at,
    last_error: extra?.last_error,
  };
}

/**
 * Update a transaction entry in the store's map (immutable update).
 */
function updateTxEntry(
  get: () => TxWatcherState,
  set: (partial: Partial<TxWatcherState>) => void,
  txHash: string,
  update: Partial<WatchedTransaction>
): void {
  const { transactions } = get();
  const entry = transactions.get(txHash);
  if (!entry) return;

  const next = new Map(transactions);
  next.set(txHash, { ...entry, ...update });
  set({ transactions: next });
}

/**
 * Handle a transaction reaching a terminal state.
 * Fires toast if no component is subscribed, cleans up connection.
 */
function handleTerminal(
  txHash: string,
  finalStatus: TxStatus,
  get: () => TxWatcherState,
  set: (partial: Partial<TxWatcherState>) => void
): void {
  const { transactions } = get();
  const entry = transactions.get(txHash);
  if (!entry) return;

  // Idempotency guard: if a terminal was already processed (e.g., SSE `complete`
  // fired just before the polling-fallback terminal, or the indexer fallback
  // resolved after the 404-budget terminal was already forwarded), silently
  // drop the second call. Without this, duplicate terminal toasts fire and the
  // celebration store re-triggers. Warn in dev so unexpected re-entry surfaces.
  if (entry.isTerminal) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[TxWatcherStore] handleTerminal called twice for ${txHash} — suppressing duplicate`
      );
    }
    return;
  }

  // Strip any internal discriminator (e.g., __reason from the polling fallback)
  // before persisting or rendering. The discriminator must never reach the UI
  // or storage (see tx-polling-fallback.ts BUDGET_404_REASON).
  const sanitizedStatus: TxStatus = { ...finalStatus };
  delete sanitizedStatus.__reason;

  // Clear confirmed-state timeout
  if (entry._confirmedTimeout) clearTimeout(entry._confirmedTimeout);

  // Mark as terminal and clear connection/timer refs
  updateTxEntry(get, set, txHash, {
    status: sanitizedStatus,
    isTerminal: true,
    _abortController: null,
    _confirmedTimeout: null,
  });

  // Always dismiss the loading toast first. This is a no-op if the user
  // already dismissed it manually. Firing a NEW toast (without id) ensures
  // the success/error notification always appears, even if the loading
  // toast was dismissed — the user still sees the pending TX indicator
  // until the terminal toast fires.
  toast.dismiss(txHash);

  // Trigger Celebration for "Moments of Commitment"
  if (
    finalStatus.state === "updated" &&
    MOMENTS_OF_COMMITMENT.includes(entry.txType as (typeof MOMENTS_OF_COMMITMENT)[number])
  ) {
    useCelebrationStore.getState().trigger({
      title: entry.toastConfig.successTitle,
      description: entry.toastConfig.successDescription,
    });
  }

  // Only fire terminal toast if no component is currently mounted and
  // handling it. When subscriberCount > 0, the component fires its own toast.
  const currentEntry = get().transactions.get(txHash);
  if (currentEntry?.subscriberCount === 0) {
    if (finalStatus.state === "updated") {
      toast.success(entry.toastConfig.successTitle, {
        description: entry.toastConfig.successDescription,
        duration: 5000,
      });
    } else if (
      finalStatus.state === "confirmed" &&
      finalStatus.last_error
    ) {
      // Stalled: confirmed on-chain but DB sync timed out (#449)
      toast.success("Transaction Confirmed", {
        description:
          "Your transaction is on the blockchain. Database sync is delayed — refresh to see updated data.",
        duration: 8000,
      });
    } else if (
      finalStatus.state === "failed" ||
      finalStatus.state === "expired"
    ) {
      toast.error(entry.toastConfig.errorTitle, {
        description:
          entry.toastConfig.errorDescription ??
          finalStatus.last_error ??
          "Please try again or contact support.",
        duration: 10000,
      });
    }
  }

  // Schedule removal from the map
  setTimeout(() => {
    const current = get().transactions;
    if (current.has(txHash)) {
      const updated = new Map(current);
      updated.delete(txHash);
      set({ transactions: updated });
    }
  }, CLEANUP_DELAY_MS);
}

/**
 * Start watching a transaction via SSE with polling fallback.
 * Runs asynchronously — returns immediately.
 */
function startWatching(
  txHash: string,
  jwt: string | null,
  signal: AbortSignal,
  get: () => TxWatcherState,
  set: (partial: Partial<TxWatcherState>) => void
): void {
  const url = `${STREAM_PROXY_BASE}/tx/stream/${txHash}`;
  const headers: Record<string, string> = {};
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }

  void (async () => {
    let reachedTerminal = false;

    try {
      const response = await fetch(url, {
        headers,
        signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body for SSE stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const result = await readSSEUntilIdle({
        reader,
        decoder,
        idleTimeoutMs: SSE_IDLE_TIMEOUT_MS,
        logPrefix: "[TxWatcherStore]",
        onChunk: (decoded) => {
          buffer += decoded;

          // Process complete events (delimited by double newline)
          const lastDoubleNewline = buffer.lastIndexOf("\n\n");
          if (lastDoubleNewline === -1) {
            return { reachedTerminal: false };
          }

          const complete = buffer.slice(0, lastDoubleNewline + 2);
          buffer = buffer.slice(lastDoubleNewline + 2);

          const events = parseSSEChunk(complete);
          let chunkReachedTerminal = false;

          for (const sseEvent of events) {
            if (!sseEvent.data) continue;

            try {
              switch (sseEvent.event) {
                case "state": {
                  const payload = JSON.parse(sseEvent.data) as TxStateEvent;
                  const txStatus = toTxStatus(txHash, payload.state, {
                    tx_type: payload.tx_type,
                    retry_count: payload.retry_count,
                    confirmed_at: payload.confirmed_at,
                    last_error: payload.last_error,
                  });
                  updateTxEntry(get, set, txHash, { status: txStatus });

                  // If already terminal on connect
                  if (TERMINAL_STATES.includes(payload.state)) {
                    chunkReachedTerminal = true;
                    handleTerminal(txHash, txStatus, get, set);
                  }
                  break;
                }
                case "state_change": {
                  const payload = JSON.parse(
                    sseEvent.data
                  ) as TxStateChangeEvent;
                  const { transactions } = get();
                  const entry = transactions.get(txHash);
                  const txStatus = entry?.status
                    ? { ...entry.status, state: payload.new_state }
                    : toTxStatus(txHash, payload.new_state);
                  updateTxEntry(get, set, txHash, { status: txStatus });

                  // Update the loading toast with more specific message
                  if (payload.new_state === "confirmed") {
                    toast("Confirmed on blockchain. Updating database...", {
                      id: txHash,
                      icon: loadingSpinner,
                      duration: Infinity,
                    });

                    // Start confirmed-state timeout (#449): if "updated" doesn't
                    // arrive within 30s, treat as stalled and call handleTerminal.
                    // Guard: only one timer per TX (SSE reconnects may replay this event)
                    const confirmedEntry = get().transactions.get(txHash);
                    if (confirmedEntry && !confirmedEntry._confirmedTimeout) {
                      const timeoutId = setTimeout(() => {
                        const { transactions: txs } = get();
                        const tx = txs.get(txHash);
                        if (!tx || tx.isTerminal) return;

                        console.warn(
                          `[TxWatcherStore] TX ${txHash} stuck in "confirmed" for ${CONFIRMED_TIMEOUT_MS / 1000}s — treating as stalled`
                        );

                        const stalledStatus = toTxStatus(txHash, "confirmed", {
                          ...tx.status,
                          last_error:
                            "Transaction confirmed on-chain but the platform update timed out. Your data may still sync — please refresh shortly.",
                        });
                        handleTerminal(txHash, stalledStatus, get, set);
                      }, CONFIRMED_TIMEOUT_MS);

                      updateTxEntry(get, set, txHash, {
                        _confirmedTimeout: timeoutId,
                      });
                    }
                  }
                  break;
                }
                case "complete": {
                  const payload = JSON.parse(sseEvent.data) as TxCompleteEvent;
                  chunkReachedTerminal = true;
                  const txStatus = toTxStatus(txHash, payload.final_state, {
                    tx_type: payload.tx_type,
                    confirmed_at: payload.confirmed_at,
                    last_error: payload.last_error,
                  });
                  handleTerminal(txHash, txStatus, get, set);
                  break;
                }
                default:
                  // Unknown event type - ignore (could be heartbeat/comment)
                  break;
              }
            } catch (parseErr) {
              console.warn(
                "[TxWatcherStore] Failed to parse SSE event data:",
                parseErr
              );
            }
          }

          return { reachedTerminal: chunkReachedTerminal };
        },
      });

      reachedTerminal = result.reachedTerminal;

      if (result.kind === "aborted") return;

      // Stream ended (cleanly OR via idle-timeout) without terminal event —
      // fall back to polling. Single call site preserves the existing handoff.
      if (!reachedTerminal && !signal.aborted) {
        if (result.kind === "idle-timeout") {
          console.warn(
            `[TxWatcherStore] SSE idle for ${SSE_IDLE_TIMEOUT_MS}ms, falling back to polling`
          );
        } else {
          console.warn(
            "[TxWatcherStore] SSE stream ended without terminal event, falling back to polling"
          );
        }
        startPollingFallback(txHash, get, set, signal);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;

      console.warn(
        "[TxWatcherStore] SSE failed, falling back to polling:",
        err instanceof Error ? err.message : String(err)
      );
      // Fall back to polling
      if (!signal.aborted) {
        startPollingFallback(txHash, get, set, signal);
      }
    }
  })();
}

/**
 * Start polling fallback when SSE fails or stream ends prematurely.
 */
function startPollingFallback(
  txHash: string,
  get: () => TxWatcherState,
  set: (partial: Partial<TxWatcherState>) => void,
  signal: AbortSignal
): void {
  const jwtAtStart = get().jwt;
  const authFetch = makeAuthFetch(jwtAtStart);

  void pollUntilTerminal(
    txHash,
    authFetch,
    {
      onStatus: (pollStatus) => {
        updateTxEntry(get, set, txHash, { status: pollStatus });
      },
      onComplete: (pollStatus) => {
        void handlePollingTerminal(txHash, pollStatus, jwtAtStart, get, set);
      },
      onError: (pollError) => {
        console.error("[TxWatcherStore] Polling error:", pollError.message);
      },
    },
    { interval: 6_000 },
    signal
  );
}

/**
 * Route a polling-produced terminal to the indexer fallback when appropriate,
 * then call handleTerminal exactly once with the resolved or original status.
 *
 * Runs the fallback only when:
 *   1. The terminal carries __reason === "budget_404" (from tx-polling-fallback).
 *   2. The watched entry has a recoveryContext.
 *   3. The JWT hasn't changed since we started polling (guards against
 *      wallet-switch / logout races where the stale JWT closure would leak
 *      the prior session's auth into the fallback fetch).
 *
 * Otherwise, handleTerminal fires directly with the original status.
 */
async function handlePollingTerminal(
  txHash: string,
  pollStatus: TxStatus,
  jwtAtStart: string | null,
  get: () => TxWatcherState,
  set: (partial: Partial<TxWatcherState>) => void,
): Promise<void> {
  const entry = get().transactions.get(txHash);
  const shouldRunFallback =
    pollStatus.__reason === BUDGET_404_REASON &&
    entry?.recoveryContext !== undefined &&
    get().jwt === jwtAtStart &&
    get().jwt !== null;

  if (!shouldRunFallback || !entry?.recoveryContext) {
    handleTerminal(txHash, pollStatus, get, set);
    return;
  }

  // Use jwtAtStart (already confirmed current via the guard above) rather than
  // re-reading get().jwt — a second read here could pick up a rotated JWT if
  // a refresh or wallet-switch fires between the guard and this line.
  const authFetch = makeAuthFetch(jwtAtStart);

  let resolution: Awaited<ReturnType<typeof runIndexerFallback>>;
  try {
    resolution = await runIndexerFallback(entry.recoveryContext, txHash, authFetch);
  } catch (err) {
    console.warn("[TxWatcherStore] Indexer fallback threw:", err);
    handleTerminal(txHash, pollStatus, get, set);
    return;
  }

  if (resolution.kind === "unresolved") {
    handleTerminal(txHash, pollStatus, get, set);
    return;
  }

  // Resolved — build a clean TxStatus from the fallback result (without the
  // internal __reason discriminator) and let handleTerminal fire the single
  // final toast.
  const resolvedStatus: TxStatus = {
    tx_hash: txHash,
    tx_type: pollStatus.tx_type,
    state: resolution.state,
    retry_count: pollStatus.retry_count,
    last_error: resolution.last_error,
  };
  handleTerminal(txHash, resolvedStatus, get, set);
}

// =============================================================================
// Store
// =============================================================================

/**
 * @internal — exported solely so tx-watcher-store.test.ts can drive the
 * polling-terminal and idempotency paths without booting the SSE loop.
 * Do NOT call from production code; route polling terminals through
 * register()'s startWatching → startPollingFallback flow instead.
 */
export const __test_only__handlePollingTerminal = handlePollingTerminal;
/** @internal — same caveat as `__test_only__handlePollingTerminal`. */
export const __test_only__handleTerminal = handleTerminal;

export const txWatcherStore = createStore<TxWatcherStore>()((set, get) => ({
  // State
  transactions: new Map(),
  jwt: null,

  // Actions
  register: (txHash, txType, toastConfig, recoveryContext) => {
    const { transactions, jwt } = get();

    // Idempotent — skip if already watching this TX
    if (transactions.has(txHash)) return;

    const controller = new AbortController();

    const entry: WatchedTransaction = {
      txHash,
      txType,
      status: null,
      isTerminal: false,
      subscriberCount: 0,
      toastConfig,
      recoveryContext,
      registeredAt: Date.now(),
      _abortController: controller,
      _confirmedTimeout: null,
    };

    const next = new Map(transactions);
    next.set(txHash, entry);
    set({ transactions: next });

    // Start watching (SSE with polling fallback)
    startWatching(txHash, jwt, controller.signal, get, set);
  },

  unregister: (txHash) => {
    const { transactions } = get();
    const entry = transactions.get(txHash);
    if (!entry) return;

    if (entry._confirmedTimeout) clearTimeout(entry._confirmedTimeout);
    entry._abortController?.abort();
    toast.dismiss(txHash);

    const next = new Map(transactions);
    next.delete(txHash);
    set({ transactions: next });
  },

  updateJwt: (jwt) => {
    set({ jwt });
  },

  incrementSubscriber: (txHash) => {
    const { transactions } = get();
    const entry = transactions.get(txHash);
    if (!entry) return;

    const next = new Map(transactions);
    next.set(txHash, {
      ...entry,
      subscriberCount: entry.subscriberCount + 1,
    });
    set({ transactions: next });
  },

  decrementSubscriber: (txHash) => {
    const { transactions } = get();
    const entry = transactions.get(txHash);
    if (!entry) return;

    const next = new Map(transactions);
    next.set(txHash, {
      ...entry,
      subscriberCount: Math.max(0, entry.subscriberCount - 1),
    });
    set({ transactions: next });
  },

  getWatchedTx: (txHash) => {
    return get().transactions.get(txHash);
  },

  cleanup: () => {
    const { transactions } = get();
    const now = Date.now();
    const next = new Map(transactions);
    let changed = false;

    for (const [hash, entry] of next) {
      if (now - entry.registeredAt > MAX_AGE_MS) {
        if (entry._confirmedTimeout) clearTimeout(entry._confirmedTimeout);
        entry._abortController?.abort();
        next.delete(hash);
        changed = true;
      }
    }

    if (changed) {
      set({ transactions: next });
    }
  },

  clearAll: () => {
    const { transactions } = get();

    // Abort all active connections and clear timers
    for (const entry of transactions.values()) {
      if (entry._confirmedTimeout) clearTimeout(entry._confirmedTimeout);
      entry._abortController?.abort();
      toast.dismiss(entry.txHash);
    }

    set({ transactions: new Map() });
  },
}));
