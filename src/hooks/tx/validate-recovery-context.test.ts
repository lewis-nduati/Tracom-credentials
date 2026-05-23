import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import { validateRecoveryContext } from "./validate-recovery-context";
import type { TransactionType } from "~/config/transaction-ui";
import type { TxRecoveryContext } from "~/types/tx-recovery";

describe("validateRecoveryContext", () => {
  describe("happy paths — kind allows txType", () => {
    it("project_contributor ↔ PROJECT_CONTRIBUTOR_TASK_COMMIT", () => {
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
    });

    it("course_assignment ↔ COURSE_STUDENT_ASSIGNMENT_COMMIT", () => {
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
    });

    it("course_assignment ↔ COURSE_STUDENT_ASSIGNMENT_UPDATE (the #642 bug-fix pair)", () => {
      // The `update` action in use-assignment-workflow.ts:566-608 submits
      // ASSIGNMENT_UPDATE with a course_assignment recoveryContext. Before
      // #642 fixed this pair, the validator silently dropped the context, so
      // the indexer fallback path never ran for assignment-update timeouts.
      const ctx: TxRecoveryContext = {
        kind: "course_assignment",
        courseId: "c1",
        moduleCode: "m1",
        sltHash: "s1",
      };
      const result = validateRecoveryContext(
        "COURSE_STUDENT_ASSIGNMENT_UPDATE",
        ctx,
      );
      assert.deepEqual(result, ctx);
    });

    it("course_credential_claim ↔ COURSE_STUDENT_CREDENTIAL_CLAIM", () => {
      const ctx: TxRecoveryContext = {
        kind: "course_credential_claim",
        courseId: "c1",
        alias: "a1",
      };
      const result = validateRecoveryContext(
        "COURSE_STUDENT_CREDENTIAL_CLAIM",
        ctx,
      );
      assert.deepEqual(result, ctx);
    });
  });

  describe("edge cases", () => {
    it("returns undefined when context is undefined", () => {
      const result = validateRecoveryContext(
        "COURSE_STUDENT_ASSIGNMENT_COMMIT",
        undefined,
      );
      assert.equal(result, undefined);
    });
  });

  describe("error paths — mismatch is dropped with warn", () => {
    it("drops course_credential_claim against COURSE_STUDENT_ASSIGNMENT_COMMIT and warns", () => {
      const warn = mock.method(console, "warn", () => {});
      try {
        const result = validateRecoveryContext(
          "COURSE_STUDENT_ASSIGNMENT_COMMIT",
          { kind: "course_credential_claim", courseId: "c1", alias: "a1" },
        );
        assert.equal(result, undefined);
        assert.equal(warn.mock.calls.length, 1);
      } finally {
        warn.mock.restore();
      }
    });

    it("drops course_assignment against COURSE_STUDENT_CREDENTIAL_CLAIM and warns", () => {
      const warn = mock.method(console, "warn", () => {});
      try {
        const result = validateRecoveryContext(
          "COURSE_STUDENT_CREDENTIAL_CLAIM",
          {
            kind: "course_assignment",
            courseId: "c1",
            moduleCode: "m1",
            sltHash: "s1",
          },
        );
        assert.equal(result, undefined);
        assert.equal(warn.mock.calls.length, 1);
      } finally {
        warn.mock.restore();
      }
    });

    it("drops a kind against an unrelated txType (e.g. ACCESS_TOKEN_MINT)", () => {
      const warn = mock.method(console, "warn", () => {});
      try {
        const result = validateRecoveryContext(
          "GLOBAL_GENERAL_ACCESS_TOKEN_MINT",
          { kind: "project_contributor", projectId: "p1", taskHash: "t1" },
        );
        assert.equal(result, undefined);
        assert.equal(warn.mock.calls.length, 1);
      } finally {
        warn.mock.restore();
      }
    });
  });

  describe("regression — every known (kind, txType) pair returns the context unchanged", () => {
    // Compile-time exhaustiveness for kind → txTypes lives in the production
    // module: `KIND_TO_TX_TYPES satisfies Record<TxRecoveryContext["kind"],
    // readonly TransactionType[]>`. Adding a kind to TxRecoveryContext without
    // extending that mapping is a compile error there.
    //
    // This table is a runtime regression guard for the *specific* (kind, txType)
    // pairs we expect today. When you add a new kind or a new txType to an
    // existing kind, append rows here so the new pairs have explicit positive
    // coverage (typed against TransactionType so a typo in the txType field
    // is also a compile error).
    const KIND_TX_PAIRS: Array<{
      kind: TxRecoveryContext["kind"];
      txType: TransactionType;
      ctx: TxRecoveryContext;
    }> = [
      {
        kind: "project_contributor",
        txType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
        ctx: { kind: "project_contributor", projectId: "p", taskHash: "t" },
      },
      {
        kind: "course_assignment",
        txType: "COURSE_STUDENT_ASSIGNMENT_COMMIT",
        ctx: {
          kind: "course_assignment",
          courseId: "c",
          moduleCode: "m",
          sltHash: "s",
        },
      },
      {
        kind: "course_assignment",
        txType: "COURSE_STUDENT_ASSIGNMENT_UPDATE",
        ctx: {
          kind: "course_assignment",
          courseId: "c",
          moduleCode: "m",
          sltHash: "s",
        },
      },
      {
        kind: "course_credential_claim",
        txType: "COURSE_STUDENT_CREDENTIAL_CLAIM",
        ctx: { kind: "course_credential_claim", courseId: "c", alias: "a" },
      },
    ];

    for (const { kind, txType, ctx } of KIND_TX_PAIRS) {
      it(`${kind} ↔ ${txType} returns the context unchanged`, () => {
        const result = validateRecoveryContext(txType, ctx);
        assert.deepEqual(result, ctx);
      });
    }
  });
});
