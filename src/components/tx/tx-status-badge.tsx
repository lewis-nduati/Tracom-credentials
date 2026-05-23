/**
 * TxStatusBadge Component
 *
 * Inline badge showing transaction status from the Gateway TX State Machine.
 * Useful for showing TX status in list items, tables, or compact views.
 *
 * ## TX States
 *
 * - `pending` - TX submitted, awaiting confirmation (yellow)
 * - `confirmed` - TX confirmed on-chain, gateway processing (blue)
 * - `updated` - DB updates complete (green, terminal)
 * - `failed` - TX failed after max retries (red, terminal)
 * - `expired` - TX exceeded TTL (red, terminal)
 *
 * @see ~/hooks/tx/use-tx-watcher.ts - TX state polling
 */

import React from "react";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { LoadingIcon, SuccessIcon, ErrorIcon, PendingIcon, VerifiedIcon } from "~/components/icons";
import type { TxState } from "~/hooks/tx/use-tx-watcher";

export interface TxStatusBadgeProps {
  /**
   * Transaction state from Gateway TX State Machine
   */
  state: TxState;
  /**
   * Optional: Show loading spinner for pending states
   */
  showSpinner?: boolean;
  /**
   * Optional: Custom size (default: "default")
   */
  size?: "sm" | "default";
}

/**
 * Badge configuration per state
 */
const STATE_CONFIG: Record<
  TxState,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Pending",
    variant: "outline",
    className: "border-muted-foreground text-muted-foreground",
    Icon: PendingIcon,
  },
  confirmed: {
    label: "Confirmed",
    variant: "outline",
    className: "border-secondary text-secondary",
    Icon: VerifiedIcon,
  },
  updated: {
    label: "Complete",
    variant: "outline",
    className: "border-primary text-primary",
    Icon: SuccessIcon,
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    className: "",
    Icon: ErrorIcon,
  },
  expired: {
    label: "Expired",
    variant: "destructive",
    className: "",
    Icon: ErrorIcon,
  },
};

/**
 * TxStatusBadge - Inline transaction status indicator
 *
 * @example
 * ```tsx
 * const { status } = useTxWatcher(txHash);
 *
 * <TxStatusBadge state={status?.state ?? "pending"} />
 *
 * // With spinner for loading states
 * <TxStatusBadge state="pending" showSpinner />
 * ```
 */
export function TxStatusBadge({
  state,
  showSpinner = false,
  size = "default",
}: TxStatusBadgeProps) {
  const config = STATE_CONFIG[state];
  const Icon = config.Icon;
  const isLoading = showSpinner && (state === "pending" || state === "confirmed");

  const sizeClasses = size === "sm" ? "text-xs px-1.5 py-0.5" : "";

  return (
    <AndamioBadge
      variant={config.variant}
      className={`${config.className} ${sizeClasses} gap-1`}
    >
      {isLoading ? (
        <LoadingIcon className="h-3 w-3 animate-spin" />
      ) : (
        <Icon className="h-3 w-3" />
      )}
      {config.label}
    </AndamioBadge>
  );
}
