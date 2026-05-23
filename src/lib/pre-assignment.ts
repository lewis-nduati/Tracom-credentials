/**
 * Lowercase + trim + Unicode-fold an alias for paper-over comparison.
 *
 * The on-chain access token alias is the source of truth for identity, and
 * each casing is a distinct on-chain asset (`hex("uSARAH") !== hex("usarah")`).
 * Strict `===` is the correct long-term comparison. This helper exists only
 * to support a temporary case-insensitive paper-over in the pre-assignment
 * gate while an upstream gateway bug is fixed.
 *
 * NFKC normalization runs before `.toLowerCase()` to fold compatibility
 * equivalents (e.g., U+212A Kelvin sign → "k", U+017F long-S → "s") that
 * `.toLowerCase()` alone leaves as ambiguous identity collisions.
 *
 * Exported only for the colocated test file. Do not introduce new callers —
 * when the upstream returns canonical aliases, this module deletes entirely.
 */
export function normalizeAlias(alias: string | null | undefined): string {
  if (!alias) return "";
  return alias.trim().normalize("NFKC").toLowerCase();
}

interface PreAssignmentGateInput {
  /** Alias the task is reserved for, or null/undefined if open. */
  preAssignedAlias: string | null | undefined;
  /** The viewing user's on-chain access token alias, or null when unknown. */
  currentUserAlias: string | null | undefined;
  /** True when the viewing user has an active session. */
  isAuthenticated: boolean;
}

interface PreAssignmentGateResult {
  /** True when the viewing user matches the task's pre-assignment. */
  isAssignedToCurrentUser: boolean;
  /** True when the task is reserved for someone other than the viewing user. */
  isBlockedByPreAssignment: boolean;
}

/**
 * Decide whether the viewing user can act on a pre-assigned task.
 *
 * **Temporary paper-over.** Both alias values are normalized (trimmed,
 * NFKC-folded, lowercased) before comparison to work around an upstream bug
 * where the gateway's existence check accepts case-mismatched aliases and
 * persists them verbatim in task metadata. The on-chain identity model is
 * byte-exact (each casing is a distinct asset), so this comparison
 * technically conflates distinct identities. Acceptable today because
 * (a) volume is low, (b) commit transactions are gated by additional
 * credential checks, and (c) the access-token policy in practice does not
 * produce case-collision mints. Revert to strict equality once
 * andamio-api / andamioscan return the canonical on-chain alias from
 * existence checks — at which point this whole module deletes.
 *
 * An empty normalized current-user alias never matches — guards against the
 * empty-string-equals-empty-string trap when a user has no access token.
 *
 * Frontend-only enforcement; the gateway does not currently know about
 * pre-assignment.
 */
export function evaluatePreAssignmentGate(
  input: PreAssignmentGateInput,
): PreAssignmentGateResult {
  const isPreAssigned = !!input.preAssignedAlias;
  const normalizedCurrent = normalizeAlias(input.currentUserAlias);
  const isAssignedToCurrentUser =
    isPreAssigned &&
    normalizedCurrent.length > 0 &&
    normalizedCurrent === normalizeAlias(input.preAssignedAlias);
  const isBlockedByPreAssignment =
    isPreAssigned && input.isAuthenticated && !isAssignedToCurrentUser;

  return { isAssignedToCurrentUser, isBlockedByPreAssignment };
}
