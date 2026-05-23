import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  getModuleCommitmentStatus,
  groupCommitmentsByModule,
  type StudentCommitmentSummary,
} from "./commitment-aggregation";

// =============================================================================
// Test factories
// =============================================================================

function commitment(
  overrides: Partial<StudentCommitmentSummary> = {},
): StudentCommitmentSummary {
  return {
    courseId: "course-1",
    moduleCode: "101",
    sltHash: "slt-hash-1",
    networkStatus: "NOT_STARTED",
    source: "merged",
    ...overrides,
  };
}

// =============================================================================
// getModuleCommitmentStatus — priority resolution + PENDING_TX collapse
// =============================================================================

describe("getModuleCommitmentStatus — empty input", () => {
  it("returns null for empty array", () => {
    assert.equal(getModuleCommitmentStatus([]), null);
  });
});

describe("getModuleCommitmentStatus — single commitment", () => {
  it("returns CREDENTIAL_CLAIMED for a single claimed commitment", () => {
    assert.equal(
      getModuleCommitmentStatus([
        commitment({ networkStatus: "CREDENTIAL_CLAIMED" }),
      ]),
      "CREDENTIAL_CLAIMED",
    );
  });

  it("returns ASSIGNMENT_DENIED for a single denied commitment", () => {
    assert.equal(
      getModuleCommitmentStatus([
        commitment({ networkStatus: "ASSIGNMENT_DENIED" }),
      ]),
      "ASSIGNMENT_DENIED",
    );
  });

  it("returns IN_PROGRESS for a single PENDING_TX_* commitment (collapse)", () => {
    // Module summary is a display category — PENDING_TX_* collapses to
    // IN_PROGRESS via normalizeAssignmentStatus at the priority layer.
    assert.equal(
      getModuleCommitmentStatus([
        commitment({ networkStatus: "PENDING_TX_ACCEPT" }),
      ]),
      "IN_PROGRESS",
    );
  });

  it("returns IN_PROGRESS for a PENDING_TX_COMMIT commitment (collapse)", () => {
    assert.equal(
      getModuleCommitmentStatus([
        commitment({ networkStatus: "PENDING_TX_COMMIT" }),
      ]),
      "IN_PROGRESS",
    );
  });
});

describe("getModuleCommitmentStatus — priority across multiple commitments", () => {
  it("ACCEPTED beats PENDING_APPROVAL", () => {
    assert.equal(
      getModuleCommitmentStatus([
        commitment({ networkStatus: "PENDING_APPROVAL" }),
        commitment({ networkStatus: "ASSIGNMENT_ACCEPTED" }),
      ]),
      "ASSIGNMENT_ACCEPTED",
    );
  });

  it("CREDENTIAL_CLAIMED beats ACCEPTED", () => {
    assert.equal(
      getModuleCommitmentStatus([
        commitment({ networkStatus: "ASSIGNMENT_ACCEPTED" }),
        commitment({ networkStatus: "CREDENTIAL_CLAIMED" }),
      ]),
      "CREDENTIAL_CLAIMED",
    );
  });

  it("PENDING_APPROVAL beats IN_PROGRESS", () => {
    assert.equal(
      getModuleCommitmentStatus([
        commitment({ networkStatus: "IN_PROGRESS" }),
        commitment({ networkStatus: "PENDING_APPROVAL" }),
      ]),
      "PENDING_APPROVAL",
    );
  });

  it("IN_PROGRESS beats ASSIGNMENT_DENIED", () => {
    assert.equal(
      getModuleCommitmentStatus([
        commitment({ networkStatus: "ASSIGNMENT_DENIED" }),
        commitment({ networkStatus: "IN_PROGRESS" }),
      ]),
      "IN_PROGRESS",
    );
  });

  it("PENDING_TX_ACCEPT (collapsed to IN_PROGRESS) beats ASSIGNMENT_DENIED", () => {
    assert.equal(
      getModuleCommitmentStatus([
        commitment({ networkStatus: "ASSIGNMENT_DENIED" }),
        commitment({ networkStatus: "PENDING_TX_ACCEPT" }),
      ]),
      "IN_PROGRESS",
    );
  });

  it("order of inputs does not affect result when priorities differ", () => {
    const ordered = getModuleCommitmentStatus([
      commitment({ networkStatus: "ASSIGNMENT_ACCEPTED" }),
      commitment({ networkStatus: "IN_PROGRESS" }),
    ]);
    const reversed = getModuleCommitmentStatus([
      commitment({ networkStatus: "IN_PROGRESS" }),
      commitment({ networkStatus: "ASSIGNMENT_ACCEPTED" }),
    ]);
    assert.equal(ordered, "ASSIGNMENT_ACCEPTED");
    assert.equal(reversed, "ASSIGNMENT_ACCEPTED");
  });
});

describe("getModuleCommitmentStatus — unrecognized statuses (priority 0)", () => {
  it("returns NOT_STARTED (first-wins at priority 0) when all statuses are off-ladder", () => {
    // Neither NOT_STARTED nor UNKNOWN appears in STATUS_PRIORITY, so both hit
    // the fallback priority of 0. First-wins is the documented behavior when
    // priorities tie; this test pins it.
    assert.equal(
      getModuleCommitmentStatus([
        commitment({ networkStatus: "NOT_STARTED" }),
        commitment({ networkStatus: "UNKNOWN" }),
      ]),
      "NOT_STARTED",
    );
  });

  it("a ladder status beats an off-ladder one regardless of input order", () => {
    assert.equal(
      getModuleCommitmentStatus([
        commitment({ networkStatus: "NOT_STARTED" }),
        commitment({ networkStatus: "PENDING_APPROVAL" }),
      ]),
      "PENDING_APPROVAL",
    );
  });
});

// =============================================================================
// groupCommitmentsByModule — course filtering
// =============================================================================

describe("groupCommitmentsByModule", () => {
  it("groups commitments by moduleCode when courseId matches", () => {
    const commitments: StudentCommitmentSummary[] = [
      commitment({ moduleCode: "101" }),
      commitment({ moduleCode: "101", sltHash: "slt-2" }),
      commitment({ moduleCode: "102" }),
    ];
    const grouped = groupCommitmentsByModule(commitments, "course-1");
    assert.equal(grouped.get("101")?.length, 2);
    assert.equal(grouped.get("102")?.length, 1);
  });

  it("filters out commitments from other courses (issue #116)", () => {
    const commitments: StudentCommitmentSummary[] = [
      commitment({ courseId: "course-1", moduleCode: "101" }),
      commitment({ courseId: "course-2", moduleCode: "101" }),
    ];
    const grouped = groupCommitmentsByModule(commitments, "course-1");
    assert.equal(grouped.get("101")?.length, 1);
    assert.equal(grouped.size, 1);
  });

  it("returns an empty Map when no commitments match the courseId", () => {
    const grouped = groupCommitmentsByModule(
      [commitment({ courseId: "course-other" })],
      "course-1",
    );
    assert.equal(grouped.size, 0);
  });
});
