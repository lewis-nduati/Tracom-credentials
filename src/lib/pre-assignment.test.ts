import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { evaluatePreAssignmentGate, normalizeAlias } from "./pre-assignment";

describe("normalizeAlias", () => {
  it("lowercases an all-caps alias", () => {
    assert.equal(normalizeAlias("SARAH"), "sarah");
  });

  it("lowercases a mixed-case alias", () => {
    assert.equal(normalizeAlias("Sarah"), "sarah");
  });

  it("returns an already-canonical alias unchanged", () => {
    assert.equal(normalizeAlias("sarah"), "sarah");
  });

  it("trims surrounding whitespace", () => {
    assert.equal(normalizeAlias("  Sarah  "), "sarah");
  });

  it("collapses whitespace-only input to empty string", () => {
    assert.equal(normalizeAlias("   "), "");
  });

  it("returns empty string for empty input", () => {
    assert.equal(normalizeAlias(""), "");
  });

  it("returns empty string for null", () => {
    assert.equal(normalizeAlias(null), "");
  });

  it("returns empty string for undefined", () => {
    assert.equal(normalizeAlias(undefined), "");
  });

  it("folds NFKC compatibility characters: U+212A Kelvin sign collapses to ASCII 'k'", () => {
    // U+212A (KELVIN SIGN) and ASCII 'k' are visually distinct codepoints but
    // .toLowerCase() alone leaves Kelvin as Kelvin. NFKC folds it to 'k' first.
    assert.equal(normalizeAlias("Kelvin"), "kelvin");
  });

  it("folds NFKC compatibility characters: U+017F long-s collapses to 's'", () => {
    assert.equal(normalizeAlias("ſarah"), "sarah");
  });
});

describe("evaluatePreAssignmentGate", () => {
  it("matches the assigned user when on-chain alias is uppercase and stored alias is lowercase (the reported bug)", () => {
    const result = evaluatePreAssignmentGate({
      preAssignedAlias: "sarah",
      currentUserAlias: "SARAH",
      isAuthenticated: true,
    });
    assert.equal(result.isAssignedToCurrentUser, true);
    assert.equal(result.isBlockedByPreAssignment, false);
  });

  it("matches the assigned user when on-chain alias is lowercase and stored alias is uppercase (reverse casing)", () => {
    const result = evaluatePreAssignmentGate({
      preAssignedAlias: "SARAH",
      currentUserAlias: "sarah",
      isAuthenticated: true,
    });
    assert.equal(result.isAssignedToCurrentUser, true);
    assert.equal(result.isBlockedByPreAssignment, false);
  });

  it("matches when both sides already share casing (existing behavior preserved)", () => {
    const result = evaluatePreAssignmentGate({
      preAssignedAlias: "Sarah",
      currentUserAlias: "Sarah",
      isAuthenticated: true,
    });
    assert.equal(result.isAssignedToCurrentUser, true);
    assert.equal(result.isBlockedByPreAssignment, false);
  });

  it("blocks a different authenticated user", () => {
    const result = evaluatePreAssignmentGate({
      preAssignedAlias: "sarah",
      currentUserAlias: "OTHER",
      isAuthenticated: true,
    });
    assert.equal(result.isAssignedToCurrentUser, false);
    assert.equal(result.isBlockedByPreAssignment, true);
  });

  it("blocks an authenticated user with no access token alias (no false positive from empty-string normalization)", () => {
    const result = evaluatePreAssignmentGate({
      preAssignedAlias: "sarah",
      currentUserAlias: null,
      isAuthenticated: true,
    });
    assert.equal(result.isAssignedToCurrentUser, false);
    assert.equal(result.isBlockedByPreAssignment, true);
  });

  it("does not block when the task has no pre-assignment, regardless of user alias", () => {
    const result = evaluatePreAssignmentGate({
      preAssignedAlias: null,
      currentUserAlias: "SARAH",
      isAuthenticated: true,
    });
    assert.equal(result.isAssignedToCurrentUser, false);
    assert.equal(result.isBlockedByPreAssignment, false);
  });

  it("does not block an unauthenticated viewer (the connect-wallet UI handles that path)", () => {
    const result = evaluatePreAssignmentGate({
      preAssignedAlias: "sarah",
      currentUserAlias: null,
      isAuthenticated: false,
    });
    assert.equal(result.isAssignedToCurrentUser, false);
    assert.equal(result.isBlockedByPreAssignment, false);
  });

  it("blocks all authenticated users when stored alias is whitespace-only (defense-in-depth: getPreAssignedAlias trims at the data boundary, this is the gate-layer fallback)", () => {
    const result = evaluatePreAssignmentGate({
      preAssignedAlias: "   ",
      currentUserAlias: "SARAH",
      isAuthenticated: true,
    });
    // getPreAssignedAlias in task-metadata.ts trims at extraction so this
    // input shouldn't reach the gate from the task-detail page. Pinned here
    // as defense-in-depth: any other caller passing a whitespace alias
    // through the gate gets fail-closed behavior, not a silent unlock.
    assert.equal(result.isAssignedToCurrentUser, false);
    assert.equal(result.isBlockedByPreAssignment, true);
  });

  it("blocks an authenticated user whose alias is undefined (distinct from null)", () => {
    const result = evaluatePreAssignmentGate({
      preAssignedAlias: "sarah",
      currentUserAlias: undefined,
      isAuthenticated: true,
    });
    assert.equal(result.isAssignedToCurrentUser, false);
    assert.equal(result.isBlockedByPreAssignment, true);
  });

  it("blocks an authenticated user whose alias is whitespace-only (does not collapse to an empty match)", () => {
    const result = evaluatePreAssignmentGate({
      preAssignedAlias: "sarah",
      currentUserAlias: "   ",
      isAuthenticated: true,
    });
    assert.equal(result.isAssignedToCurrentUser, false);
    assert.equal(result.isBlockedByPreAssignment, true);
  });
});
