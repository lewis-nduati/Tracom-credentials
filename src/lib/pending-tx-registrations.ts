/**
 * Persistence layer for TX registrations that failed after on-chain submission.
 *
 * When registerTransaction() fails (network blip, gateway cold start), the
 * registration payload is saved here so TxWatcherBridge can retry on next load.
 *
 * ## Schema versioning
 *
 * The persisted shape is versioned via `schemaVersion`. Entries without a
 * matching version are silently dropped on read — old entries from prior
 * app versions represent failed registrations whose on-chain TXs landed
 * independently (the gateway reconciler picks them up), so dropping
 * client-side tracking is safe.
 *
 * ## v2 changes (issue #494)
 *
 * - Renamed `txType` → `gatewayTxType` for clarity (e.g., "project_join")
 * - Added `frontendTxType` (e.g., "PROJECT_CONTRIBUTOR_TASK_COMMIT") so the
 *   recovery path can call `getTransactionUI()` and resolve toast copy
 *   without a reverse map
 * - Added optional `recoveryContext` for the indexer fallback flow
 *
 * @see ~/components/providers/tx-watcher-provider.tsx - Recovery-on-load
 * @see ~/hooks/tx/use-tx-watcher.ts - registerTransaction with retry
 * @see ~/types/tx-recovery.ts - TxRecoveryContext discriminated union
 */

import { isTransactionType, type TransactionType } from "~/config/transaction-ui";
import type { TxRecoveryContext } from "~/types/tx-recovery";

const STORAGE_KEY = "pendingTxRegistrations";
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CURRENT_SCHEMA_VERSION = 2 as const;

export interface PendingTxRegistration {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  txHash: string;
  /** Gateway-mapped type (e.g., "project_join"); what registerTransaction sends */
  gatewayTxType: string;
  /** Frontend TransactionType (e.g., "PROJECT_CONTRIBUTOR_TASK_COMMIT"); used for getTransactionUI() lookup on recovery */
  frontendTxType: TransactionType;
  metadata?: Record<string, string>;
  recoveryContext?: TxRecoveryContext;
  /** Date.now() timestamp */
  createdAt: number;
}

function isWellFormed(entry: unknown): entry is PendingTxRegistration {
  if (!entry || typeof entry !== "object") return false;
  const e = entry as Record<string, unknown>;
  return (
    e.schemaVersion === CURRENT_SCHEMA_VERSION &&
    typeof e.txHash === "string" &&
    typeof e.gatewayTxType === "string" &&
    typeof e.frontendTxType === "string" &&
    isTransactionType(e.frontendTxType) &&
    typeof e.createdAt === "number"
  );
}

function readAll(): PendingTxRegistration[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const wellFormed: PendingTxRegistration[] = [];
    let dropped = 0;
    for (const entry of parsed) {
      if (isWellFormed(entry)) {
        wellFormed.push(entry);
      } else {
        dropped++;
      }
    }
    if (dropped > 0) {
      console.warn(
        `[pending-tx-registrations] Dropped ${dropped} malformed or pre-v${CURRENT_SCHEMA_VERSION} entry/entries on load`
      );
      // Persist the cleaned list so we don't re-warn on the next read
      writeAll(wellFormed);
    }
    return wellFormed;
  } catch {
    console.warn("[pending-tx-registrations] Failed to read localStorage, clearing");
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return [];
  }
}

function writeAll(entries: PendingTxRegistration[]): void {
  if (typeof window === "undefined") return;
  try {
    if (entries.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  } catch (error) {
    console.warn("[pending-tx-registrations] Failed to write localStorage:", error);
  }
}

export const pendingTxRegistrations = {
  /** Get all pending registrations (safe for SSR, corrupted data, quota errors) */
  getAll: (): PendingTxRegistration[] => readAll(),

  /** Add a failed registration for later recovery */
  add: (entry: Omit<PendingTxRegistration, "createdAt" | "schemaVersion">): void => {
    const entries = readAll();
    // Deduplicate by txHash
    const existing = entries.findIndex((e) => e.txHash === entry.txHash);
    if (existing !== -1) return;
    entries.push({
      ...entry,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      createdAt: Date.now(),
    });
    writeAll(entries);
  },

  /** Remove a registration after successful recovery */
  remove: (txHash: string): void => {
    const entries = readAll();
    writeAll(entries.filter((e) => e.txHash !== txHash));
  },

  /** Remove entries older than TTL (2 hours) */
  pruneExpired: (): void => {
    const entries = readAll();
    const cutoff = Date.now() - TTL_MS;
    const fresh = entries.filter((e) => e.createdAt > cutoff);
    if (fresh.length !== entries.length) {
      writeAll(fresh);
    }
  },
};
