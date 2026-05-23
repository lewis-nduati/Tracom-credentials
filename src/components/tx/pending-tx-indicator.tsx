/**
 * Pending Transaction Indicator
 *
 * Inline indicator for the sidebar user section showing the count of
 * in-flight transactions. Uses a Zustand selector so it only re-renders
 * when the count changes. Renders nothing when count is 0.
 *
 * @see src/stores/tx-watcher-store.ts - Transaction state source
 * @see src/components/layout/sidebar-user-section.tsx - Parent component
 */

"use client";

import { useStore } from "zustand";
import { txWatcherStore } from "~/stores/tx-watcher-store";
import { PendingIcon } from "~/components/icons";
import { cn } from "~/lib/utils";

/**
 * Selector: count of non-terminal transactions.
 * Returns a primitive number so Zustand uses Object.is comparison.
 */
function selectPendingCount(state: { transactions: Map<string, { isTerminal: boolean }> }): number {
  let count = 0;
  for (const tx of state.transactions.values()) {
    if (!tx.isTerminal) count++;
  }
  return count;
}

interface PendingTxIndicatorProps {
  variant?: "compact" | "expanded";
}

export function PendingTxIndicator({ variant = "compact" }: PendingTxIndicatorProps) {
  const pendingCount = useStore(txWatcherStore, selectPendingCount);
  const isExpanded = variant === "expanded";

  if (pendingCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md bg-sidebar-accent/50",
        isExpanded ? "p-3 rounded-lg" : "p-2"
      )}
    >
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      <PendingIcon className={cn("flex-shrink-0 text-muted-foreground", isExpanded ? "h-4 w-4" : "h-3 w-3")} />
      <span className={cn("font-medium text-sidebar-foreground", isExpanded ? "text-xs" : "text-[11px]")}>
        {pendingCount} pending {pendingCount === 1 ? "tx" : "txs"}
      </span>
    </div>
  );
}
