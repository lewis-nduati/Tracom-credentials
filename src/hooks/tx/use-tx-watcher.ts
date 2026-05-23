/**
 * Transaction Types & Helpers
 *
 * Shared types for the TX state machine, plus gateway registration helpers.
 *
 * ## TX States
 *
 * - `pending` - TX submitted, awaiting confirmation
 * - `confirmed` - TX confirmed on-chain, gateway processing DB updates
 * - `updated` - DB updates complete (terminal - success)
 * - `failed` - TX failed after max retries (terminal - error)
 * - `expired` - TX exceeded TTL (terminal - error)
 *
 * @see ~/stores/tx-watcher-store.ts - Global TX watcher (manages SSE/polling)
 * @see ~/hooks/tx/use-tx-stream.ts - Per-component subscription hook
 * @see ~/config/transaction-ui.ts - TX types
 */

import type { GatewayTxType } from "~/types/generated";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import { withTimeout } from "~/lib/promise-utils";

// =============================================================================
// Types
// =============================================================================

/**
 * Gateway TX state machine states
 */
export type TxState = "pending" | "confirmed" | "updated" | "failed" | "expired";

/**
 * Terminal states - stop polling when reached
 * IMPORTANT: "confirmed" is NOT terminal - it only means TX is on-chain.
 * Wait for "updated" which means Gateway has completed DB updates.
 */
export const TERMINAL_STATES: TxState[] = ["updated", "failed", "expired"];

/**
 * TX status response from gateway
 */
export interface TxStatus {
  tx_hash: string;
  tx_type: string;
  state: TxState;
  confirmed_at?: string;
  retry_count: number;
  last_error?: string;
  /**
   * Internal discriminator attached by synthetic-terminal producers in
   * tx-polling-fallback (e.g., "budget_404"). The watcher store uses it to
   * route to the indexer fallback before firing handleTerminal; it is
   * stripped before any rendering or persistence path. Never exposed to UI.
   * @internal
   */
  __reason?: string;
}

/**
 * TX registration request body
 */
export interface TxRegisterRequest {
  tx_hash: string;
  tx_type: string;
  metadata?: Record<string, string>;
}

// =============================================================================
// Registration Helper
// =============================================================================

/**
 * Register a transaction with the gateway after wallet submission
 *
 * @param txHash - Transaction hash from wallet.submitTx()
 * @param txType - Transaction type (e.g., "access_token_mint")
 * @param jwt - Authentication JWT
 * @param metadata - Optional off-chain metadata (e.g., course title)
 */
const REGISTER_TIMEOUT_MS = 15_000;
const REGISTER_MAX_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

export async function registerTransaction(
  txHash: string,
  txType: string,
  jwt?: string | null,
  metadata?: Record<string, string>,
  diagnosticTag = "tx-register-failure",
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }

  const body = JSON.stringify({
    tx_hash: txHash,
    tx_type: txType,
    metadata,
  } satisfies TxRegisterRequest);

  // Diagnostic: track whether any fetch was dispatched. If still false after all
  // catches, the request never left the browser — typically adblocker, CORS, or
  // a proxy misconfiguration (issue #494 root-cause hypothesis verification).
  let dispatched = false;
  let lastErrorName: string | undefined;
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= REGISTER_MAX_RETRIES; attempt++) {
    try {
      dispatched = true;
      const response = await withTimeout(
        fetch(`${GATEWAY_API_BASE}/tx/register`, { method: "POST", headers, body }),
        REGISTER_TIMEOUT_MS,
        "tx-register",
      );

      if (response.ok) return;

      lastStatus = response.status;

      // 4xx = permanent failure, don't retry
      if (!RETRYABLE_STATUSES.has(response.status)) {
        const errorText = await response.text();
        console.warn(`[${diagnosticTag}]`, {
          txHash,
          txType,
          errorName: "HttpError",
          status: response.status,
          attempt,
          dispatched: true,
        });
        throw new Error(`Failed to register TX: ${response.status} - ${errorText}`);
      }

      // 5xx on last attempt = give up
      if (attempt === REGISTER_MAX_RETRIES) {
        const errorText = await response.text();
        console.warn(`[${diagnosticTag}]`, {
          txHash,
          txType,
          errorName: "HttpError",
          status: response.status,
          attempt,
          dispatched: true,
        });
        throw new Error(`Failed to register TX: ${response.status} - ${errorText}`);
      }

      // 5xx = transient, retry with backoff
      console.warn(`[tx-register] Retry ${attempt + 1}/${REGISTER_MAX_RETRIES} after ${response.status}`);
    } catch (error) {
      if (error instanceof Error) {
        lastErrorName = error.name;
      }
      // Timeout or network error on last attempt — give up
      if (attempt === REGISTER_MAX_RETRIES) {
        console.warn(`[${diagnosticTag}]`, {
          txHash,
          txType,
          errorName: lastErrorName,
          status: lastStatus,
          attempt,
          dispatched,
        });
        throw error;
      }
      console.warn(`[tx-register] Retry ${attempt + 1}/${REGISTER_MAX_RETRIES} after error:`, error);
    }

    // Exponential backoff: 2s, 4s, 8s
    await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
  }
}

// =============================================================================
// TX Type Mapping
// =============================================================================

/**
 * Map TransactionType (frontend) to tx_type (gateway)
 *
 * The gateway uses a specific set of tx_type values defined in the API spec.
 * @see GatewayTxType for valid values
 * @see https://dev-api.andamio.io/api/v1/docs/ for API docs
 */
export const TX_TYPE_MAP: Record<string, GatewayTxType> = {
  // Global
  GLOBAL_GENERAL_ACCESS_TOKEN_MINT: "access_token_mint",
  GLOBAL_USER_ACCESS_TOKEN_CLAIM: "access_token_mint",

  // Course - Instance
  INSTANCE_COURSE_CREATE: "course_create",

  // Course - Owner
  COURSE_OWNER_TEACHERS_MANAGE: "teachers_update",

  // Course - Teacher
  COURSE_TEACHER_MODULES_MANAGE: "modules_manage",
  COURSE_TEACHER_ASSIGNMENTS_ASSESS: "assessment_assess",

  // Course - Student
  COURSE_STUDENT_ASSIGNMENT_COMMIT: "assignment_submit",
  COURSE_STUDENT_ASSIGNMENT_UPDATE: "assignment_submit",
  COURSE_STUDENT_CREDENTIAL_CLAIM: "credential_claim",

  // Project - Instance
  INSTANCE_PROJECT_CREATE: "project_create",

  // Project - Owner
  PROJECT_OWNER_MANAGERS_MANAGE: "managers_manage",
  PROJECT_OWNER_BLACKLIST_MANAGE: "blacklist_update",

  // Project - Manager
  PROJECT_MANAGER_TASKS_MANAGE: "tasks_manage",
  PROJECT_MANAGER_TASKS_ASSESS: "task_assess",

  // Project - Contributor
  PROJECT_CONTRIBUTOR_TASK_COMMIT: "project_join",
  PROJECT_CONTRIBUTOR_TASK_ACTION: "task_submit",
  PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM: "project_credential_claim",

  // Project - User
  PROJECT_USER_TREASURY_ADD_FUNDS: "treasury_fund",
};

/**
 * Get gateway tx_type from frontend TransactionType
 */
export function getGatewayTxType(txType: string): GatewayTxType {
  const mapped = TX_TYPE_MAP[txType];
  if (!mapped) {
    console.warn(`[TX] Unknown transaction type: ${txType}, using as-is`);
    return txType.toLowerCase() as GatewayTxType;
  }
  return mapped;
}
