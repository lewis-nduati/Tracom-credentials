/**
 * Pure aggregation helpers for student commitment data.
 *
 * Extracted from `use-student-assignment-commitments.ts` so they can be
 * unit-tested without loading the React Query hook module (which transitively
 * imports env validation). See issue #520.
 */

import {
  normalizeAssignmentStatus,
  type AssignmentStatus,
  type CommitmentNetworkStatus,
} from "~/lib/assignment-status";

/**
 * App-level student commitment summary with camelCase fields.
 */
export interface StudentCommitmentSummary {
  courseId: string;
  moduleCode: string;
  sltHash: string | null;
  networkStatus: CommitmentNetworkStatus;
  source: "merged" | "chain_only" | "db_only";
}

/** Status priority: higher index = higher priority */
const STATUS_PRIORITY: AssignmentStatus[] = [
  "ASSIGNMENT_DENIED",
  "IN_PROGRESS",
  "PENDING_APPROVAL",
  "ASSIGNMENT_ACCEPTED",
  "CREDENTIAL_CLAIMED",
];

/**
 * Derive a single canonical status for a module from its commitments.
 *
 * Priority (highest wins): CREDENTIAL_CLAIMED > ASSIGNMENT_ACCEPTED >
 * PENDING_APPROVAL > IN_PROGRESS > ASSIGNMENT_DENIED.
 *
 * PENDING_TX_* values are collapsed to their canonical display category via
 * `normalizeAssignmentStatus` before the priority lookup — a module summary
 * is a display category, not a transaction lifecycle value.
 *
 * Returns null when the array is empty.
 */
export function getModuleCommitmentStatus(
  commitments: StudentCommitmentSummary[],
): AssignmentStatus | null {
  if (commitments.length === 0) return null;

  let best: AssignmentStatus | null = null;
  let bestPriority = -1;

  for (const c of commitments) {
    const canonical = normalizeAssignmentStatus(c.networkStatus);
    const idx = STATUS_PRIORITY.indexOf(canonical);
    const priority = idx === -1 ? 0 : idx;
    if (priority > bestPriority) {
      bestPriority = priority;
      best = canonical;
    }
  }

  return best;
}

/**
 * Group commitments by module code, filtering to a specific course.
 * Prevents cross-course contamination (see #116).
 */
export function groupCommitmentsByModule(
  commitments: StudentCommitmentSummary[],
  courseId: string,
): Map<string, StudentCommitmentSummary[]> {
  const map = new Map<string, StudentCommitmentSummary[]>();
  for (const c of commitments) {
    if (c.courseId !== courseId) continue;
    const existing = map.get(c.moduleCode) ?? [];
    existing.push(c);
    map.set(c.moduleCode, existing);
  }
  return map;
}
