/**
 * usePendingAccessTokenMint Hook
 *
 * Reports whether an access-token mint is currently in flight (submitted but
 * not yet terminal) anywhere in the session.
 *
 * ## Why This Exists
 *
 * The wallet-balance guards in the mint UIs read `wallet.getBalanceMesh()`,
 * which only reflects *confirmed* on-chain UTxOs. A Cardano mint takes 20–90s
 * to confirm, so during that window the freshly minted token is invisible to
 * the wallet. If a mint component remounts, the user navigates back, or a
 * second mint surface renders, the wallet guard sees no token and offers the
 * mint form again — letting the user mint a *second* access token.
 *
 * The global `txWatcherStore` already tracks in-flight transactions (including
 * `GLOBAL_GENERAL_ACCESS_TOKEN_MINT`) and survives component unmounts and
 * navigation. Gating the mint on a non-terminal mint TX in that store closes
 * the confirmation-lag window that the wallet guards cannot.
 *
 * Note: the store entry stays non-terminal only until the mint reaches a
 * terminal state (updated / confirmed / failed / expired). Once terminal, this
 * returns `false` again, so failed mints can be retried and the confirmed-token
 * wallet guard takes over for the success case.
 *
 * @see ~/stores/tx-watcher-store.ts - The global store this reads from
 */

import { useSyncExternalStore } from "react";
import { txWatcherStore } from "~/stores/tx-watcher-store";

/** TX type registered by the access-token mint flow. */
const ACCESS_TOKEN_MINT_TX_TYPE = "GLOBAL_GENERAL_ACCESS_TOKEN_MINT";

function getSnapshot(): boolean {
  for (const tx of txWatcherStore.getState().transactions.values()) {
    if (tx.txType === ACCESS_TOKEN_MINT_TX_TYPE && !tx.isTerminal) {
      return true;
    }
  }
  return false;
}

/** Server snapshot: no transactions are ever in flight during SSR. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Whether a `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` transaction is in flight
 * (registered and not yet terminal) for the current session.
 *
 * Returns a primitive boolean, so `useSyncExternalStore` re-renders only when
 * the in-flight status actually flips.
 */
export function useHasPendingAccessTokenMint(): boolean {
  return useSyncExternalStore(
    txWatcherStore.subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}
