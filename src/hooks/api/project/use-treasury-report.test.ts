import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { computeTreasuryReport } from "./use-treasury-report";
import type {
  ProjectDetail,
  ProjectAssessment,
  ProjectSubmission,
  Task,
  TreasuryFunding,
} from "./use-project";
import type { ManagerCommitment } from "./use-project-manager";

const PROJECT_ID = "674da142";

function task(overrides: Partial<Task> = {}): Task {
  return {
    taskHash: "task-a",
    projectId: PROJECT_ID,
    title: "Design",
    description: "",
    status: "ACTIVE" as Task["status"],
    commitmentCount: 0,
    lovelaceAmount: "10000000",
    preAssignedAlias: null,
    ...overrides,
  };
}

function submission(
  overrides: Partial<ProjectSubmission> = {},
): ProjectSubmission {
  return {
    taskHash: "task-a",
    submittedBy: "alice",
    submissionTx: "tx-sub-1",
    slot: 100,
    ...overrides,
  };
}

function assessment(
  overrides: Partial<ProjectAssessment> = {},
): ProjectAssessment {
  return {
    taskHash: "task-a",
    assessedBy: "manager",
    decision: "ACCEPTED",
    slot: 200,
    ...overrides,
  };
}

function funding(overrides: Partial<TreasuryFunding> = {}): TreasuryFunding {
  return {
    alias: "funder",
    lovelaceAmount: 100_000_000,
    slot: 50,
    ...overrides,
  };
}

function projectDetail(overrides: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    projectId: PROJECT_ID,
    status: "ACTIVE" as ProjectDetail["status"],
    title: "Sustain and Maintain",
    description: "",
    tasks: [],
    submissions: [],
    assessments: [],
    contributors: [],
    treasuryFundings: [],
    treasuryBalance: 0,
    ...overrides,
  };
}

function commitment(
  overrides: Partial<ManagerCommitment> = {},
): ManagerCommitment {
  return {
    projectId: PROJECT_ID,
    taskHash: "task-a",
    submittedBy: "alice",
    status: "active",
    commitmentStatus: "COMMITTED",
    ...overrides,
  };
}

