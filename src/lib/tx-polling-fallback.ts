/**
 * Transaction Polling Fallback
 *
 * Standalone polling function used as a fallback when SSE streaming is unavailable.
 * Polls the gateway TX status endpoint at regular intervals until a terminal state
 * is reached.
 *
 * @see src/hooks/tx/use-tx-stream.ts - Primary consumer (fallback path)
 * @see src/hooks/tx/use-tx-watcher.ts - Original polling hook (for reference)
 */

import { GATEWAY_API_BASE } from "~/lib/api-utils";
import type { TxState, TxStatus } from "~/hooks/tx/use-tx-watcher";

const TERMINAL_STATES: TxState[] = ["updated", "failed", "expired"];

export interface PollCallbacks {
  /** Called on each successful status check */
  onStatus?: (status: TxStatus) => void;
  /** Called when a terminal state is reached */
  onComplete?: (status: TxStatus) => void;
  /** Called on polling errors */
  onError?: (error: Error) => void;
}

export interface PollOptions {
  /** Polling interval in ms (default: 6000) */
  interval?: number;
  /** Maximum number of polls before giving up (default: 150 = ~15 min at 6s intervals) */
  maxPolls?: number;
}

/**
 * Poll the gateway TX status endpoint until a terminal state is reached.
 *
 * Returns the final TxStatus when a terminal state is reached, or null if
 * polling was aborted via the AbortSignal.
 *
 * @param txHash - Transaction hash to poll
 * @param authenticatedFetch - Fetch function with auth headers
 * @param callbacks - Event callbacks
 * @param options - Polling configuration
 * @param signal - AbortSignal to cancel polling
 * @returns Final TxStatus or null if aborted
 */
/**
 * Max consecutive polls seeing "confirmed" + last_error before treating as stalled.
 * At 6s intervals, 5 polls = 30s — enough time for the gateway to retry if it's going to.
 */
const STALLED_THRESHOLD = 5;

/**
 * Max consecutive fetch errors before treating gateway as unreachable.
 * At 6s intervals, 10 errors ≈ 60s — matches the "20–60 seconds" message shown to users.
 */
const MAX_CONSECUTIVE_ERRORS = 10;

/**
 * Max consecutive 404 responses before treating the TX as permanently untracked
 * by the gateway (pendingTx cache missing entirely). At 6s intervals, 5 polls
 * ≈ 30s — longer than the normal post-register cache-visibility lag but short
 * enough to avoid dead-ending the user for minutes on a gateway the TX hash
 * was never registered with. See issue #494.
 */
const MAX_CONSECUTIVE_404S = 5;

/**
 * Internal sentinel for the 404-budget terminal so the watcher store can
 * distinguish it from other synthetic terminals and route to the indexer
 * fallback before firing handleTerminal.
 *
 * The consumer strips this field before rendering; it must never reach the UI.
 * @internal
 */
export const BUDGET_404_REASON = "budget_404" as const;

export async function pollUntilTerminal(
  txHash: string,
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>,
  callbacks: PollCallbacks = {},
  options: PollOptions = {},
  signal?: AbortSignal
): Promise<TxStatus | null> {
  const { interval = 6_000, maxPolls = 150 } = options;
  let stalledCount = 0;
  let consecutiveErrors = 0;
  let consecutive404s = 0;

  for (let i = 0; i < maxPolls; i++) {
    if (signal?.aborted) return null;

    // Wait before polling (except first iteration - check immediately)
    if (i > 0) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(resolve, interval);
        signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timeout);
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true }
        );
      }).catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        throw err;
      });

      if (signal?.aborted) return null;
    }

    try {
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/tx/status/${txHash}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          // TX not registered yet - expected briefly after submit.
          // Gateway is reachable though, so reset the error counter.
          consecutiveErrors = 0;
          consecutive404s++;

          // Budget exceeded: the pendingTx cache almost certainly doesn't have
          // this txHash (issue #494). Return a synthetic terminal with an
          // internal discriminator so the store can route to the indexer
          // fallback before firing handleTerminal.
          if (consecutive404s >= MAX_CONSECUTIVE_404S) {
            console.warn(
              `[TxPolling] TX ${txHash} returned 404 on ${consecutive404s} consecutive polls — treating as untracked`
            );
            const budgetStatus: TxStatus = {
              tx_hash: txHash,
              tx_type: "",
              state: "failed",
              retry_count: 0,
              last_error:
                "We can't find this transaction in the gateway. It may have submitted successfully to the blockchain — reload this page to check.",
              __reason: "budget_404",
            };
            callbacks.onComplete?.(budgetStatus);
            return budgetStatus;
          }

          continue;
        }
        throw new Error(`Failed to get TX status: ${response.status}`);
      }

      // Successful response — reset error counters
      consecutiveErrors = 0;
      consecutive404s = 0;

      const status = (await response.json()) as TxStatus;
      callbacks.onStatus?.(status);

      if (TERMINAL_STATES.includes(status.state)) {
        callbacks.onComplete?.(status);
        return status;
      }

      // Detect stalled TX: confirmed on-chain but DB update keeps failing.
      // The gateway retries with exponential backoff, but if it exhausts retries
      // it stays in "confirmed" forever instead of transitioning to "failed".
      if (status.state === "confirmed" && status.last_error) {
        stalledCount++;
        if (stalledCount >= STALLED_THRESHOLD) {
          console.warn(
            `[TxPolling] TX ${txHash} stalled in "confirmed" with error after ${stalledCount} polls:`,
            status.last_error
          );
          // Treat as terminal — the TX confirmed on-chain but DB sync failed
          callbacks.onComplete?.(status);
          return status;
        }
      } else {
        stalledCount = 0;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return null;
      const error = err instanceof Error ? err : new Error(String(err));
      callbacks.onError?.(error);

      consecutiveErrors++;
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.warn(
          `[TxPolling] Gateway unreachable after ${consecutiveErrors} consecutive errors for ${txHash}`
        );
        const gatewayErrorStatus: TxStatus = {
          tx_hash: txHash,
          tx_type: "",
          state: "failed",
          retry_count: 0,
          last_error:
            "Gateway temporarily unreachable. Your transaction was submitted to the blockchain and may still confirm. Please refresh the page later.",
        };
        callbacks.onComplete?.(gatewayErrorStatus);
        return gatewayErrorStatus;
      }
    }
  }

  // Exceeded max polls — create synthetic terminal state
  const timeoutStatus: TxStatus = {
    tx_hash: txHash,
    tx_type: "",
    state: "failed",
    retry_count: 0,
    last_error:
      "Transaction confirmation timed out. Your transaction was submitted and may still confirm. Please refresh the page later.",
  };
  callbacks.onComplete?.(timeoutStatus);
  return timeoutStatus;
}
