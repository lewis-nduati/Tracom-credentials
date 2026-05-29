/**
 * Tests for the access-token in-flight gate predicate.
 *
 * This is the logic behind the multi-mint fix: a non-terminal access-token
 * transaction (fresh mint or v1→v2 claim) must block a second acquisition
 * during the on-chain confirmation window. The hook itself is a thin
 * useSyncExternalStore wrapper, so we test the extracted pure predicate.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { selectHasPendingAccessTokenTx } from "./use-pending-access-token-tx";

interface Tx {
  txType: string;
  isTerminal: boolean;
}

const MINT = "GLOBAL_GENERAL_ACCESS_TOKEN_MINT";
const CLAIM = "GLOBAL_USER_ACCESS_TOKEN_CLAIM";

describe("selectHasPendingAccessTokenTx", () => {
  it("returns false when there are no transactions", () => {
    assert.equal(selectHasPendingAccessTokenTx([]), false);
  });

  it("returns true for a non-terminal mint", () => {
    const txs: Tx[] = [{ txType: MINT, isTerminal: false }];
    assert.equal(selectHasPendingAccessTokenTx(txs), true);
  });

  it("returns true for a non-terminal v1→v2 claim", () => {
    const txs: Tx[] = [{ txType: CLAIM, isTerminal: false }];
    assert.equal(selectHasPendingAccessTokenTx(txs), true);
  });

  it("returns false once the mint is terminal (so retries/success aren't blocked)", () => {
    const txs: Tx[] = [{ txType: MINT, isTerminal: true }];
    assert.equal(selectHasPendingAccessTokenTx(txs), false);
  });

  it("returns false for an in-flight non-access-token transaction", () => {
    const txs: Tx[] = [
      { txType: "INSTANCE_COURSE_CREATE", isTerminal: false },
      { txType: "COURSE_STUDENT_CREDENTIAL_CLAIM", isTerminal: false },
    ];
    assert.equal(selectHasPendingAccessTokenTx(txs), false);
  });

  it("returns true when an access-token tx is in flight alongside terminal/other txs", () => {
    const txs: Tx[] = [
      { txType: "INSTANCE_COURSE_CREATE", isTerminal: false },
      { txType: MINT, isTerminal: true },
      { txType: CLAIM, isTerminal: false },
    ];
    assert.equal(selectHasPendingAccessTokenTx(txs), true);
  });

  it("returns false when every access-token tx has reached a terminal state", () => {
    const txs: Tx[] = [
      { txType: MINT, isTerminal: true },
      { txType: CLAIM, isTerminal: true },
    ];
    assert.equal(selectHasPendingAccessTokenTx(txs), false);
  });

  it("accepts a Map values() iterator (the store's real shape)", () => {
    const map = new Map<string, Tx>([
      ["hash1", { txType: MINT, isTerminal: false }],
    ]);
    assert.equal(selectHasPendingAccessTokenTx(map.values()), true);
  });
});
