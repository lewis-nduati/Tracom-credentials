import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

import {
  runPendingTxRecovery,
  type RegisterFn,
  type WatcherRegisterFn,
  type ToastApi,
} from "./recover-pending-transactions";
import type { PendingTxRegistration } from "~/lib/pending-tx-registrations";
import type { TxToastConfig } from "~/stores/tx-watcher-store";

const TOAST_CONFIG: TxToastConfig = {
  successTitle: "Done",
  successDescription: "Transaction confirmed.",
  errorTitle: "Failed",
};

function makeEntry(
  overrides: Partial<PendingTxRegistration> = {},
): PendingTxRegistration {
  return {
    schemaVersion: 2,
    txHash: "0xtxhashabcdef",
    gatewayTxType: "project_join",
    frontendTxType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
    metadata: { foo: "bar" },
    recoveryContext: {
      kind: "project_contributor",
      projectId: "p1",
      taskHash: "t1",
    },
    createdAt: Date.now(),
    ...overrides,
  };
}

interface RegisterCall {
  txHash: string;
  gatewayTxType: string;
  jwt: string;
  metadata?: Record<string, string>;
  diagnosticTag?: string;
}

interface WatcherCall {
  txHash: string;
  txType: string;
  toastConfig: TxToastConfig;
  recoveryContext?: PendingTxRegistration["recoveryContext"];
}

