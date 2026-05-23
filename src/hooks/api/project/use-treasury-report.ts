import { useMemo } from "react";

import type { ProjectDetail } from "./use-project";
import type { ManagerCommitment } from "./use-project-manager";
import {
  computeTreasurySummary,
  computeMonthlyTreasuryActivity,
  computeTaskActivityLog,
  type TreasuryReportSummary,
  type MonthlyTreasuryEntry,
  type TaskActivityEntry,
} from "~/lib/treasury-report-utils";
import { slotToDate } from "~/lib/cardano-utils";

export interface DateRange {
  start: Date;
  end: Date;
}

/** Accepted commitment data for contributor breakdown */
export interface AcceptedCommitmentData {
  submittedBy: string;
  taskHash: string;
  lovelaceAmount: number;
}

export interface TreasuryReportResult {
  summary: TreasuryReportSummary;
  monthly: MonthlyTreasuryEntry[];
  /** Pre-filtered accepted commitments for contributor breakdown */
  acceptedCommitments: AcceptedCommitmentData[];
  /** Task-level audit trail */
  taskActivityLog: TaskActivityEntry[];
}

/**
 * Structural slice of `ManagerCommitment` used by `computeTreasuryReport`.
 * Kept minimal so the pure function doesn't drag the full manager-commitment
 * type into test fixtures or callers that synthesize the pending list.
 */
interface PendingCommitmentLike {
  commitmentStatus?: string;
}

/** Check if a slot falls within a date range */
function isSlotInRange(slot: number | undefined, range: DateRange): boolean {
  if (slot == null) return false;
  const date = slotToDate(slot);
  if (!date) return false;
  return date >= range.start && date <= range.end;
}

/**
 * Pure computation of the treasury report from project detail and the
 * pending-commitments list. Exported for unit testing.
 *
 * `allCommitments` is only used for the COMMITTED pending count — the manager
 * commitments API returns pending submissions only, so rewards and submitter
 * aliases for accepted tasks must come from `projectDetail` (tasks + submissions).
 */
