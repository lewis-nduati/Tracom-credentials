// Pure-TS recovery loop extracted from tx-watcher-provider.tsx so it can be unit-tested without a React harness.

import type { PendingTxRegistration } from "~/lib/pending-tx-registrations";
import type { TransactionType } from "~/config/transaction-ui";
import type { TxRecoveryContext } from "~/types/tx-recovery";
import type { TxToastConfig } from "~/stores/tx-watcher-store";

// =============================================================================
// Injection types — every external boundary is parameterized so the recovery
// loop can be tested with fakes.
// =============================================================================

export type RegisterFn = (
  txHash: string,
  gatewayTxType: string,
  jwt: string,
  metadata?: Record<string, string>,
  diagnosticTag?: string,
) => Promise<void>;

export type WatcherRegisterFn = (
  txHash: string,
  txType: TransactionType,
  toastConfig: TxToastConfig,
  recoveryContext?: TxRecoveryContext,
) => void;

export type GetPendingFn = () => PendingTxRegistration[];

export type RemovePendingFn = (txHash: string) => void;

export type BuildToastConfigFn = (txType: TransactionType) => TxToastConfig;

/** Minimal toast surface — accepts the success-shape used by the original IIFE. */
export interface ToastApi {
  success: (
    title: string,
    options?: { description?: string },
  ) => void | string | number;
}

// =============================================================================
// Public API
// =============================================================================

export interface RunPendingTxRecoveryArgs {
  /** Authenticated JWT — required to call registerTransaction. */
  jwt: string;
  /** Bound to `registerTransaction` from `~/hooks/tx/use-tx-watcher`. */
  registerFn: RegisterFn;
  /** Bound to `txWatcherStore.getState().register`. */
  watcherRegister: WatcherRegisterFn;
  /** Bound to `pendingTxRegistrations.getAll`. */
  getPending: GetPendingFn;
  /** Bound to `pendingTxRegistrations.remove`. */
  removePending: RemovePendingFn;
  /** Bound to `buildWatcherToastConfig`. */
  buildToastConfigFn: BuildToastConfigFn;
  /** Bound to the `sonner` `toast` import (only `.success` is used). */
  toast: ToastApi;
  /**
   * Called once per entry whose registerFn rejected. Lets the caller reset
   * its session guard (e.g., `recoveryRanRef.current = false`) so a later
   * mount can retry without waiting for the 2h TTL.
   */
  onEntryFailed?: (txHash: string, error: unknown) => void;
  /**
   * Optional abort signal. If set, the helper short-circuits at the start of
   * each entry and after each await so an unmount mid-recovery cleans up.
   */
  isAborted?: () => boolean;
}

/**
 * Recover every persisted entry independently. Returns the list of entries
 * processed (success or failure). One entry's failure does not block others.
 *
 * The original IIFE prunes expired entries and reads the pending list before
 * spawning per-entry async tasks. This helper preserves both behaviors.
 */
export async function runPendingTxRecovery(
  args: RunPendingTxRecoveryArgs,
): Promise<void> {
  const {
    jwt,
    registerFn,
    watcherRegister,
    getPending,
    removePending,
    buildToastConfigFn,
    toast,
    onEntryFailed,
    isAborted,
  } = args;

  const pending = getPending();
  if (pending.length === 0) return;

  console.log(
    `[tx-recovery] Found ${pending.length} pending registration(s), attempting recovery`,
  );

  // Recover each independently — don't let one failure block others.
  await Promise.all(
    pending.map((entry) => recoverOne(entry)),
  );

  async function recoverOne(entry: PendingTxRegistration): Promise<void> {
    if (isAborted?.()) return;
    try {
      await registerFn(
        entry.txHash,
        entry.gatewayTxType,
        jwt,
        entry.metadata,
        "tx-register-recovery-failure",
      );

      // Register the watcher BEFORE removing the localStorage entry (#503).
      // If register throws, the outer catch skips the remove() below, so the
      // entry stays persisted for the next-load retry.
      watcherRegister(
        entry.txHash,
        entry.frontendTxType,
        buildToastConfigFn(entry.frontendTxType),
        entry.recoveryContext,
      );

      removePending(entry.txHash);

      toast.success("Recovered pending transaction", {
        description: `Transaction ${entry.txHash.slice(0, 8)}... has been registered.`,
      });
      console.log(`[tx-recovery] Recovered ${entry.txHash}`);
    } catch (error) {
      console.warn(
        `[tx-recovery] Failed to recover ${entry.txHash}:`,
        error,
      );
      onEntryFailed?.(entry.txHash, error);
    }
  }
}
