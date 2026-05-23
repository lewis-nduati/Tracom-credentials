/**
 * Shared helper for constructing TxToastConfig from a frontend TransactionType.
 *
 * Used by both the submit path (`use-transaction.ts`) and the on-load recovery
 * path (`tx-watcher-provider.tsx`) to keep success/error toast copy in sync.
 *
 * @see src/stores/tx-watcher-store.ts - TxToastConfig shape
 * @see src/config/transaction-ui.ts - getTransactionUI
 */

import { getTransactionUI, type TransactionType } from "~/config/transaction-ui";
import type { TxToastConfig } from "~/stores/tx-watcher-store";

export function buildWatcherToastConfig(txType: TransactionType): TxToastConfig {
  const ui = getTransactionUI(txType);
  return {
    successTitle: ui.successInfo,
    successDescription: "Transaction confirmed and database updated.",
    errorTitle: "Transaction Failed",
  };
}
