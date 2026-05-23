import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  normalizeAssignmentStatus,
  normalizeCommitmentNetworkStatus,
  isCompletedStatus,
  isClaimableStatus,
} from "./assignment-status";

// =============================================================================
// Group A — normalizeAssignmentStatus (extended alias table)
// =============================================================================
//
// Pins the canonical alias table used everywhere the UI needs a display
// category. The SUBMITTED/ACCEPTED/REFUSED/APPROVED/REJECTED entries are new
// in this refactor — they used to live inline in the commitment hooks' ad-hoc
// STATUS_MAP. Consolidated here per the normalizer-first pattern established
// in docs/solutions/integration-issues/commitment-status-normalization-api-change.md.

describe("normalizeAssignmentStatus — DB raw status aliases (new)", () => {
  it("maps SUBMITTED to PENDING_APPROVAL", () => {
    assert.equal(normalizeAssignmentStatus("SUBMITTED"), "PENDING_APPROVAL");
  });

  it("maps ACCEPTED to ASSIGNMENT_ACCEPTED", () => {
    assert.equal(normalizeAssignmentStatus("ACCEPTED"), "ASSIGNMENT_ACCEPTED");
  });

  it("maps REFUSED to ASSIGNMENT_DENIED (critical drift fix)", () => {
    // The gateway/DB emits REFUSED; canonical status is ASSIGNMENT_DENIED.
    // Prior behavior had the hooks emit ASSIGNMENT_REFUSED which drifted
    // from the canonical union.
    assert.equal(normalizeAssignmentStatus("REFUSED"), "ASSIGNMENT_DENIED");
  });

  it("maps APPROVED (legacy) to ASSIGNMENT_ACCEPTED", () => {
    assert.equal(normalizeAssignmentStatus("APPROVED"), "ASSIGNMENT_ACCEPTED");
  });

  it("maps REJECTED (legacy) to ASSIGNMENT_DENIED", () => {
    assert.equal(normalizeAssignmentStatus("REJECTED"), "ASSIGNMENT_DENIED");
  });
});

describe("normalizeAssignmentStatus — pre-existing aliases (pinned)", () => {
  it("maps AWAITING_SUBMISSION to IN_PROGRESS", () => {
    assert.equal(
      normalizeAssignmentStatus("AWAITING_SUBMISSION"),
      "IN_PROGRESS",
    );
  });

  it("maps LEFT to NOT_STARTED", () => {
    assert.equal(normalizeAssignmentStatus("LEFT"), "NOT_STARTED");
  });

  it("maps ASSIGNMENT_LEFT to NOT_STARTED", () => {
    assert.equal(normalizeAssignmentStatus("ASSIGNMENT_LEFT"), "NOT_STARTED");
  });

  it("maps ASSIGNMENT_REFUSED (legacy alias) to ASSIGNMENT_DENIED", () => {
    assert.equal(
      normalizeAssignmentStatus("ASSIGNMENT_REFUSED"),
      "ASSIGNMENT_DENIED",
    );
  });

  it("collapses PENDING_TX_COMMIT to IN_PROGRESS (load-bearing for badges)", () => {
    // This collapse is intentional for the badge-display layer — preserved
    // here by the hook's normalizer wrapper (normalizeCommitmentNetworkStatus).
    assert.equal(
      normalizeAssignmentStatus("PENDING_TX_COMMIT"),
      "IN_PROGRESS",
    );
  });

  it("collapses any PENDING_TX_* substring match to IN_PROGRESS", () => {
    // Current implementation uses .includes("PENDING_TX") — pin that behavior.
    assert.equal(
      normalizeAssignmentStatus("PENDING_TX_ACCEPT"),
      "IN_PROGRESS",
    );
  });

  it("maps on-chain COMPLETED to CREDENTIAL_CLAIMED", () => {
    assert.equal(
      normalizeAssignmentStatus("COMPLETED"),
      "CREDENTIAL_CLAIMED",
    );
  });

  it("maps on-chain CURRENT to IN_PROGRESS", () => {
    assert.equal(normalizeAssignmentStatus("CURRENT"), "IN_PROGRESS");
  });

  it("passes CREDENTIAL_CLAIMED through as itself (legacy raw-value path)", () => {
    // Both hooks' old inline STATUS_MAPs had `CREDENTIAL_CLAIMED: CREDENTIAL_CLAIMED`.
    // Pin that passthrough here so the canonical table covers the same raw
    // input the gateway may legitimately emit.
    assert.equal(
      normalizeAssignmentStatus("CREDENTIAL_CLAIMED"),
      "CREDENTIAL_CLAIMED",
    );
  });
});

