import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getBannerConfig } from "./assignment-commitment-banner";
import { normalizeCommitmentNetworkStatus } from "~/lib/assignment-status";

// =============================================================================
// Direct-input cases — pin each switch branch
// =============================================================================

describe("getBannerConfig — direct inputs", () => {
  it("returns the Pending Teacher Review banner for PENDING_APPROVAL", () => {
    const cfg = getBannerConfig("PENDING_APPROVAL");
    assert.ok(cfg);
    assert.equal(cfg.title, "Pending Teacher Review");
  });

  it("returns the Credential Claimed banner for CREDENTIAL_CLAIMED", () => {
    const cfg = getBannerConfig("CREDENTIAL_CLAIMED");
    assert.ok(cfg);
    assert.equal(cfg.title, "Credential Claimed");
  });

  it("returns the In Progress banner for IN_PROGRESS", () => {
    // Pre-refactor: unreachable via the commitment hook path (gateway never
    // emitted raw IN_PROGRESS, and AWAITING_SUBMISSION passed through
    // unnormalized). Post-refactor: reachable via the canonical normalizer,
    // which collapses AWAITING_SUBMISSION -> IN_PROGRESS. Pin the branch here
    // so the canonical-flow test below covers the full pipeline.
    const cfg = getBannerConfig("IN_PROGRESS");
    assert.ok(cfg);
    assert.equal(cfg.title, "In Progress");
  });

  it("returns the Processing Transaction banner for PENDING_TX_ACCEPT", () => {
    const cfg = getBannerConfig("PENDING_TX_ACCEPT");
    assert.ok(cfg);
    assert.equal(cfg.title, "Processing transaction...");
  });

  it("returns the Processing Transaction banner for PENDING_TX_CLAIM", () => {
    const cfg = getBannerConfig("PENDING_TX_CLAIM");
    assert.ok(cfg);
    assert.equal(cfg.title, "Processing transaction...");
  });

  it("returns null for PENDING_TX_COMMIT (handled by submit flow)", () => {
    // Explicit exclusion — the submit flow renders the live TX status, not a
    // passive "processing" banner.
    assert.equal(getBannerConfig("PENDING_TX_COMMIT"), null);
  });

  it("returns null for ASSIGNMENT_ACCEPTED (handled by credential-claim branch)", () => {
    assert.equal(getBannerConfig("ASSIGNMENT_ACCEPTED"), null);
  });

  it("returns null for ASSIGNMENT_DENIED (handled by revision branch)", () => {
    assert.equal(getBannerConfig("ASSIGNMENT_DENIED"), null);
  });

  it("returns null for NOT_STARTED", () => {
    assert.equal(getBannerConfig("NOT_STARTED"), null);
  });

  it("returns null for UNKNOWN", () => {
    assert.equal(getBannerConfig("UNKNOWN"), null);
  });
});

// =============================================================================
// End-to-end: raw gateway input -> normalizer -> banner
// =============================================================================
//
// Validates Gotcha #3 from issue #520: the IN_PROGRESS banner case is
// reachable through the commitment hook path IFF the canonical normalizer
// is in use. These cases walk every plausible raw status the gateway can
// emit and assert the resulting banner.

describe("full pipeline — raw DB/on-chain status -> normalizer -> banner", () => {
  const cases: Array<{
    raw: string | null;
    expectedBanner: string | null;
  }> = [
    // DB raw commitment_status values
    { raw: "SUBMITTED", expectedBanner: "Pending Teacher Review" },
    { raw: "ACCEPTED", expectedBanner: null }, // handled upstream
    { raw: "REFUSED", expectedBanner: null }, // handled upstream (now ASSIGNMENT_DENIED)
    { raw: "AWAITING_SUBMISSION", expectedBanner: "In Progress" }, // <-- the reachability claim
    { raw: "LEFT", expectedBanner: null }, // -> NOT_STARTED -> no banner
    { raw: "CREDENTIAL_CLAIMED", expectedBanner: "Credential Claimed" },
    { raw: "DRAFT", expectedBanner: "In Progress" },

    // Legacy gateway values
    { raw: "APPROVED", expectedBanner: null },
    { raw: "REJECTED", expectedBanner: null },

    // On-chain values (andamioscan source: "chain_only")
    { raw: "COMPLETED", expectedBanner: "Credential Claimed" },
    { raw: "CURRENT", expectedBanner: "In Progress" },
    { raw: "PENDING", expectedBanner: "Pending Teacher Review" },
    { raw: "SAVE_FOR_LATER", expectedBanner: "In Progress" },
    { raw: "COMMITMENT", expectedBanner: "In Progress" },
    { raw: "NETWORK_READY", expectedBanner: "In Progress" },

    // PENDING_TX_* — preserved by the wrapper, banner fires except for COMMIT
    { raw: "PENDING_TX_COMMIT", expectedBanner: null },
    { raw: "PENDING_TX_ACCEPT", expectedBanner: "Processing transaction..." },
    { raw: "PENDING_TX_REFUSE", expectedBanner: "Processing transaction..." },
    { raw: "PENDING_TX_CLAIM", expectedBanner: "Processing transaction..." },

    // Sparse response — hook synthesizes PENDING_APPROVAL default
    { raw: "PENDING_APPROVAL", expectedBanner: "Pending Teacher Review" },

    // Unknown -> UNKNOWN -> no banner
    { raw: "GARBAGE", expectedBanner: null },
    { raw: null, expectedBanner: null }, // -> NOT_STARTED -> no banner
  ];

  for (const { raw, expectedBanner } of cases) {
    it(`${JSON.stringify(raw)} -> banner=${JSON.stringify(expectedBanner)}`, () => {
      const normalized = normalizeCommitmentNetworkStatus(raw);
      const cfg = getBannerConfig(normalized);
      const actualBanner = cfg?.title ?? null;
      assert.equal(actualBanner, expectedBanner);
    });
  }
});
