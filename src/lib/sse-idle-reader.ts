/**
 * SSE Idle Reader
 *
 * Pure helper that wraps a `ReadableStreamDefaultReader<Uint8Array>` with an
 * idle timeout. If no chunk arrives within `idleTimeoutMs`, the reader is
 * cancelled (best-effort) so the pending `read()` resolves and the loop exits
 * with kind `"idle-timeout"`.
 *
 * Extracted out of `tx-watcher-store.ts` so the idle-timeout behavior is
 * unit-testable without mocking global `fetch`. Mirrors the testability shape
 * already used by `tx-indexer-fallback.ts`.
 *
 * The helper is framework-agnostic: no React, Zustand, toast, or env imports.
 * It owns the read loop + idle timer only — SSE parsing and event dispatch
 * stay with the caller via the `onChunk` callback.
 *
 * @see src/stores/tx-watcher-store.ts - Primary consumer
 * @see https://github.com/Andamio-Platform/coordination/issues/505
 */

export type SSEIdleReadResult = {
  kind: "done" | "idle-timeout" | "aborted";
  reachedTerminal: boolean;
};

export interface SSEIdleReadOptions {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  decoder: TextDecoder;
  idleTimeoutMs: number;
  /**
   * Invoked synchronously after each chunk is decoded. The caller parses the
   * accumulated buffer and reports whether a terminal SSE event was processed.
   * Once `reachedTerminal` is true the loop continues draining (so trailing
   * server bytes don't leak), but the caller is expected to skip post-loop
   * polling.
   */
  onChunk: (decoded: string) => { reachedTerminal: boolean };
  /** Optional log prefix for the idle-timeout warning (defaults to "[sse-idle-reader]"). */
  logPrefix?: string;
}

export async function readSSEUntilIdle(
  options: SSEIdleReadOptions,
): Promise<SSEIdleReadResult> {
  const { reader, decoder, idleTimeoutMs, onChunk } = options;
  const logPrefix = options.logPrefix ?? "[sse-idle-reader]";

  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let idleTimedOut = false;
  let reachedTerminal = false;

  const armIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleTimedOut = true;
      console.warn(
        `${logPrefix} no SSE chunk received in ${idleTimeoutMs}ms — cancelling reader`,
      );
      // Best-effort cancel; ignore rejection. WHATWG Streams resolves any
      // in-flight read() with { done: true } after cancel().
      void reader.cancel().catch(() => {});
    }, idleTimeoutMs);
  };

  try {
    armIdleTimer();

    while (true) {
      let readResult: ReadableStreamReadResult<Uint8Array>;
      try {
        readResult = await reader.read();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return { kind: "aborted", reachedTerminal };
        }
        throw err;
      }

      const { done, value } = readResult;
      if (done) {
        if (idleTimedOut) {
          return { kind: "idle-timeout", reachedTerminal };
        }
        return { kind: "done", reachedTerminal };
      }

      // Reset BEFORE parsing so heartbeats / comments / unknown event types
      // count toward keep-alive even though `parseSSEChunk` later drops them.
      armIdleTimer();

      const decoded = decoder.decode(value, { stream: true });
      const chunkResult = onChunk(decoded);
      if (chunkResult.reachedTerminal) {
        reachedTerminal = true;
      }
    }
  } finally {
    if (idleTimer) clearTimeout(idleTimer);
  }
}