export function computeTreasuryReport(
  projectDetail: ProjectDetail | null | undefined,
  allCommitments: PendingCommitmentLike[],
  dateRange?: DateRange | null,
): TreasuryReportResult | null {
  if (!projectDetail?.treasuryFundings) return null;

  const {
    treasuryBalance = 0,
    treasuryFundings,
    assessments,
    submissions,
    tasks,
  } = projectDetail;

  const allDeposits = treasuryFundings.map((f) => ({
    lovelace: f.lovelaceAmount,
    slot: f.slot,
  }));

  // Reward amount per task comes from the canonical on-chain task list.
  // Task.lovelaceAmount is a string — coerce defensively. Skip tasks without a
  // hash, with an empty/missing lovelace string (Number("") === 0 would silently
  // insert a 0-reward row otherwise), or with negative values.
  const taskRewardMap = new Map<string, number>();
  for (const t of tasks ?? []) {
    if (!t.taskHash || !t.lovelaceAmount) continue;
    const lovelace = Number(t.lovelaceAmount);
    if (Number.isFinite(lovelace) && lovelace >= 0) {
      taskRewardMap.set(t.taskHash, lovelace);
    }
  }

  // Submitter per task comes from on-chain submissions. Submissions without a
  // slot are chain-unverifiable; skip them rather than letting multiple slotless
  // rows produce non-deterministic first-wins attribution. When a dateRange is
  // active, filter submissions too so attribution doesn't leak across the window.
  const candidateSubmissions = (submissions ?? []).filter((s) => s.slot != null);
  const scopedSubmissions = dateRange
    ? candidateSubmissions.filter((s) => isSlotInRange(s.slot, dateRange))
    : candidateSubmissions;
  const submitterByTask = new Map<string, string>();
  const submitterSlotByTask = new Map<string, number>();
  for (const s of scopedSubmissions) {
    if (!s.taskHash || !s.submittedBy) continue;
    const slot = s.slot!;
    const existingSlot = submitterSlotByTask.get(s.taskHash);
    if (existingSlot == null || slot > existingSlot) {
      submitterByTask.set(s.taskHash, s.submittedBy);
      submitterSlotByTask.set(s.taskHash, slot);
    }
  }

  // Pending count is still sourced from the manager commitments API —
  // that's the one thing it's authoritative for.
  let pendingCount = 0;
  for (const c of allCommitments) {
    if (c.commitmentStatus === "COMMITTED") pendingCount++;
  }

  const taskTitleMap = new Map<string, string>();
  for (const t of tasks ?? []) {
    taskTitleMap.set(t.taskHash, t.title);
  }

  const allAcceptedAssessments = (assessments ?? []).filter(
    (a) => a.decision === "ACCEPTED",
  );
  const allPayouts = allAcceptedAssessments.map((a) => ({
    taskHash: a.taskHash,
    lovelace: taskRewardMap.get(a.taskHash) ?? 0,
    slot: a.slot,
  }));

  const deposits = dateRange
    ? allDeposits.filter((d) => isSlotInRange(d.slot, dateRange))
    : allDeposits;
  const payouts = dateRange
    ? allPayouts.filter((p) => isSlotInRange(p.slot, dateRange))
    : allPayouts;
  const acceptedAssessments = dateRange
    ? allAcceptedAssessments.filter((a) => isSlotInRange(a.slot, dateRange))
    : allAcceptedAssessments;

  const monthly = computeMonthlyTreasuryActivity(deposits, payouts);

  // Build acceptedCommitments before the summary so contributorCount reflects
  // the same filtered window as the other summary fields.
  const acceptedCommitments: AcceptedCommitmentData[] = [];
  const seenTasks = new Set<string>();
  for (const p of payouts) {
    if (seenTasks.has(p.taskHash)) continue;
    seenTasks.add(p.taskHash);
    const submittedBy = submitterByTask.get(p.taskHash);
    if (submittedBy) {
      acceptedCommitments.push({
        submittedBy,
        taskHash: p.taskHash,
        lovelaceAmount: taskRewardMap.get(p.taskHash) ?? 0,
      });
    }
  }

  const contributorAliases = dateRange
    ? Array.from(new Set(acceptedCommitments.map((c) => c.submittedBy)))
    : (projectDetail.contributors ?? []).map((c) => c.alias);

  const summary = computeTreasurySummary(
    treasuryBalance,
    deposits,
    payouts,
    contributorAliases,
    pendingCount,
  );

  const taskActivityLog = computeTaskActivityLog(
    acceptedAssessments.map((a) => ({
      taskHash: a.taskHash,
      taskTitle: taskTitleMap.get(a.taskHash),
      contributor: submitterByTask.get(a.taskHash) ?? "unknown",
      reward: taskRewardMap.get(a.taskHash) ?? 0,
      assessedBy: a.assessedBy,
      slot: a.slot,
    })),
  );

  return { summary, monthly, acceptedCommitments, taskActivityLog };
}

/**
 * Derived data hook - computes treasury report metrics from existing data.
 *
 * Unlike query hooks (useProject, useManagerCommitments), this hook does not
 * make API calls. It transforms data provided by the parent component.
 *
 * @param projectDetail - From useProject()
 * @param allCommitments - From useManagerCommitments()
 * @param dateRange - Optional date filter for historical activity
 * @returns Computed treasury report or null if data not ready
 */
export function useTreasuryReport(
  projectDetail: ProjectDetail | null | undefined,
  allCommitments: ManagerCommitment[],
  dateRange?: DateRange | null,
): TreasuryReportResult | null {
  return useMemo(
    () => computeTreasuryReport(projectDetail, allCommitments, dateRange),
    // dateRange is from useState — reference-stable between renders
    [projectDetail, allCommitments, dateRange],
  );
}
