/**
 * Commitment utilities — pure functions for deriving historical commitment
 * views from project detail on-chain data.
 *
 * Used by the "All Commitments" tab on the project commitments page to show
 * full commitment history without requiring a dedicated API endpoint.
 */

import type {
  ManagerCommitment,
  ManagerCommitmentTaskInfo,
} from "~/hooks/api/project/use-project-manager";
import type {
  ProjectSubmission,
  ProjectAssessment,
  Task,
} from "~/hooks/api/project/use-project";

/**
 * Derive historical commitments from project detail on-chain data.
 *
 * Transforms `project.submissions` + `project.assessments` into
 * `ManagerCommitment[]` items compatible with the existing commitments
 * page rendering.
 *
 * Assessment matching & deduplication:
 * - Assessments with empty `taskHash` are skipped (GH #178)
 * - When multiple assessments share a `taskHash`, the latest (by slot) wins
 * - An assessment only applies if its slot is strictly greater than the
 *   submission's slot (same-slot = refuse-and-resubmit, still pending)
 * - Submissions are deduplicated by (taskHash, submittedBy), keeping latest
 * - Unmatched submissions default to "COMMITTED" status
 */
export function deriveHistoricalCommitments({
  projectId,
  submissions,
  assessments,
  tasks,
}: {
  projectId: string;
  submissions?: ProjectSubmission[];
  assessments?: ProjectAssessment[];
  tasks?: Task[];
}): ManagerCommitment[] {
  if (!submissions || submissions.length === 0) return [];

  // Build assessment lookup: taskHash → latest ProjectAssessment (by slot)
  // Skip assessments with empty taskHash (GH #178)
  // When multiple assessments exist for a taskHash, keep the latest — this
  // handles refuse-and-resubmit cycles where the final decision is what matters.
  const assessmentMap = new Map<string, ProjectAssessment>();
  for (const a of assessments ?? []) {
    if (!a.taskHash) continue;
    const existing = assessmentMap.get(a.taskHash);
    if (!existing || (a.slot ?? 0) > (existing.slot ?? 0)) {
      assessmentMap.set(a.taskHash, a);
    }
  }

  // Deduplicate submissions: keep only the latest per (taskHash, submittedBy).
  // The API may return multiple historical submissions for the same contributor
  // and task (e.g. refuse-and-resubmit cycles). We only need the latest.
  const latestSubmissions = new Map<string, ProjectSubmission>();
  for (const s of submissions) {
    const key = `${s.taskHash}-${s.submittedBy}`;
    const existing = latestSubmissions.get(key);
    if (!existing || (s.slot ?? 0) > (existing.slot ?? 0)) {
      latestSubmissions.set(key, s);
    }
  }

  // Build task context lookup: taskHash → ManagerCommitmentTaskInfo
  // When multiple tasks share a taskHash (different UTxOs), take the first
  const taskInfoMap = new Map<string, ManagerCommitmentTaskInfo>();
  for (const t of tasks ?? []) {
    if (t.taskHash && !taskInfoMap.has(t.taskHash)) {
      taskInfoMap.set(t.taskHash, {
        lovelaceAmount: t.lovelaceAmount ? Number(t.lovelaceAmount) : undefined,
        expirationTime: t.expirationTime,
        expirationPosix: t.expirationPosix,
        onChainContent: t.onChainContent,
      });
    }
  }

  // Transform each deduplicated submission into a ManagerCommitment-compatible
  // object, pairing with the original slot for sorting.
  const withSlots = Array.from(latestSubmissions.values()).map((s) => {
    const assessment = assessmentMap.get(s.taskHash);

    // Only apply the assessment if it came strictly after this submission.
    // When assessment.slot === submission.slot, the assessment belongs to a
    // refuse-and-resubmit transaction (the REFUSED is for the *previous*
    // evidence; the new evidence in this submission is still pending).
    const assessmentApplies =
      assessment != null && (assessment.slot ?? 0) > (s.slot ?? 0);

    const commitment: ManagerCommitment = {
      projectId,
      taskHash: s.taskHash,
      submittedBy: s.submittedBy,
      submissionTx: s.submissionTx,
      onChainContent: s.onChainContent,

      // Assessment decisions are already normalized by transformProjectDetail
      // (ACCEPTED/REFUSED/DENIED) — no need to re-normalize
      commitmentStatus: assessmentApplies ? assessment.decision : "COMMITTED",
      assessedBy: assessmentApplies ? assessment.assessedBy : undefined,
      taskOutcome: assessmentApplies
        ? assessment.decision?.toLowerCase()
        : undefined,

      task: taskInfoMap.get(s.taskHash),
      status: "active" as const,
    };

    return { commitment, slot: s.slot ?? 0 };
  });

  // Sort by slot descending (newest first), fall back to original array order
  withSlots.sort((a, b) => b.slot - a.slot);

  return withSlots.map((w) => w.commitment);
}
