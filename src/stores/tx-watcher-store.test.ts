/**
 * Tests for tx-watcher-store: register() recoveryContext threading,
 * handleTerminal idempotency + __reason stripping, and handlePollingTerminal
 * routing (indexer dispatch / JWT-rotation skip / unresolved fallback /
 * exception swallowing).
 *
 * Driven via the `__test_only__` seams; the live SSE/polling loop is out of
 * scope (the store keeps it private and we suppress fetch via a global stub).
 */

import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

import {
  txWatcherStore,
  __test_only__handlePollingTerminal,
  __test_only__handleTerminal,
  type TxToastConfig,
  type WatchedTransaction,
} from "./tx-watcher-store";
import type { TxStatus } from "~/hooks/tx/use-tx-watcher";
import type { TxRecoveryContext } from "~/types/tx-recovery";

const TOAST_CONFIG: TxToastConfig = {
  successTitle: "Done",
  successDescription: "Transaction confirmed.",
  errorTitle: "Failed",
};

const PROJECT_RECOVERY: TxRecoveryContext = {
  kind: "project_contributor",
  projectId: "p1",
  taskHash: "t1",
};

function makeBudget404Status(txHash: string): TxStatus {
  return {
    tx_hash: txHash,
    tx_type: "",
    state: "failed",
    retry_count: 0,
    last_error: "We can't find this transaction in the gateway.",
    __reason: "budget_404",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function emptyResponse(status: number): Response {
  return new Response("", { status });
}

/**
 * Manually inject a watched-transaction entry into the store, bypassing
 * register() so startWatching never fires. Used by the handlePollingTerminal
 * tests, which exercise the post-polling routing logic in isolation.
 */
function injectEntry(
  txHash: string,
  recoveryContext: TxRecoveryContext | undefined,
): void {
  const entry: WatchedTransaction = {
    txHash,
    txType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
    status: null,
    isTerminal: false,
    subscriberCount: 0,
    toastConfig: TOAST_CONFIG,
    recoveryContext,
    registeredAt: Date.now(),
    _abortController: null,
    _confirmedTimeout: null,
  };
  const next = new Map(txWatcherStore.getState().transactions);
  next.set(txHash, entry);
  txWatcherStore.setState({ transactions: next });
}

function getEntry(txHash: string): WatchedTransaction | undefined {
  return txWatcherStore.getState().transactions.get(txHash);
}

const get = () => txWatcherStore.getState();
const set = (partial: Partial<ReturnType<typeof txWatcherStore.getState>>) =>
  txWatcherStore.setState(partial);

describe("tx-watcher-store", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    // Mock setTimeout so handleTerminal's CLEANUP_DELAY_MS=60_000ms timer
    // doesn't keep the process alive after the test — and so the indexer
    // fallback's 15s withTimeout never fires during fake-fetch tests.
    mock.timers.enable({ apis: ["setTimeout"] });
    originalFetch = globalThis.fetch;
    // Default: any unexpected fetch fails the test by throwing AbortError-like.
    globalThis.fetch = async () => {
      throw new DOMException("aborted", "AbortError");
    };
    // sonner's toast.dismiss calls requestAnimationFrame; stub it for Node.
    const g = globalThis as unknown as {
      requestAnimationFrame?: (cb: (t: number) => void) => number;
      cancelAnimationFrame?: (id: number) => void;
    };
    g.requestAnimationFrame = (_cb) => 0;
    g.cancelAnimationFrame = (_id) => {
      /* noop */
    };
    txWatcherStore.setState({ transactions: new Map(), jwt: null });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    txWatcherStore.setState({ transactions: new Map(), jwt: null });
    const g = globalThis as unknown as {
      requestAnimationFrame?: unknown;
      cancelAnimationFrame?: unknown;
    };
    delete g.requestAnimationFrame;
    delete g.cancelAnimationFrame;
    mock.timers.reset();
  });

  describe("register()", () => {
    it("stores recoveryContext on the internal record (assert via getWatchedTx)", () => {
      const txHash = "0xreg1";
      txWatcherStore
        .getState()
        .register(txHash, "PROJECT_CONTRIBUTOR_TASK_COMMIT", TOAST_CONFIG, PROJECT_RECOVERY);

      const entry = txWatcherStore.getState().getWatchedTx(txHash);
      assert.ok(entry, "entry should exist");
      assert.deepEqual(entry.recoveryContext, PROJECT_RECOVERY);

      // Cleanup: abort the in-flight fetch so the SSE/polling task ends.
      txWatcherStore.getState().clearAll();
    });

    it("stores recoveryContext === undefined for TXs without a fallback path", () => {
      const txHash = "0xreg2";
      txWatcherStore
        .getState()
        .register(txHash, "GLOBAL_GENERAL_ACCESS_TOKEN_MINT", TOAST_CONFIG);

      const entry = txWatcherStore.getState().getWatchedTx(txHash);
      assert.ok(entry);
      assert.equal(entry.recoveryContext, undefined);
      txWatcherStore.getState().clearAll();
    });
  });

  describe("handleTerminal", () => {
    it("strips __reason from the persisted status (BUDGET_404_REASON must never reach storage)", () => {
      const txHash = "0xstrip";
      injectEntry(txHash, undefined);
      const status = makeBudget404Status(txHash);

      __test_only__handleTerminal(txHash, status, get, set);

      const entry = getEntry(txHash);
      assert.ok(entry);
      assert.equal(entry.isTerminal, true);
      assert.equal(entry.status?.__reason, undefined);
      assert.equal(entry.status?.state, "failed");
      assert.equal(entry.status?.last_error, status.last_error);
    });

    it("idempotency — second handleTerminal call for the same txHash is suppressed", () => {
      const txHash = "0xidemp";
      injectEntry(txHash, undefined);
      const status1: TxStatus = {
        tx_hash: txHash,
        tx_type: "",
        state: "updated",
        retry_count: 0,
      };
      __test_only__handleTerminal(txHash, status1, get, set);

      const afterFirst = getEntry(txHash);
      assert.equal(afterFirst!.isTerminal, true);
      assert.equal(afterFirst!.status?.state, "updated");

      // Second call with a DIFFERENT (failed) status — should be suppressed.
      const status2: TxStatus = {
        tx_hash: txHash,
        tx_type: "",
        state: "failed",
        retry_count: 0,
        last_error: "should not overwrite",
      };
      __test_only__handleTerminal(txHash, status2, get, set);

      const afterSecond = getEntry(txHash);
      // Status is unchanged from the first terminal — second was suppressed.
      assert.equal(afterSecond!.status?.state, "updated");
      assert.equal(afterSecond!.status?.last_error, undefined);
    });
  });

  describe("handlePollingTerminal — routes budget_404 through indexer fallback", () => {
    it("budget_404 + recoveryContext + matching JWT → runIndexerFallback runs; resolved → handleTerminal fires once with resolution.state and no __reason", async () => {
      const txHash = "0xresolved";
      injectEntry(txHash, PROJECT_RECOVERY);
      txWatcherStore.setState({ jwt: "jwt-1" });

      // runIndexerFallback fires recoverProjectContributor which fetches the
      // commitment endpoint. Match submission_tx + COMMITTED → resolved(updated).
      const fetchCalls: string[] = [];
      globalThis.fetch = async (url: RequestInfo | URL) => {
        fetchCalls.push(
          typeof url === "string" ? url : url instanceof URL ? url.href : url.url,
        );
        return jsonResponse({
          data: {
            submission_tx: txHash,
            content: { commitment_status: "COMMITTED" },
          },
        });
      };

      await __test_only__handlePollingTerminal(
        txHash,
        makeBudget404Status(txHash),
        "jwt-1",
        get,
        set,
      );

      assert.equal(fetchCalls.length, 1, "indexer fallback fetch should fire");

      const entry = getEntry(txHash);
      assert.ok(entry);
      assert.equal(entry.isTerminal, true);
      assert.equal(entry.status?.state, "updated");
      assert.equal(entry.status?.__reason, undefined);
    });

    it("budget_404 + no recoveryContext → indexer skipped; handleTerminal fires with sanitized original status", async () => {
      const txHash = "0xnocontext";
      injectEntry(txHash, undefined);
      txWatcherStore.setState({ jwt: "jwt-1" });

      let fetchCalled = false;
      globalThis.fetch = async () => {
        fetchCalled = true;
        return emptyResponse(200);
      };

      await __test_only__handlePollingTerminal(
        txHash,
        makeBudget404Status(txHash),
        "jwt-1",
        get,
        set,
      );

      assert.equal(fetchCalled, false, "no indexer fetch when recoveryContext is undefined");

      const entry = getEntry(txHash);
      assert.equal(entry!.isTerminal, true);
      assert.equal(entry!.status?.state, "failed");
      assert.equal(entry!.status?.__reason, undefined);
      // Last_error preserved (sanitized = same body, minus __reason).
      assert.match(entry!.status.last_error!, /can't find this transaction/i);
    });

    it("indexer returns unresolved → handleTerminal fires with the original (sanitized) budget_404 status", async () => {
      const txHash = "0xunresolved";
      injectEntry(txHash, PROJECT_RECOVERY);
      txWatcherStore.setState({ jwt: "jwt-1" });

      // 404 from the indexer → recoverProjectContributor returns unresolved.
      globalThis.fetch = async () => emptyResponse(404);

      await __test_only__handlePollingTerminal(
        txHash,
        makeBudget404Status(txHash),
        "jwt-1",
        get,
        set,
      );

      const entry = getEntry(txHash);
      assert.equal(entry!.isTerminal, true);
      assert.equal(entry!.status?.state, "failed");
      assert.equal(entry!.status?.__reason, undefined);
      assert.match(entry!.status.last_error!, /can't find this transaction/i);
    });

    it("JWT rotated between register() and the polling terminal → fallback skipped (no fetch); handleTerminal fires with sanitized synthetic status", async () => {
      const txHash = "0xjwtrotate";
      injectEntry(txHash, PROJECT_RECOVERY);
      // Store now holds a NEW jwt; jwtAtStart is the old one.
      txWatcherStore.setState({ jwt: "new-jwt" });

      let fetchCalled = false;
      globalThis.fetch = async () => {
        fetchCalled = true;
        return emptyResponse(200);
      };

      await __test_only__handlePollingTerminal(
        txHash,
        makeBudget404Status(txHash),
        "old-jwt",
        get,
        set,
      );

      assert.equal(fetchCalled, false, "indexer fetch must NOT fire on JWT rotation");

      const entry = getEntry(txHash);
      assert.equal(entry!.isTerminal, true);
      assert.equal(entry!.status?.__reason, undefined);
      assert.equal(entry!.status?.state, "failed");
    });

    it("indexer fetch throws → caught; handleTerminal fires once with the original (sanitized) poll status", async () => {
      const txHash = "0xindexerthrows";
      injectEntry(txHash, PROJECT_RECOVERY);
      txWatcherStore.setState({ jwt: "jwt-1" });

      const warnSpy = mock.method(console, "warn", () => {});
      try {
        globalThis.fetch = async () => {
          throw new Error("network blew up");
        };

        await __test_only__handlePollingTerminal(
          txHash,
          makeBudget404Status(txHash),
          "jwt-1",
          get,
          set,
        );

        const entry = getEntry(txHash);
        assert.equal(entry!.isTerminal, true);
        assert.equal(entry!.status?.state, "failed");
        assert.equal(entry!.status?.__reason, undefined);
      } finally {
        warnSpy.mock.restore();
      }
    });

    it("budget_404 + null current JWT → fallback skipped (cannot leak unauthenticated request)", async () => {
      const txHash = "0xnulljwt";
      injectEntry(txHash, PROJECT_RECOVERY);
      txWatcherStore.setState({ jwt: null });

      let fetchCalled = false;
      globalThis.fetch = async () => {
        fetchCalled = true;
        return emptyResponse(200);
      };

      await __test_only__handlePollingTerminal(
        txHash,
        makeBudget404Status(txHash),
        null,
        get,
        set,
      );

      assert.equal(fetchCalled, false);
      const entry = getEntry(txHash);
      assert.equal(entry!.isTerminal, true);
    });

    it("non-budget_404 polling terminal → handleTerminal fires directly without consulting indexer", async () => {
      const txHash = "0xupdated";
      injectEntry(txHash, PROJECT_RECOVERY);
      txWatcherStore.setState({ jwt: "jwt-1" });

      let fetchCalled = false;
      globalThis.fetch = async () => {
        fetchCalled = true;
        return emptyResponse(200);
      };

      const successStatus: TxStatus = {
        tx_hash: txHash,
        tx_type: "",
        state: "updated",
        retry_count: 0,
      };
      await __test_only__handlePollingTerminal(
        txHash,
        successStatus,
        "jwt-1",
        get,
        set,
      );

      assert.equal(fetchCalled, false);
      const entry = getEntry(txHash);
      assert.equal(entry!.isTerminal, true);
      assert.equal(entry!.status?.state, "updated");
    });

    it("SSE complete vs polling 404 race → handleTerminal fires exactly once (idempotency holds across handlePollingTerminal)", async () => {
      // Sequential drive (not concurrent) — verifies the guard logic only.
      // Async-interleaving with an in-flight SSE stream is out of scope; this PR
      // does not exercise startWatching's live SSE loop (anti-requirement).
      const txHash = "0xrace";
      injectEntry(txHash, undefined);
      txWatcherStore.setState({ jwt: "jwt-1" });

      // First terminal: simulate SSE complete (state=updated).
      const sseStatus: TxStatus = {
        tx_hash: txHash,
        tx_type: "",
        state: "updated",
        retry_count: 0,
      };
      __test_only__handleTerminal(txHash, sseStatus, get, set);

      // Then a polling-side budget_404 fires after the SSE complete.
      // No recoveryContext → no fetch. handlePollingTerminal calls handleTerminal,
      // which suppresses the second invocation via the idempotency guard.
      await __test_only__handlePollingTerminal(
        txHash,
        makeBudget404Status(txHash),
        "jwt-1",
        get,
        set,
      );

      const entry = getEntry(txHash);
      // First terminal still wins; status is the SSE-complete "updated" state.
      assert.equal(entry!.status?.state, "updated");
      assert.equal(entry!.status?.__reason, undefined);
    });
  });
});
