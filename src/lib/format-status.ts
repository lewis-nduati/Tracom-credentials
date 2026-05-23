/**
 * Human-readable labels for commitment and task status codes.
 * Replaces the `.replace(/_/g, " ")` pattern that leaks machine strings into UI.
 */

const COMMITMENT_STATUS_LABELS: Record<string, string> = {
  AWAITING_SUBMISSION: "Awaiting Submission",
  COMMITTED: "Committed",
  SUBMITTED: "Submitted", // course domain still uses SUBMITTED
  PENDING_TX_COMMIT: "Joining...",
  PENDING_TX_ASSESS: "Under Review",
  ACCEPTED: "Accepted",
  REFUSED: "Needs Revision",
  DENIED: "Denied",
  PENDING_APPROVAL: "Pending Review",
  ASSIGNMENT_ACCEPTED: "Completed",
  ASSIGNMENT_DENIED: "Needs Revision",
  CREDENTIAL_CLAIMED: "Credential Earned",
  REWARDS_CLAIMED: "Rewards Claimed",
  REWARDED: "Reward Claimed",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_TX: "Publishing...",
  PUBLISHED: "Published",
  FUNDED: "Funded",
  ON_CHAIN: "Live",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

/**
 * Convert a raw commitment status code to a human-readable label.
 * Falls back to title-cased version if unknown.
 */
export function formatCommitmentStatus(status: string): string {
  return (
    COMMITMENT_STATUS_LABELS[status] ??
    status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Convert a raw task status code to a human-readable label.
 * Falls back to title-cased version if unknown.
 */
export function formatTaskStatus(status: string): string {
  return (
    TASK_STATUS_LABELS[status] ??
    status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
