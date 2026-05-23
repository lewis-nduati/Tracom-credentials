/**
 * SSE (Server-Sent Events) Parser
 *
 * Parses raw SSE text chunks into structured events.
 * Extracted as a shared utility for use by both the global TX watcher store
 * and the useTxStream hook.
 *
 * SSE format:
 * ```
 * event: state
 * data: {"tx_hash":"abc","state":"pending",...}
 *
 * event: state_change
 * data: {"tx_hash":"abc","previous_state":"pending","new_state":"confirmed",...}
 * ```
 *
 * @see src/stores/tx-watcher-store.ts - Global TX watcher (primary consumer)
 * @see src/hooks/tx/use-tx-stream.ts - Per-component stream hook
 */

export interface ParsedSSEEvent {
  event?: string;
  data?: string;
}

/**
 * Parse SSE text chunks into structured events.
 * Events are delimited by double newlines (`\n\n`).
 */
export function parseSSEChunk(chunk: string): ParsedSSEEvent[] {
  const events: ParsedSSEEvent[] = [];
  const blocks = chunk.split("\n\n").filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n");
    let event: string | undefined;
    let data: string | undefined;

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        event = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        data = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        // data with no space after colon
        data = line.slice(5).trim();
      }
    }

    if (data !== undefined) {
      events.push({ event, data });
    }
  }

  return events;
}
