/**
 * PendingTxList Component
 *
 * Displays a list of the user's pending transactions from the Gateway.
 * Uses the V2 TX State Machine pattern - all confirmation is handled server-side.
 *
 * ## Features
 *
 * - Fetches pending TXs from Gateway `/api/v2/tx/pending`
 * - Shows TX type, status, time since submission
 * - Links to blockchain explorer
 * - Auto-refreshes on interval
 *
 * @see ~/hooks/tx/use-tx-watcher.ts - TX state polling
 */

"use client";

import React, { useEffect, useState } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { TxStatusBadge } from "./tx-status-badge";
import {
  RefreshIcon,
  ExternalLinkIcon,
  PendingIcon,
  EmptyIcon,
} from "~/components/icons";
import type { TxStatus } from "~/hooks/tx/use-tx-watcher";
import { cn } from "~/lib/utils";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import { getTransactionExplorerUrl } from "~/lib/constants";

export interface PendingTxListProps {
  /** Polling interval in ms (default: 5000 = 5 seconds) */
  pollInterval?: number;
  /** Maximum number of items to show */
  maxItems?: number;
  /** Optional className */
  className?: string;
  /** Callback when TX list changes */
  onChange?: (transactions: TxStatus[]) => void;
}

/**
 * Format time since timestamp
 */
function formatTimeSince(isoString: string | undefined): string {
  if (!isoString) return "Just now";

  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Truncate transaction hash for display
 */
function truncateTxHash(txHash: string, length = 12): string {
  if (txHash.length <= length) return txHash;
  const start = Math.floor(length / 2);
  const end = Math.floor(length / 2);
  return `${txHash.slice(0, start)}...${txHash.slice(-end)}`;
}

/**
 * Get human-readable TX type label
 */
function getTxTypeLabel(txType: string): string {
  const labels: Record<string, string> = {
    access_token_mint: "Access Token",
    course_create: "Create Course",
    project_create: "Create Project",
    modules_manage: "Manage Modules",
    teachers_update: "Update Teachers",
    assignment_submit: "Assignment",
    credential_claim: "Claim Credential",
    tasks_manage: "Manage Tasks",
    task_submit: "Submit Task",
    task_assess: "Assess Task",
    project_join: "Join Project",
    managers_manage: "Update Managers",
    project_credential_claim: "Project Credential",
    treasury_fund: "Fund Treasury",
    blacklist_update: "Update Blacklist",
    assessment_assess: "Assess Assignment",
  };
  return labels[txType] ?? txType.replace(/_/g, " ");
}

/**
 * PendingTxList - List of user's pending transactions from Gateway
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PendingTxList />
 *
 * // With custom polling interval
 * <PendingTxList pollInterval={15000} maxItems={5} />
 * ```
 */
export function PendingTxList({
  pollInterval = 5000,
  maxItems = 10,
  className,
  onChange,
}: PendingTxListProps) {
  const { authenticatedFetch, jwt, isAuthenticated } = useAndamioAuth();
  const [transactions, setTransactions] = useState<TxStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingTxs = async () => {
    if (!jwt) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`${GATEWAY_API_BASE}/tx/pending`);

      if (!response.ok) {
        if (response.status === 404) {
          // No pending TXs - this is fine
          setTransactions([]);
          return;
        }
        throw new Error(`Failed to fetch pending TXs: ${response.status}`);
      }

      const data = (await response.json()) as TxStatus[];
      setTransactions(data.slice(0, maxItems));
      onChange?.(data);
    } catch (err) {
      console.error("[PendingTxList] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (!isAuthenticated || !jwt) return;

    void fetchPendingTxs();

    const interval = setInterval(() => {
      void fetchPendingTxs();
    }, pollInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, jwt, pollInterval, maxItems]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AndamioCard className={cn("", className)}>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PendingIcon className="h-4 w-4 text-muted-foreground" />
            <AndamioCardTitle className="text-base">Pending Transactions</AndamioCardTitle>
          </div>
          <AndamioButton
            variant="ghost"
            size="sm"
            onClick={() => void fetchPendingTxs()}
            disabled={isLoading}
          >
            <RefreshIcon
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
          </AndamioButton>
        </div>
      </AndamioCardHeader>

      <AndamioCardContent className="pt-0">
        {error && (
          <AndamioText variant="small" className="text-destructive">
            {error}
          </AndamioText>
        )}

        {!error && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <EmptyIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <AndamioText variant="small" className="text-muted-foreground">
              No pending transactions
            </AndamioText>
          </div>
        )}

        {transactions.length > 0 && (
          <div className="divide-y">
            {transactions.map((tx) => (
              <div key={tx.tx_hash} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <AndamioText variant="small" className="font-medium truncate">
                        {getTxTypeLabel(tx.tx_type)}
                      </AndamioText>
                      <TxStatusBadge
                        state={tx.state}
                        showSpinner
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <code className="font-mono">
                        {truncateTxHash(tx.tx_hash, 16)}
                      </code>
                      <a
                        href={getTransactionExplorerUrl(tx.tx_hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-primary hover:underline"
                      >
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <AndamioText variant="small" className="text-xs text-muted-foreground shrink-0">
                    {formatTimeSince(tx.confirmed_at)}
                  </AndamioText>
                </div>
                {tx.last_error && (
                  <AndamioText variant="small" className="text-xs text-destructive mt-1">
                    {tx.last_error}
                  </AndamioText>
                )}
              </div>
            ))}
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
