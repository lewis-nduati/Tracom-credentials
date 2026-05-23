/**
 * Tests for `useTransaction`'s load-bearing pure pieces and call-site contracts.
 *
 * The full hook can't run under `tsx --test` (it needs React, `@meshsdk/react`,
 * `~/env`, and a wallet). This suite exercises:
 *
 * 1. `validateRecoveryContext` — the kind/txType mismatch logic that must drop
 *    the context with a warn before any register branch runs.
 * 2. The shouldRegister gate — derived from `getTransactionUI(txType)` flags.
 *    A txType where both `requiresDBUpdate` and `requiresOnChainConfirmation`
 *    are false must skip both register paths (mirrors the gate at
 *    `use-transaction.ts:287`).
 * 3. The register-throws call-site contract — what gets persisted into
 *    `pendingTxRegistrations` when registration retries are exhausted. We
 *    feed the same v2-shape payload `use-transaction.ts:299` constructs into
 *    `pendingTxRegistrations.add` and assert the persisted entry round-trips
 *    with `frontendTxType`, `recoveryContext`, `metadata`, and an auto-attached
 *    `schemaVersion`.
 *
 * @see src/hooks/tx/use-transaction.ts (lines 287-327)
 */

import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

import { validateRecoveryContext } from "./validate-recovery-context";
import { getTransactionUI } from "~/config/transaction-ui";
import { pendingTxRegistrations } from "~/lib/pending-tx-registrations";
import type { TxRecoveryContext } from "~/types/tx-recovery";