describe("computeTreasuryReport", () => {
  it("returns null when treasuryFundings is missing", () => {
    assert.equal(
      computeTreasuryReport(
        { ...projectDetail(), treasuryFundings: undefined },
        [],
      ),
      null,
    );
    assert.equal(computeTreasuryReport(null, []), null);
    assert.equal(computeTreasuryReport(undefined, []), null);
  });

  // Regression: the pre-fix hook sourced task rewards and submitter aliases
  // from `allCommitments` (manager API — pending only). For a project whose
  // accepted tasks were no longer pending, every row on the activity log
  // rendered contributor="unknown" and reward=0.00 ADA (GH bug 2026-04-19).
  it("populates rewards and contributors from projectDetail, not allCommitments", () => {
    const detail = projectDetail({
      treasuryFundings: [funding()],
      tasks: [task({ taskHash: "task-a", lovelaceAmount: "25000000" })],
      submissions: [submission({ taskHash: "task-a", submittedBy: "alice" })],
      assessments: [assessment({ taskHash: "task-a", decision: "ACCEPTED" })],
    });

    // Empty pending commitments — mirrors the reported project state.
    const result = computeTreasuryReport(detail, []);
    assert.ok(result);

    assert.equal(result.summary.rewardsDistributed, 25_000_000);
    assert.equal(result.summary.platformFee, 250_000);
    assert.equal(result.summary.tasksCompleted, 1);

    assert.equal(result.taskActivityLog.length, 1);
    assert.equal(result.taskActivityLog[0]?.contributor, "alice");
    assert.equal(result.taskActivityLog[0]?.reward, 25_000_000);
    assert.equal(result.taskActivityLog[0]?.approvedBy, "manager");

    assert.equal(result.acceptedCommitments.length, 1);
    assert.equal(result.acceptedCommitments[0]?.submittedBy, "alice");
    assert.equal(result.acceptedCommitments[0]?.lovelaceAmount, 25_000_000);
  });

  it("rolls monthly rewardsPaid and platformFee off the on-chain task amount", () => {
    const detail = projectDetail({
      treasuryFundings: [funding({ slot: 50, lovelaceAmount: 100_000_000 })],
      tasks: [task({ taskHash: "task-a", lovelaceAmount: "40000000" })],
      submissions: [submission({ taskHash: "task-a", slot: 100 })],
      assessments: [assessment({ taskHash: "task-a", slot: 200 })],
    });

    const result = computeTreasuryReport(detail, []);
    assert.ok(result);
    assert.equal(result.monthly.length > 0, true);
    const total = result.monthly.reduce((s, m) => s + m.rewardsPaid, 0);
    assert.equal(total, 40_000_000);
    const feeTotal = result.monthly.reduce((s, m) => s + m.platformFee, 0);
    assert.equal(feeTotal, 400_000);
  });

  it("uses the latest submission per taskHash when picking contributor", () => {
    const detail = projectDetail({
      treasuryFundings: [funding()],
      tasks: [task({ taskHash: "task-a", lovelaceAmount: "5000000" })],
      submissions: [
        submission({ taskHash: "task-a", submittedBy: "old", slot: 100 }),
        submission({ taskHash: "task-a", submittedBy: "new", slot: 500 }),
      ],
      assessments: [assessment({ taskHash: "task-a", slot: 600 })],
    });

    const result = computeTreasuryReport(detail, []);
    assert.equal(result?.taskActivityLog[0]?.contributor, "new");
    assert.equal(result?.acceptedCommitments[0]?.submittedBy, "new");
  });

  it("falls back to 'unknown' when no submission matches the accepted assessment", () => {
    const detail = projectDetail({
      treasuryFundings: [funding()],
      tasks: [task({ taskHash: "task-a", lovelaceAmount: "5000000" })],
      submissions: [],
      assessments: [assessment({ taskHash: "task-a" })],
    });

    const result = computeTreasuryReport(detail, []);
    assert.equal(result?.taskActivityLog[0]?.contributor, "unknown");
    // No submitter means the task is excluded from the contributor breakdown
    // (can't attribute earnings to an alias).
    assert.equal(result?.acceptedCommitments.length, 0);
  });

  it("falls back to 0 reward when the task is not present on projectDetail.tasks", () => {
    const detail = projectDetail({
      treasuryFundings: [funding()],
      tasks: [], // accepted assessment for a task that was removed/archived
      submissions: [submission({ taskHash: "task-a", submittedBy: "alice" })],
      assessments: [assessment({ taskHash: "task-a" })],
    });

    const result = computeTreasuryReport(detail, []);
    assert.equal(result?.taskActivityLog[0]?.reward, 0);
    assert.equal(result?.summary.rewardsDistributed, 0);
  });

  it("skips tasks whose lovelaceAmount is non-numeric", () => {
    const detail = projectDetail({
      treasuryFundings: [funding()],
      tasks: [task({ taskHash: "task-a", lovelaceAmount: "not-a-number" })],
      submissions: [submission({ taskHash: "task-a" })],
      assessments: [assessment({ taskHash: "task-a" })],
    });

    const result = computeTreasuryReport(detail, []);
    assert.equal(result?.taskActivityLog[0]?.reward, 0);
  });

  // The manager commitments API is authoritative for COMMITTED (pending) items
  // only; rewards and submitter aliases for accepted tasks come from on-chain
  // projectDetail. This test guards the one remaining use of allCommitments.
  it("counts COMMITTED entries from allCommitments as tasksPending", () => {
    const detail = projectDetail({ treasuryFundings: [funding()] });
    const commitments = [
      commitment({ commitmentStatus: "COMMITTED" }),
      commitment({ commitmentStatus: "COMMITTED", submittedBy: "bob" }),
      commitment({ commitmentStatus: "AWAITING_SUBMISSION" }),
    ];
    const result = computeTreasuryReport(detail, commitments);
    assert.equal(result?.summary.tasksPending, 2);
  });

  it("ignores non-ACCEPTED assessments", () => {
    const detail = projectDetail({
      treasuryFundings: [funding()],
      tasks: [task({ lovelaceAmount: "5000000" })],
      submissions: [submission()],
      assessments: [
        assessment({ taskHash: "task-a", decision: "REFUSED" }),
        assessment({ taskHash: "task-b", decision: "DENIED" }),
      ],
    });

    const result = computeTreasuryReport(detail, []);
    assert.equal(result?.summary.rewardsDistributed, 0);
    assert.equal(result?.summary.tasksCompleted, 0);
    assert.equal(result?.taskActivityLog.length, 0);
  });

  it("skips submissions without a slot (chain-unverifiable) rather than attributing non-deterministically", () => {
    const detail = projectDetail({
      treasuryFundings: [funding()],
      tasks: [task({ taskHash: "task-a", lovelaceAmount: "5000000" })],
      submissions: [
        submission({ taskHash: "task-a", submittedBy: "ghost", slot: undefined }),
      ],
      assessments: [assessment({ taskHash: "task-a" })],
    });

    const result = computeTreasuryReport(detail, []);
    assert.equal(result?.taskActivityLog[0]?.contributor, "unknown");
    assert.equal(result?.acceptedCommitments.length, 0);
  });

  describe("dateRange filter", () => {
    // Use preprod-era slots: slotToDate maps these to real dates.
    // slot 50_000_000 ~ 2024-06, slot 100_000_000 ~ 2026-02.
    const earlySlot = 50_000_000;
    const lateSlot = 100_000_000;

    function spanningRange(startDate: Date, endDate: Date) {
      return { start: startDate, end: endDate };
    }

    it("filters payouts, deposits, and assessments to the window", () => {
      const detail = projectDetail({
        treasuryFundings: [
          funding({ slot: earlySlot, lovelaceAmount: 10_000_000 }),
          funding({ slot: lateSlot, lovelaceAmount: 20_000_000 }),
        ],
        tasks: [
          task({ taskHash: "task-early", lovelaceAmount: "5000000" }),
          task({ taskHash: "task-late", lovelaceAmount: "7000000" }),
        ],
        submissions: [
          submission({ taskHash: "task-early", submittedBy: "alice", slot: earlySlot }),
          submission({ taskHash: "task-late", submittedBy: "bob", slot: lateSlot }),
        ],
        assessments: [
          assessment({ taskHash: "task-early", slot: earlySlot + 1 }),
          assessment({ taskHash: "task-late", slot: lateSlot + 1 }),
        ],
      });

      // Window that only includes late events.
      const windowStart = new Date("2025-06-01T00:00:00Z");
      const windowEnd = new Date("2026-12-31T00:00:00Z");
      const result = computeTreasuryReport(
        detail,
        [],
        spanningRange(windowStart, windowEnd),
      );

      assert.equal(result?.summary.totalDeposited, 20_000_000);
      assert.equal(result?.summary.rewardsDistributed, 7_000_000);
      assert.equal(result?.summary.tasksCompleted, 1);
      assert.equal(result?.taskActivityLog.length, 1);
      assert.equal(result?.taskActivityLog[0]?.contributor, "bob");
    });

    it("derives contributorCount from filtered acceptedCommitments, not the all-time contributors list", () => {
      const detail = projectDetail({
        treasuryFundings: [funding({ slot: lateSlot })],
        tasks: [task({ taskHash: "task-late", lovelaceAmount: "5000000" })],
        submissions: [
          submission({ taskHash: "task-late", submittedBy: "bob", slot: lateSlot }),
        ],
        assessments: [assessment({ taskHash: "task-late", slot: lateSlot + 1 })],
        // All-time project roster includes contributors with no activity in range.
        contributors: [
          { alias: "alice" },
          { alias: "bob" },
          { alias: "carol" },
        ],
      });

      const windowStart = new Date("2025-06-01T00:00:00Z");
      const windowEnd = new Date("2026-12-31T00:00:00Z");
      const filtered = computeTreasuryReport(
        detail,
        [],
        spanningRange(windowStart, windowEnd),
      );
      assert.equal(filtered?.summary.contributorCount, 1);

      // Without a dateRange, the summary reflects the full project roster.
      const unfiltered = computeTreasuryReport(detail, []);
      assert.equal(unfiltered?.summary.contributorCount, 3);
    });
  });
});
