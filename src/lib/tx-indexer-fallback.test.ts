import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import {
  recoverProjectContributor,
  recoverCourseAssignment,
  runIndexerFallback,
} from "./tx-indexer-fallback";
import type { TxRecoveryContext } from "~/types/tx-recovery";

const PROJECT_CTX = { projectId: "project123", taskHash: "task-hash-xyz" };
const COURSE_CTX = {
  courseId: "course-1",
  moduleCode: "101",
  sltHash: "slt-1",
};
const TX_HASH = "tx-abc";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function emptyResponse(status: number): Response {
  return new Response("", { status });
}

describe("tx-indexer-fallback", () => {
  describe("recoverProjectContributor", () => {
    it("happy path — resolves as updated when commitment links and status is COMMITTED", async () => {
      const fetcher = async () =>
        jsonResponse({
          data: {
            submission_tx: TX_HASH,
            content: { commitment_status: "COMMITTED" },
          },
        });
      const result = await recoverProjectContributor(
        PROJECT_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "resolved", state: "updated" });
    });

    it("returns unresolved when authenticatedFetch throws synchronously", async () => {
      const fetcher = async () => {
        throw new Error("network down");
      };
      const result = await recoverProjectContributor(
        PROJECT_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "unresolved" });
    });

    it("returns unresolved when fetch hangs past the 15s timeout (#501)", async () => {
      mock.timers.enable({ apis: ["setTimeout"] });
      try {
        const fetcher = () =>
          new Promise<Response>(() => {
            /* never resolves */
          });
        const pending = recoverProjectContributor(
          PROJECT_CTX,
          TX_HASH,
          fetcher,
        );
        mock.timers.tick(15_000);
        const result = await pending;
        assert.deepEqual(result, { kind: "unresolved" });
      } finally {
        mock.timers.reset();
      }
    });

    it("resolves(updated) when content.pending_tx_hash matches and commitment_status is COMMITTED (no submission_tx)", async () => {
      const fetcher = async () =>
        jsonResponse({
          data: {
            submission_tx: undefined,
            content: {
              pending_tx_hash: TX_HASH,
              commitment_status: "COMMITTED",
            },
          },
        });
      const result = await recoverProjectContributor(
        PROJECT_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "resolved", state: "updated" });
    });

    it("resolves(failed) with last_error when submission_tx matches and status is DRAFT", async () => {
      const fetcher = async () =>
        jsonResponse({
          data: {
            submission_tx: TX_HASH,
            content: { commitment_status: "DRAFT" },
          },
        });
      const result = await recoverProjectContributor(
        PROJECT_CTX,
        TX_HASH,
        fetcher,
      );
      assert.equal(result.kind, "resolved");
      if (result.kind === "resolved") {
        assert.equal(result.state, "failed");
        assert.equal(typeof result.last_error, "string");
        assert.ok(
          (result.last_error ?? "").length > 0,
          "last_error should be a human-readable sentence",
        );
      }
    });

    it("returns unresolved when status is PENDING_TX_COMMIT (still confirming)", async () => {
      const fetcher = async () =>
        jsonResponse({
          data: {
            submission_tx: TX_HASH,
            content: { commitment_status: "PENDING_TX_COMMIT" },
          },
        });
      const result = await recoverProjectContributor(
        PROJECT_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "unresolved" });
    });

    it("returns unresolved when neither submission_tx nor content.pending_tx_hash links to txHash (linkage mismatch)", async () => {
      const fetcher = async () =>
        jsonResponse({
          data: {
            submission_tx: "different-tx",
            content: {
              pending_tx_hash: "another-tx",
              commitment_status: "COMMITTED",
            },
          },
        });
      const result = await recoverProjectContributor(
        PROJECT_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "unresolved" });
    });

    it("returns unresolved when endpoint returns 404", async () => {
      const fetcher = async () => emptyResponse(404);
      const result = await recoverProjectContributor(
        PROJECT_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "unresolved" });
    });

    it("returns unresolved on 401", async () => {
      const fetcher = async () => emptyResponse(401);
      const result = await recoverProjectContributor(
        PROJECT_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "unresolved" });
    });

    it("returns unresolved on non-2xx (e.g., 500)", async () => {
      const fetcher = async () => emptyResponse(500);
      const result = await recoverProjectContributor(
        PROJECT_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "unresolved" });
    });
  });

  describe("recoverCourseAssignment", () => {
    it("returns unresolved when fetch hangs past the 15s timeout (#501)", async () => {
      mock.timers.enable({ apis: ["setTimeout"] });
      try {
        const fetcher = () =>
          new Promise<Response>(() => {
            /* never resolves */
          });
        const pending = recoverCourseAssignment(COURSE_CTX, TX_HASH, fetcher);
        mock.timers.tick(15_000);
        const result = await pending;
        assert.deepEqual(result, { kind: "unresolved" });
      } finally {
        mock.timers.reset();
      }
    });

    it("resolves(updated) when on_chain_status is PENDING_APPROVAL (commit landed on-chain)", async () => {
      const fetcher = async () =>
        jsonResponse({
          data: {
            on_chain_status: "PENDING_APPROVAL",
            content: {},
          },
        });
      const result = await recoverCourseAssignment(
        COURSE_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "resolved", state: "updated" });
    });

    it("returns unresolved for terminal-assessor status (ASSIGNMENT_REFUSED) — implies a prior commitment", async () => {
      const fetcher = async () =>
        jsonResponse({
          data: {
            on_chain_status: "ASSIGNMENT_REFUSED",
            content: { commitment_status: "ASSIGNMENT_REFUSED" },
          },
        });
      const result = await recoverCourseAssignment(
        COURSE_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "unresolved" });
    });

    it("returns unresolved when BOTH commitment_status and on_chain_status are absent (sparse response — must NOT auto-resolve)", async () => {
      const fetcher = async () =>
        jsonResponse({
          data: {
            content: {},
          },
        });
      const result = await recoverCourseAssignment(
        COURSE_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "unresolved" });
    });

    it("returns unresolved when on_chain_status is AWAITING_SUBMISSION (no commit attempted yet)", async () => {
      const fetcher = async () =>
        jsonResponse({
          data: {
            on_chain_status: "AWAITING_SUBMISSION",
            content: {},
          },
        });
      const result = await recoverCourseAssignment(
        COURSE_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "unresolved" });
    });

    it("returns unresolved when fetcher throws (network down)", async () => {
      const fetcher = async () => {
        throw new Error("network down");
      };
      const result = await recoverCourseAssignment(
        COURSE_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "unresolved" });
    });

    it("returns unresolved on 401", async () => {
      const fetcher = async () => emptyResponse(401);
      const result = await recoverCourseAssignment(
        COURSE_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "unresolved" });
    });

    it("returns unresolved on non-2xx (e.g., 500)", async () => {
      const fetcher = async () => emptyResponse(500);
      const result = await recoverCourseAssignment(
        COURSE_CTX,
        TX_HASH,
        fetcher,
      );
      assert.deepEqual(result, { kind: "unresolved" });
    });
  });

  describe("runIndexerFallback dispatcher", () => {
    it("routes course_assignment to recoverCourseAssignment", async () => {
      const ctx: TxRecoveryContext = {
        kind: "course_assignment",
        courseId: "c1",
        moduleCode: "m1",
        sltHash: "s1",
      };
      const fetcher = async () =>
        jsonResponse({
          data: { on_chain_status: "PENDING_APPROVAL", content: {} },
        });
      const result = await runIndexerFallback(ctx, TX_HASH, fetcher);
      assert.deepEqual(result, { kind: "resolved", state: "updated" });
    });

    it("routes project_contributor to recoverProjectContributor", async () => {
      const ctx: TxRecoveryContext = {
        kind: "project_contributor",
        projectId: "p1",
        taskHash: "t1",
      };
      const fetcher = async () =>
        jsonResponse({
          data: {
            submission_tx: TX_HASH,
            content: { commitment_status: "COMMITTED" },
          },
        });
      const result = await runIndexerFallback(ctx, TX_HASH, fetcher);
      assert.deepEqual(result, { kind: "resolved", state: "updated" });
    });

    it("exhaustiveness — adding a new TxRecoveryContext variant must be a TypeScript error", async () => {
      // Compile-only check: assigning a fake "kind" to TxRecoveryContext is a type
      // error today because the union is closed. If a maintainer adds a new variant
      // to TxRecoveryContext without updating runIndexerFallback's switch, the
      // `_exhaustive: never` line in the default branch will fail to typecheck.
      // We assert that proof here: the @ts-expect-error must remain "expected"
      // (i.e., the assignment is genuinely an error today).
      // @ts-expect-error — "fake" is not a member of the TxRecoveryContext union
      const fake: TxRecoveryContext = { kind: "fake" };
      // Runtime smoke test: dispatcher returns unresolved for unknown variants
      // without throwing, so production stays safe even if a future bug bypasses
      // the type check.
      const fetcher = async () => emptyResponse(404);
      const result = await runIndexerFallback(
        fake,
        TX_HASH,
        fetcher,
      );
      assert.equal(result.kind, "unresolved");
    });
  });
});