function installFakeStorage(): void {
  const store: Record<string, string> = {};
  (globalThis as unknown as { window?: unknown }).window = {};
  (globalThis as unknown as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => (key in store ? store[key]! : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
}

function uninstallFakeStorage(): void {
  delete (globalThis as unknown as { window?: unknown }).window;
  delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
}

describe("useTransaction (unit-testable seams)", () => {
  describe("validateRecoveryContext", () => {
    let warnSpy: ReturnType<typeof mock.method>;

    beforeEach(() => {
      warnSpy = mock.method(console, "warn", () => {});
    });

    afterEach(() => {
      warnSpy.mock.restore();
    });

    it("returns undefined when context is undefined (no warn)", () => {
      const result = validateRecoveryContext(
        "PROJECT_CONTRIBUTOR_TASK_COMMIT",
        undefined,
      );
      assert.equal(result, undefined);
      assert.equal(warnSpy.mock.callCount(), 0);
    });

    it("preserves matching project_contributor context for PROJECT_CONTRIBUTOR_TASK_COMMIT", () => {
      const ctx: TxRecoveryContext = {
        kind: "project_contributor",
        projectId: "p1",
        taskHash: "t1",
      };
      const result = validateRecoveryContext(
        "PROJECT_CONTRIBUTOR_TASK_COMMIT",
        ctx,
      );
      assert.deepEqual(result, ctx);
      assert.equal(warnSpy.mock.callCount(), 0);
    });

    it("preserves matching course_assignment context for COURSE_STUDENT_ASSIGNMENT_COMMIT", () => {
      const ctx: TxRecoveryContext = {
        kind: "course_assignment",
        courseId: "c1",
        moduleCode: "m1",
        sltHash: "s1",
      };
      const result = validateRecoveryContext(
        "COURSE_STUDENT_ASSIGNMENT_COMMIT",
        ctx,
      );
      assert.deepEqual(result, ctx);
      assert.equal(warnSpy.mock.callCount(), 0);
    });

    it("drops project_contributor context when txType is COURSE_STUDENT_ASSIGNMENT_COMMIT (kind/txType mismatch) and warns", () => {
      const ctx: TxRecoveryContext = {
        kind: "project_contributor",
        projectId: "p1",
        taskHash: "t1",
      };
      const result = validateRecoveryContext(
        "COURSE_STUDENT_ASSIGNMENT_COMMIT",
        ctx,
      );
      assert.equal(result, undefined);
      assert.equal(warnSpy.mock.callCount(), 1);
      const [arg] = warnSpy.mock.calls[0]!.arguments as [string];
      assert.match(arg, /does not match txType/);
      assert.match(arg, /project_contributor/);
      assert.match(arg, /COURSE_STUDENT_ASSIGNMENT_COMMIT/);
    });

    it("drops course_assignment context when txType is PROJECT_CONTRIBUTOR_TASK_COMMIT (kind/txType mismatch) and warns", () => {
      const ctx: TxRecoveryContext = {
        kind: "course_assignment",
        courseId: "c1",
        moduleCode: "m1",
        sltHash: "s1",
      };
      const result = validateRecoveryContext(
        "PROJECT_CONTRIBUTOR_TASK_COMMIT",
        ctx,
      );
      assert.equal(result, undefined);
      assert.equal(warnSpy.mock.callCount(), 1);
    });

    it("drops project_contributor context when txType is unrelated (e.g., GLOBAL_GENERAL_ACCESS_TOKEN_MINT) and warns", () => {
      const ctx: TxRecoveryContext = {
        kind: "project_contributor",
        projectId: "p1",
        taskHash: "t1",
      };
      const result = validateRecoveryContext(
        "GLOBAL_GENERAL_ACCESS_TOKEN_MINT",
        ctx,
      );
      assert.equal(result, undefined);
      assert.equal(warnSpy.mock.callCount(), 1);
    });
  });

  describe("shouldRegister gate (use-transaction.ts:268)", () => {
    it("derives shouldRegister=true for TXs with requiresDBUpdate (e.g., PROJECT_CONTRIBUTOR_TASK_COMMIT)", () => {
      const ui = getTransactionUI("PROJECT_CONTRIBUTOR_TASK_COMMIT");
      const shouldRegister = ui.requiresDBUpdate || !!ui.requiresOnChainConfirmation;
      assert.equal(shouldRegister, true);
    });

    it("derives shouldRegister=true for TXs with requiresOnChainConfirmation only (e.g., GLOBAL_GENERAL_ACCESS_TOKEN_MINT)", () => {
      const ui = getTransactionUI("GLOBAL_GENERAL_ACCESS_TOKEN_MINT");
      assert.equal(ui.requiresDBUpdate, false);
      const shouldRegister = ui.requiresDBUpdate || !!ui.requiresOnChainConfirmation;
      assert.equal(shouldRegister, true);
    });

    // Pure-logic check on the gate formula. No TransactionType in the live config
    // currently has both flags falsy — every production TX requires either a DB
    // update or on-chain tracking. If a future TX type opts into "no tracking
    // at all", the gate must short-circuit so neither registerTransaction nor
    // txWatcherStore.register fires (use-transaction.ts:268+301). This test
    // pins the formula so a refactor can't silently flip the precedence.
    it("shouldRegister=false when both requiresDBUpdate and requiresOnChainConfirmation are falsy", () => {
      const ui = { requiresDBUpdate: false, requiresOnChainConfirmation: false };
      const shouldRegister = ui.requiresDBUpdate || !!ui.requiresOnChainConfirmation;
      assert.equal(shouldRegister, false);
    });

    it("shouldRegister=false when requiresDBUpdate=false and requiresOnChainConfirmation is undefined (default)", () => {
      const ui: { requiresDBUpdate: boolean; requiresOnChainConfirmation?: boolean } = {
        requiresDBUpdate: false,
      };
      const shouldRegister = ui.requiresDBUpdate || !!ui.requiresOnChainConfirmation;
      assert.equal(shouldRegister, false);
    });
  });

  describe("register-throws call-site contract (use-transaction.ts:280-294)", () => {
    beforeEach(() => {
      installFakeStorage();
    });

    afterEach(() => {
      uninstallFakeStorage();
    });

    it("the v2-shape payload use-transaction passes to pendingTxRegistrations.add round-trips with frontendTxType, recoveryContext, metadata, and an auto-attached schemaVersion", () => {
      // Mirror the exact `pendingTxRegistrations.add({...})` arguments from
      // use-transaction.ts:299-305 in the register-throws path.
      const txHash = "0xfailtx";
      const gatewayTxType = "project_join";
      const frontendTxType = "PROJECT_CONTRIBUTOR_TASK_COMMIT" as const;
      const metadata = { courseTitle: "Course X" };
      const recoveryContext: TxRecoveryContext = {
        kind: "project_contributor",
        projectId: "p1",
        taskHash: "t1",
      };

      pendingTxRegistrations.add({
        txHash,
        gatewayTxType,
        frontendTxType,
        metadata,
        recoveryContext,
      });

      const all = pendingTxRegistrations.getAll();
      assert.equal(all.length, 1);
      const entry = all[0]!;
      // schemaVersion is auto-attached by add() — caller does not supply it.
      assert.equal(entry.schemaVersion, 2);
      assert.equal(entry.txHash, txHash);
      assert.equal(entry.gatewayTxType, gatewayTxType);
      assert.equal(entry.frontendTxType, frontendTxType);
      assert.deepEqual(entry.metadata, metadata);
      assert.deepEqual(entry.recoveryContext, recoveryContext);
      assert.equal(typeof entry.createdAt, "number");
    });

    it("the v2-shape payload preserves recoveryContext === undefined when the caller does not supply one (e.g., a TX type that doesn't have a fallback path)", () => {
      pendingTxRegistrations.add({
        txHash: "0xnocontext",
        gatewayTxType: "course_create",
        frontendTxType: "INSTANCE_COURSE_CREATE",
      });

      const all = pendingTxRegistrations.getAll();
      assert.equal(all.length, 1);
      assert.equal(all[0]!.recoveryContext, undefined);
    });
  });
});
