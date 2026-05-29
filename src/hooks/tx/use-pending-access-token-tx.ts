/**
 * usePendingAccessTokenTx Hook
 *
 * Reports whether an access-token transaction is currently in flight
 * (submitted but not yet terminal) anywhere in the session. This covers both
 * ways a wallet acquires a v2 access token:
 *
 *  - `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` — a fresh mint (RegistrationFlow,
 *    MintAccessToken)
 *  - `GLOBAL_USER_ACCESS_TOKEN_CLAIM` — claiming a v2 token from a legacy v1
 *    token (V1MigrateCard)
 *
 * ## Why This Exists
 *
 * The wallet-balance guards in the access-token UIs read
 * `wallet.getBalanceMesh()`, which only reflects *confirmed* on-chain UTxOs. A
 * Cardano transaction takes 20–90s to confirm, so during that window the
 * freshly acquired token is invisible to the wallet. If a component remounts,
 * the user navigates back, or a second surface renders, the wallet guard sees
 * no token and offers the form again — letting the user acquire a *second*
 * access token.
 *
 * The global `txWatcherStore` already tracks in-flight transactions and
 * survives component unmounts and navigation. Gating on a non-terminal
 * access-token transaction there closes the confirmation-lag window that the
 * wallet guards cannot.
 *
 * Once the transaction reaches a terminal state (updated / confirmed / failed /
 * expired) this returns `false` again, so failed attempts can be retried and
 * the confirmed-token wallet guard takes over for the success case.
 *
 * @see ~/stores/tx-watcher-store.ts - The global store this reads from
 */

import { useSyncExternalStore } from "react";
import { txWatcherStore } from "~/stores/tx-watcher-store";

/** TX types that result in the wallet acquiring a v2 access token. */
const ACCESS_TOKEN_TX_TYPES = new Set([
  "GLOBAL_GENERAL_ACCESS_TOKEN_MINT",
  "GLOBAL_USER_ACCESS_TOKEN_CLAIM",
]);

/**
 * Pure predicate: does the given set of watched transactions contain a
 * non-terminal access-token acquisition (mint or v1→v2 claim)?
 *
 * Extracted from the hook so the gating logic can be unit-tested without
 * rendering React or booting the store's SSE loop.
 */
export function selectHasPendingAccessTokenTx(
  transactions: Iterable<{ txType: string; isTerminal: boolean }>,
): boolean {
  for (const tx of transactions) {
    if (ACCESS_TOKEN_TX_TYPES.has(tx.txType) && !tx.isTerminal) {
      return true;
    }
  }
  return false;
}

function getSnapshot(): boolean {
  return selectHasPendingAccessTokenTx(
    txWatcherStore.getState().transactions.values(),
  );
}

/** Server snapshot: no transactions are ever in flight during SSR. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Whether an access-token transaction (mint or v1→v2 claim) is in flight
 * (registered and not yet terminal) for the current session.
 *
 * Returns a primitive boolean, so `useSyncExternalStore` re-renders only when
 * the in-flight status actually flips.
 */
export function useHasPendingAccessTokenTx(): boolean {
  return useSyncExternalStore(
    txWatcherStore.subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}