describe("runPendingTxRecovery", () => {
  let registerCalls: RegisterCall[];
  let watcherCalls: WatcherCall[];
  let removeCalls: string[];
  let toastSuccessCalls: { title: string; description?: string }[];
  let logSpy: ReturnType<typeof mock.method>;
  let warnSpy: ReturnType<typeof mock.method>;

  beforeEach(() => {
    registerCalls = [];
    watcherCalls = [];
    removeCalls = [];
    toastSuccessCalls = [];
    logSpy = mock.method(console, "log", () => {});
    warnSpy = mock.method(console, "warn", () => {});
  });

  afterEach(() => {
    logSpy.mock.restore();
    warnSpy.mock.restore();
  });

  function makeRegisterFn(behavior: "ok" | "throws"): RegisterFn {
    return async (txHash, gatewayTxType, jwt, metadata, diagnosticTag) => {
      registerCalls.push({ txHash, gatewayTxType, jwt, metadata, diagnosticTag });
      if (behavior === "throws") {
        throw new Error(`registerFn threw for ${txHash}`);
      }
    };
  }

  const watcherRegister: WatcherRegisterFn = (
    txHash,
    txType,
    toastConfig,
    recoveryContext,
  ) => {
    watcherCalls.push({ txHash, txType, toastConfig, recoveryContext });
  };

  const removePending = (txHash: string) => {
    removeCalls.push(txHash);
  };

  const fakeToast: ToastApi = {
    success: (title, options) => {
      toastSuccessCalls.push({ title, description: options?.description });
    },
  };

  const buildToastConfigFn = (_txType: string): TxToastConfig => TOAST_CONFIG;

  it("success path — registerFn → watcherRegister(with frontendTxType, recoveryContext, toastConfig) → removePending → toast.success", async () => {
    const entry = makeEntry();
    await runPendingTxRecovery({
      jwt: "jwt-1",
      registerFn: makeRegisterFn("ok"),
      watcherRegister,
      getPending: () => [entry],
      removePending,
      buildToastConfigFn,
      toast: fakeToast,
    });

    // registerFn called exactly once with the entry's gatewayTxType + jwt.
    assert.equal(registerCalls.length, 1);
    assert.deepEqual(registerCalls[0], {
      txHash: entry.txHash,
      gatewayTxType: entry.gatewayTxType,
      jwt: "jwt-1",
      metadata: entry.metadata,
      diagnosticTag: "tx-register-recovery-failure",
    });

    // watcherRegister called with the persisted frontendTxType + recoveryContext
    // and the buildToastConfigFn output.
    assert.equal(watcherCalls.length, 1);
    assert.equal(watcherCalls[0]!.txHash, entry.txHash);
    assert.equal(watcherCalls[0]!.txType, entry.frontendTxType);
    assert.deepEqual(watcherCalls[0]!.toastConfig, TOAST_CONFIG);
    assert.deepEqual(watcherCalls[0]!.recoveryContext, entry.recoveryContext);

    // removePending called after watcherRegister succeeded.
    assert.deepEqual(removeCalls, [entry.txHash]);

    // toast.success fired once with the correct copy.
    assert.equal(toastSuccessCalls.length, 1);
    assert.equal(toastSuccessCalls[0]!.title, "Recovered pending transaction");
    assert.match(toastSuccessCalls[0]!.description ?? "", /Transaction 0xtxhash/);
  });

  it("failure path — registerFn throws → entry stays (no removePending), watcherRegister NOT called, no toast.success, helper signals failure via onEntryFailed", async () => {
    const entry = makeEntry();
    let failureSignaled: { txHash: string; error: unknown } | null = null;
    await runPendingTxRecovery({
      jwt: "jwt-1",
      registerFn: makeRegisterFn("throws"),
      watcherRegister,
      getPending: () => [entry],
      removePending,
      buildToastConfigFn,
      toast: fakeToast,
      onEntryFailed: (txHash, error) => {
        failureSignaled = { txHash, error };
      },
    });

    assert.equal(registerCalls.length, 1);
    assert.equal(watcherCalls.length, 0);
    assert.deepEqual(removeCalls, []);
    assert.equal(toastSuccessCalls.length, 0);

    assert.ok(failureSignaled, "onEntryFailed should fire on registerFn rejection");
    assert.equal(
      (failureSignaled as { txHash: string }).txHash,
      entry.txHash,
    );
  });

  it("entry with recoveryContext === undefined still triggers watcherRegister (recoveryContext is optional in the store API)", async () => {
    const entry = makeEntry({ recoveryContext: undefined });
    await runPendingTxRecovery({
      jwt: "jwt-1",
      registerFn: makeRegisterFn("ok"),
      watcherRegister,
      getPending: () => [entry],
      removePending,
      buildToastConfigFn,
      toast: fakeToast,
    });

    assert.equal(watcherCalls.length, 1);
    assert.equal(watcherCalls[0]!.recoveryContext, undefined);
    assert.equal(toastSuccessCalls.length, 1);
  });

  it("per-entry independence — one failure does not block other entries", async () => {
    const ok1 = makeEntry({ txHash: "0xok1" });
    const bad = makeEntry({ txHash: "0xbad" });
    const ok2 = makeEntry({ txHash: "0xok2" });

    // registerFn succeeds for txHashes containing "ok", throws for "bad".
    const registerFn: RegisterFn = async (txHash, gatewayTxType, jwt, metadata, diagnosticTag) => {
      registerCalls.push({ txHash, gatewayTxType, jwt, metadata, diagnosticTag });
      if (txHash.includes("bad")) throw new Error("nope");
    };

    let onFailedCount = 0;
    await runPendingTxRecovery({
      jwt: "jwt-1",
      registerFn,
      watcherRegister,
      getPending: () => [ok1, bad, ok2],
      removePending,
      buildToastConfigFn,
      toast: fakeToast,
      onEntryFailed: () => {
        onFailedCount++;
      },
    });

    // All three entries had registerFn invoked.
    assert.equal(registerCalls.length, 3);
    // The two "ok" entries successfully proceeded all the way through removePending.
    assert.deepEqual(
      [...removeCalls].sort(),
      ["0xok1", "0xok2"].sort(),
    );
    assert.equal(watcherCalls.length, 2);
    assert.equal(toastSuccessCalls.length, 2);
    // The "bad" entry signaled failure exactly once.
    assert.equal(onFailedCount, 1);
  });

  it("isAborted true short-circuits — no registerFn calls, no watcherRegister, no toast", async () => {
    const entry = makeEntry();
    await runPendingTxRecovery({
      jwt: "jwt-1",
      registerFn: makeRegisterFn("ok"),
      watcherRegister,
      getPending: () => [entry],
      removePending,
      buildToastConfigFn,
      toast: fakeToast,
      isAborted: () => true,
    });

    assert.equal(registerCalls.length, 0);
    assert.equal(watcherCalls.length, 0);
    assert.deepEqual(removeCalls, []);
    assert.equal(toastSuccessCalls.length, 0);
  });

  it("empty pending list — no calls at all (early return)", async () => {
    await runPendingTxRecovery({
      jwt: "jwt-1",
      registerFn: makeRegisterFn("ok"),
      watcherRegister,
      getPending: () => [],
      removePending,
      buildToastConfigFn,
      toast: fakeToast,
    });

    assert.equal(registerCalls.length, 0);
    assert.equal(watcherCalls.length, 0);
    assert.equal(toastSuccessCalls.length, 0);
  });
});
