import type { JSONContent } from "@tiptap/core";

/**
 * Type guard for Tiptap JSONContent.
 * Validates that the value is an object with a string `type` field,
 * which is the minimum shape for valid Tiptap content.
 */
export function isJSONContent(value: unknown): value is JSONContent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as Record<string, unknown>).type === "string"
  );
}

export type AssignmentStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_APPROVAL"
  | "ASSIGNMENT_ACCEPTED"
  | "ASSIGNMENT_DENIED"
  | "CREDENTIAL_CLAIMED"
  | "UNKNOWN";

/**
 * Commitment-layer network status.
 *
 * Wider than `AssignmentStatus` because the assignment-commitment UI needs to
 * render a transaction-processing banner while a `PENDING_TX_*` status is
 * live — that distinction is lost when the base normalizer collapses all
 * `PENDING_TX_*` to `IN_PROGRESS` for badge display.
 */
export type CommitmentNetworkStatus =
  | AssignmentStatus
  | `PENDING_TX_${string}`;

const STATUS_ALIASES: Record<string, AssignmentStatus> = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  AWAITING_SUBMISSION: "IN_PROGRESS",
  DRAFT: "IN_PROGRESS",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ASSIGNMENT_ACCEPTED: "ASSIGNMENT_ACCEPTED",
  ASSIGNMENT_DENIED: "ASSIGNMENT_DENIED",
  ASSIGNMENT_REFUSED: "ASSIGNMENT_DENIED",
  CREDENTIAL_CLAIMED: "CREDENTIAL_CLAIMED",
  ASSIGNMENT_LEFT: "NOT_STARTED",
  LEFT: "NOT_STARTED",
  // DB raw commitment_status values (previously inlined in hook STATUS_MAPs)
  SUBMITTED: "PENDING_APPROVAL",
  ACCEPTED: "ASSIGNMENT_ACCEPTED",
  REFUSED: "ASSIGNMENT_DENIED",
  // Legacy gateway values
  APPROVED: "ASSIGNMENT_ACCEPTED",
  REJECTED: "ASSIGNMENT_DENIED",
  // Andamioscan on-chain status values (for source: "chain_only" responses)
  COMPLETED: "CREDENTIAL_CLAIMED",
  CURRENT: "IN_PROGRESS",
  PENDING: "PENDING_APPROVAL",
  SAVE_FOR_LATER: "IN_PROGRESS",
  COMMITMENT: "IN_PROGRESS",
  NETWORK_READY: "IN_PROGRESS",
};

export function normalizeAssignmentStatus(
  rawStatus: string | null | undefined
): AssignmentStatus {
  if (!rawStatus) return "NOT_STARTED";

  const normalized = rawStatus.toUpperCase();

  if (normalized.includes("PENDING_TX")) {
    return "IN_PROGRESS";
  }

  const aliasedStatus = STATUS_ALIASES[normalized];
  if (aliasedStatus) {
    return aliasedStatus;
  }

  return "UNKNOWN";
}

/**
 * Commitment read-path normalizer.
 *
 * Preserves `PENDING_TX_*` values as-is so the assignment-commitment UI can
 * render a TX-processing banner; delegates to `normalizeAssignmentStatus`
 * otherwise. Uses `startsWith` (tighter than the base normalizer's `includes`
 * check) so only raw PENDING_TX-prefixed values are preserved.
 */
export function normalizeCommitmentNetworkStatus(
  rawStatus: string | null | undefined,
): CommitmentNetworkStatus {
  if (!rawStatus) return "NOT_STARTED";

  const normalized = rawStatus.toUpperCase();

  if (normalized.startsWith("PENDING_TX_")) {
    // Cast is sound: `normalized` is the uppercased input and `startsWith`
    // guarantees the `PENDING_TX_` prefix required by the template literal.
    return normalized as `PENDING_TX_${string}`;
  }

  return normalizeAssignmentStatus(normalized);
}

export function isCompletedStatus(status: AssignmentStatus): boolean {
  return status === "ASSIGNMENT_ACCEPTED" || status === "CREDENTIAL_CLAIMED";
}

export function isClaimableStatus(status: AssignmentStatus): boolean {
  return status === "ASSIGNMENT_ACCEPTED";
}
