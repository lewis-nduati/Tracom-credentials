import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

import { pollUntilTerminal, BUDGET_404_REASON } from "./tx-polling-fallback";
import type { TxStatus } from "~/hooks/tx/use-tx-watcher";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function emptyResponse(status: number): Response {
  return new Response("", { status });
}

function pendingStatusResponse(): Response {
  return jsonResponse({
    tx_hash: "tx",
    tx_type: "",
    state: "pending",
    retry_count: 0,
  } satisfies TxStatus);
}

function updatedStatusResponse(): Response {
  return jsonResponse({
    tx_hash: "tx",
    tx_type: "",
    state: "updated",
    retry_count: 0,
  } satisfies TxStatus);
}

// Mock timers replace the inter-poll setTimeout(resolve, interval) so the test
// suite never schedules real wallclock work. Drains pending timers + microtasks
// in a tight loop until the polling promise settles.
async function awaitPolling<T>(promise: Promise<T>): Promise<T> {
  let done = false;
  void promise.finally(() => {
    done = true;
  });
  for (let i = 0; i < 5_000 && !done; i++) {
    await Promise.resolve();
    mock.timers.runAll();
  }
  return promise;
}

describe("tx-polling-fallback / pollUntilTerminal", () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ["setTimeout"] });
  });

  afterEach(() => {
    mock.timers.reset();
  });
  it("5 consecutive 404s emit a synthetic terminal with state=failed, __reason=budget_404, and a human-readable last_error", async () => {
    const fetcher = async () => emptyResponse(404);
    const onCompleteCalls: TxStatus[] = [];
    const result = await awaitPolling(
      pollUntilTerminal(
        "tx-untracked",
        fetcher,
        {
          onComplete: (s) => onCompleteCalls.push(s),
        },
        { interval: 0 },
      ),
    );
    assert.equal(onCompleteCalls.length, 1);
    assert.equal(result?.state, "failed");
    assert.equal(result?.__reason, BUDGET_404_REASON);
    assert.equal(typeof result?.last_error, "string");
    assert.ok(
      (result?.last_error ?? "").length > 0,
      "last_error must be a user-readable sentence",
    );
    // Sanity-check the exact sentence anchors so the user-facing copy can't
    // silently regress to a stack trace or technical noise.
    assert.match(result.last_error!, /can't find this transaction/i);
    assert.match(result.last_error!, /reload/i);
    // The same status object is forwarded to onComplete and returned.
    assert.equal(result, onCompleteCalls[0]);
  });

  it("4×404 followed by a 200 terminal state resolves with that terminal — budget does NOT fire at 4", async () => {
    const responses: Response[] = [
      emptyResponse(404),
      emptyResponse(404),
      emptyResponse(404),
      emptyResponse(404),
      updatedStatusResponse(),
    ];
    let i = 0;
    const fetcher = async () => responses[i++]!;

    const result = await awaitPolling(
      pollUntilTerminal("tx", fetcher, {}, { interval: 0 }),
    );

    assert.equal(result?.state, "updated");
    assert.equal(result?.__reason, undefined);
  });

  it("4×404 then a 200 (non-terminal) resets consecutive404s — a subsequent run of 4 fresh 404s does not trigger budget_404 within the same poll session", async () => {
    // Total 9 polls: 4 404s, 1 200(pending), 4 404s. If consecutive404s
    // were not reset, the 5th 404 would have triggered budget_404. With
    // reset, the 4 trailing 404s leave the count at 4 and never reach
    // MAX_CONSECUTIVE_404S=5; the loop hits maxPolls=9 and returns the
    // generic timeout terminal instead.
    const responses: Response[] = [
      emptyResponse(404),
      emptyResponse(404),
      emptyResponse(404),
      emptyResponse(404),
      pendingStatusResponse(),
      emptyResponse(404),
      emptyResponse(404),
      emptyResponse(404),
      emptyResponse(404),
    ];
    let i = 0;
    const fetcher = async () => responses[i++]!;
    const result = await awaitPolling(
      pollUntilTerminal("tx", fetcher, {}, { interval: 0, maxPolls: 9 }),
    );
    assert.equal(result?.state, "failed");
    // Generic timeout terminal — NOT the budget_404 sentinel.
    assert.notEqual(result?.__reason, BUDGET_404_REASON);
    assert.equal(result?.__reason, undefined);
    assert.match(result.last_error!, /timed out/i);
  });

  it("abort signal mid-404 loop returns null and does NOT fire onComplete (no synthetic terminal)", async () => {
    const controller = new AbortController();
    let calls = 0;
    const fetcher = async () => {
      calls++;
      // Abort after returning the second 404 so the loop's next top-of-iteration
      // check observes signal.aborted.
      if (calls === 2) controller.abort();
      return emptyResponse(404);
    };
    let onCompleteCalls = 0;
    const result = await awaitPolling(
      pollUntilTerminal(
        "tx",
        fetcher,
        { onComplete: () => onCompleteCalls++ },
        { interval: 0 },
        controller.signal,
      ),
    );
    assert.equal(result, null);
    assert.equal(onCompleteCalls, 0);
  });

  it("a long run of gateway 404s emits the budget_404 terminal — never the gateway-unreachable terminal (counter independence)", async () => {
    // If consecutive404s and consecutiveErrors were the same counter,
    // MAX_CONSECUTIVE_ERRORS=10 would not fire first; instead the budget_404
    // path always fires at 5 because the two counters are independent.
    // A single 404-only fetcher exercises this: success would mean we get
    // the budget_404 sentinel, NOT the gateway-unreachable copy.
    const fetcher = async () => emptyResponse(404);
    const result = await awaitPolling(
      pollUntilTerminal("tx", fetcher, {}, { interval: 0 }),
    );
    assert.equal(result?.__reason, BUDGET_404_REASON);
    assert.doesNotMatch(
      result?.last_error ?? "",
      /Gateway temporarily unreachable/i,
    );
  });
});
