/**
 * SSE Transaction Stream Types
 *
 * Types for Server-Sent Events from the gateway TX stream endpoint.
 * The gateway sends three event types during a transaction's lifecycle:
 *
 * 1. `state` - Initial state when client connects (current snapshot)
 * 2. `state_change` - Real-time state transition notification
 * 3. `complete` - Terminal state reached (success or failure)
 *
 * @see src/hooks/tx/use-tx-stream.ts - Consumer hook
 * @see src/app/api/gateway-stream/[...path]/route.ts - SSE proxy
 */

import type { TxState } from "~/hooks/tx/use-tx-watcher";

// =============================================================================
// SSE Event Payloads
// =============================================================================

/**
 * Initial state event - sent when the SSE connection opens.
 * Provides the current snapshot of the transaction.
 */
export interface TxStateEvent {
  tx_hash: string;
  tx_type: string;
  state: TxState;
  retry_count: number;
  last_error?: string;
  confirmed_at?: string;
}

/**
 * State change event - sent when the transaction transitions between states.
 */
export interface TxStateChangeEvent {
  tx_hash: string;
  previous_state: TxState;
  new_state: TxState;
  timestamp: string;
}

/**
 * Complete event - sent when the transaction reaches a terminal state.
 * After this event, the SSE connection will close.
 */
export interface TxCompleteEvent {
  tx_hash: string;
  tx_type: string;
  final_state: TxState;
  confirmed_at?: string;
  last_error?: string;
}

