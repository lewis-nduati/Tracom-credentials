/**
 * Transaction Watcher Bridge
 *
 * Thin "use client" component that bridges React context to the global
 * tx-watcher-store (which has no React dependency).
 *
 * Responsibilities:
 * - Syncs the JWT from auth context into the store on every change
 * - Clears all tracked transactions on logout
 * - Runs periodic cleanup of stale entries (every 5 minutes)
 * - Recovers pending TX registrations from localStorage on mount
 *
 * Does NOT wrap children in a Context — the store is accessed via import.
 *
 * @see src/stores/tx-watcher-store.ts - The global store
 * @see src/lib/pending-tx-registrations.ts - Persistence for failed registrations
 */

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { txWatcherStore } from "~/stores/tx-watcher-store";
import { registerTransaction } from "~/hooks/tx/use-tx-watcher";
import { pendingTxRegistrations } from "~/lib/pending-tx-registrations";
import { buildWatcherToastConfig } from "~/lib/tx-watcher-toast-config";
import { runPendingTxRecovery } from "~/components/providers/recover-pending-transactions";

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const RECOVERY_DELAY_MS = 3_000; // Wait for app to settle before recovery

export function TxWatcherBridge({ children }: { children: ReactNode }) {
  const { jwt } = useAndamioAuth();
  const prevJwtRef = useRef<string | null | undefined>(undefined);
  const recoveryRanRef = useRef(false);

  // Sync JWT into the store whenever it changes
  useEffect(() => {
    txWatcherStore.getState().updateJwt(jwt ?? null);

    // If JWT changed from something to null (logout), clear all tracked TXs
    // and reset recovery guard so next login triggers recovery
    if (prevJwtRef.current && !jwt) {
      txWatcherStore.getState().clearAll();
      recoveryRanRef.current = false;
    }

    prevJwtRef.current = jwt;
  }, [jwt]);

  // Periodic cleanup of stale transaction entries
  useEffect(() => {
    const interval = setInterval(() => {
      txWatcherStore.getState().cleanup();
    }, CLEANUP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Recover pending TX registrations from localStorage on mount
  useEffect(() => {
    if (!jwt || recoveryRanRef.current) return;
    recoveryRanRef.current = true;

    let aborted = false;
    const timer = setTimeout(() => {
      if (aborted) return;

      pendingTxRegistrations.pruneExpired();

      void runPendingTxRecovery({
        jwt,
        registerFn: registerTransaction,
        watcherRegister: txWatcherStore.getState().register,
        getPending: pendingTxRegistrations.getAll,
        removePending: pendingTxRegistrations.remove,
        buildToastConfigFn: buildWatcherToastConfig,
        toast,
        isAborted: () => aborted,
        // Reset the session guard so a subsequent mount (e.g., page refresh
        // within the same JWT session) can retry the failed entry instead
        // of waiting for logout or the 2h TTL.
        onEntryFailed: () => {
          recoveryRanRef.current = false;
        },
      });
    }, RECOVERY_DELAY_MS);

    return () => {
      aborted = true;
      clearTimeout(timer);
    };
  }, [jwt]);

  return <>{children}</>;
}