describe("normalizeAssignmentStatus — edge cases", () => {
  it("returns NOT_STARTED for null input", () => {
    assert.equal(normalizeAssignmentStatus(null), "NOT_STARTED");
  });

  it("returns NOT_STARTED for undefined input", () => {
    assert.equal(normalizeAssignmentStatus(undefined), "NOT_STARTED");
  });

  it("returns NOT_STARTED for empty string", () => {
    assert.equal(normalizeAssignmentStatus(""), "NOT_STARTED");
  });

  it("upcases lowercase input (submitted -> PENDING_APPROVAL)", () => {
    assert.equal(normalizeAssignmentStatus("submitted"), "PENDING_APPROVAL");
  });

  it("returns UNKNOWN for unrecognized input", () => {
    assert.equal(normalizeAssignmentStatus("GARBAGE"), "UNKNOWN");
  });
});

// =============================================================================
// Group B — normalizeCommitmentNetworkStatus (new wrapper)
// =============================================================================
//
// Preserves PENDING_TX_* values (via startsWith, tighter than the base
// normalizer's .includes check) so the commitment read path can render a
// TX-processing banner. Delegates to normalizeAssignmentStatus for everything
// else.

describe("normalizeCommitmentNetworkStatus — preserves PENDING_TX_*", () => {
  it("returns PENDING_TX_COMMIT as-is (does NOT collapse)", () => {
    assert.equal(
      normalizeCommitmentNetworkStatus("PENDING_TX_COMMIT"),
      "PENDING_TX_COMMIT",
    );
  });

  it("returns PENDING_TX_ACCEPT as-is", () => {
    assert.equal(
      normalizeCommitmentNetworkStatus("PENDING_TX_ACCEPT"),
      "PENDING_TX_ACCEPT",
    );
  });

  it("upcases lowercase PENDING_TX_* before the startsWith check", () => {
    assert.equal(
      normalizeCommitmentNetworkStatus("pending_tx_commit"),
      "PENDING_TX_COMMIT",
    );
  });

  it("uses startsWith, not includes — FOO_PENDING_TX delegates to base normalizer", () => {
    // startsWith("PENDING_TX") is false for "FOO_PENDING_TX", so the wrapper
    // delegates to normalizeAssignmentStatus. The base normalizer's
    // .includes("PENDING_TX") branch then collapses to IN_PROGRESS. This test
    // pins the prefix-vs-substring semantics so a future attempt to align both
    // on startsWith flips this expectation and gets caught in review.
    assert.equal(
      normalizeCommitmentNetworkStatus("FOO_PENDING_TX"),
      "IN_PROGRESS",
    );
  });
});

describe("normalizeCommitmentNetworkStatus — delegates for non-PENDING_TX", () => {
  it("returns ASSIGNMENT_ACCEPTED for ACCEPTED (delegation)", () => {
    assert.equal(
      normalizeCommitmentNetworkStatus("ACCEPTED"),
      "ASSIGNMENT_ACCEPTED",
    );
  });

  it("returns ASSIGNMENT_DENIED for REFUSED (delegation + drift fix)", () => {
    assert.equal(
      normalizeCommitmentNetworkStatus("REFUSED"),
      "ASSIGNMENT_DENIED",
    );
  });

  it("returns PENDING_APPROVAL for SUBMITTED", () => {
    assert.equal(
      normalizeCommitmentNetworkStatus("SUBMITTED"),
      "PENDING_APPROVAL",
    );
  });

  it("returns IN_PROGRESS for AWAITING_SUBMISSION", () => {
    assert.equal(
      normalizeCommitmentNetworkStatus("AWAITING_SUBMISSION"),
      "IN_PROGRESS",
    );
  });

  it("returns NOT_STARTED for null", () => {
    assert.equal(normalizeCommitmentNetworkStatus(null), "NOT_STARTED");
  });

  it("returns UNKNOWN for unrecognized input", () => {
    assert.equal(normalizeCommitmentNetworkStatus("GARBAGE"), "UNKNOWN");
  });
});

// =============================================================================
// Predicates
// =============================================================================

describe("isCompletedStatus", () => {
  it("returns true for ASSIGNMENT_ACCEPTED", () => {
    assert.equal(isCompletedStatus("ASSIGNMENT_ACCEPTED"), true);
  });

  it("returns true for CREDENTIAL_CLAIMED", () => {
    assert.equal(isCompletedStatus("CREDENTIAL_CLAIMED"), true);
  });

  it("returns false for other statuses", () => {
    assert.equal(isCompletedStatus("NOT_STARTED"), false);
    assert.equal(isCompletedStatus("IN_PROGRESS"), false);
    assert.equal(isCompletedStatus("PENDING_APPROVAL"), false);
    assert.equal(isCompletedStatus("ASSIGNMENT_DENIED"), false);
    assert.equal(isCompletedStatus("UNKNOWN"), false);
  });
});

describe("isClaimableStatus", () => {
  it("returns true only for ASSIGNMENT_ACCEPTED", () => {
    assert.equal(isClaimableStatus("ASSIGNMENT_ACCEPTED"), true);
    assert.equal(isClaimableStatus("CREDENTIAL_CLAIMED"), false);
    assert.equal(isClaimableStatus("PENDING_APPROVAL"), false);
  });
});
