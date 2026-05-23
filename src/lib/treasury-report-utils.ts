/**
 * Treasury report utilities — pure functions for computing project financial reports
 * from real on-chain data (no hardcoded fee constants).
 */

import { slotToDate } from "~/lib/cardano-utils";

/** Platform commission rate applied to distributed rewards */
export const PLATFORM_COMMISSION_RATE = 0.01; // 1%

/**
 * Reusable formatter for month labels (e.g., "Jan 2024").
 * `timeZone: "UTC"` matches the UTC-based bucket key derivation below
 * (`getUTCFullYear`/`getUTCMonth`) so the label always describes the same
 * month the key refers to, regardless of the machine's local timezone.
 */
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export interface TreasuryReportSummary {
  treasuryBalance: number; // current spendable (lovelace)
  totalDeposited: number; // all-time deposits (lovelace)
  rewardsDistributed: number; // sum of accepted task rewards (lovelace)
  platformFee: number; // PLATFORM_COMMISSION_RATE * rewardsDistributed (lovelace)
  contributorCount: number; // deduplicated
  tasksCompleted: number; // unique taskHashes with accepted status
  tasksPending: number; // commitments with COMMITTED status
}

export interface ContributorBreakdownEntry {
  alias: string;
  tasksCompleted: number;
  totalEarned: number; // lovelace
}

export interface MonthlyTreasuryEntry {
  month: string;
  label: string;
  tasksCompleted: number;
  deposits: number; // lovelace
  rewardsPaid: number; // lovelace
  platformFee: number; // lovelace
  netFlow: number; // deposits - rewardsPaid
}

export interface TaskActivityEntry {
  taskTitle: string;
  taskHash: string;
  contributor: string;
  reward: number; // lovelace
  completedDate: Date | null;
  approvedBy: string;
}

/**
 * Grouped view of the task activity log — either by contributor or by month.
 * Both axes produce the same shape so rendering can be axis-agnostic.
 *
 * `groupKey` is the stable sort/identity key (alias for contributor mode,
 * YYYY-MM for month mode, or the sentinel `"__unattributed__"` / `"__undated__"`
 * for the pinned-last fallback groups).
 * `groupLabel` is stakeholder-facing text ("Alice" | "Apr 2026" | "Unattributed" | "Date not recorded").
 */
export interface TaskActivityGroup {
  groupKey: string;
  groupLabel: string;
  tasksCompleted: number; // unique taskHashes
  totalEarned: number; // lovelace
  entries: TaskActivityEntry[];
  /**
   * True when the group is the pinned-last fallback bucket ("Unattributed"
   * for unknown contributors, "Date not recorded" for null-dated entries).
   * Consumers rely on this flag — NOT `groupKey === SENTINEL` — to decide
   * sort position, so a real contributor whose alias happens to equal a
   * sentinel string can't masquerade as the fallback.
   */
  isFallback: boolean;
}

/** Sort order for Contributor Breakdown rows. */
export type ContributorBreakdownSort = "total-earned-desc" | "alphabetical";

/** Grouping axis for the Task Activity Log (on-screen + PDF). */
export type TaskActivitySort = "by-month" | "by-contributor";

/** Sentinel `groupKey` for the pinned-last "Unattributed" fallback group. */
export const UNATTRIBUTED_GROUP_KEY = "__unattributed__";
/** Sentinel `groupKey` for the pinned-last "Date not recorded" fallback group. */
export const UNDATED_GROUP_KEY = "__undated__";

interface DepositEvent {
  lovelace: number;
  slot?: number;
}

interface PayoutEvent {
  taskHash: string;
  lovelace: number;
  slot?: number;
}

export function computeTreasurySummary(
  treasuryBalance: number,
  deposits: DepositEvent[],
  payouts: PayoutEvent[],
  contributorAliases: string[],
  tasksPending = 0,
): TreasuryReportSummary {
  const totalDeposited = deposits.reduce((sum, d) => sum + d.lovelace, 0);
  const rewardsDistributed = payouts.reduce((sum, p) => sum + p.lovelace, 0);
  const uniqueContributors = new Set(contributorAliases).size;
  const uniqueTasks = new Set(payouts.map((p) => p.taskHash)).size;

  return {
    treasuryBalance,
    totalDeposited,
    rewardsDistributed,
    platformFee: Math.round(rewardsDistributed * PLATFORM_COMMISSION_RATE),
    contributorCount: uniqueContributors,
    tasksCompleted: uniqueTasks,
    tasksPending,
  };
}

export function computeMonthlyTreasuryActivity(
  deposits: DepositEvent[],
  payouts: PayoutEvent[],
): MonthlyTreasuryEntry[] {
  const buckets = new Map<
    string,
    { deposits: number; rewardsPaid: number; taskHashes: Set<string> }
  >();

  function getOrCreateBucket(slot: number | undefined) {
    const date = slot != null ? slotToDate(slot) : null;
    if (!date || isNaN(date.getTime())) return null;
    // UTC keys align with MONTH_FORMATTER's UTC timezone (above) and with
    // computeTaskActivityByMonth's UTC-based grouping — all three agree
    // on which month a boundary task belongs to.
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { deposits: 0, rewardsPaid: 0, taskHashes: new Set<string>() };
      buckets.set(key, bucket);
    }
    return bucket;
  }

  for (const d of deposits) {
    const bucket = getOrCreateBucket(d.slot);
    if (bucket) bucket.deposits += d.lovelace;
  }
  for (const p of payouts) {
    const bucket = getOrCreateBucket(p.slot);
    if (bucket) {
      bucket.rewardsPaid += p.lovelace;
      bucket.taskHashes.add(p.taskHash);
    }
  }

  if (buckets.size === 0) return [];

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [year, mon] = month.split("-").map(Number);
      const platformFee = Math.round(
        data.rewardsPaid * PLATFORM_COMMISSION_RATE,
      );
      return {
        month,
        label: MONTH_FORMATTER.format(
          new Date(Date.UTC(year ?? 0, (mon ?? 1) - 1, 1)),
        ),
        tasksCompleted: data.taskHashes.size,
        deposits: data.deposits,
        rewardsPaid: data.rewardsPaid,
        platformFee,
        netFlow: data.deposits - data.rewardsPaid - platformFee,
      };
    });
}

export function computeBurnRate(summary: TreasuryReportSummary): number | null {
  if (summary.totalDeposited === 0) return null;
  return (
    ((summary.rewardsDistributed + summary.platformFee) /
      summary.totalDeposited) *
    100
  );
}

export function computeContributorBreakdown(
  acceptedCommitments: {
    submittedBy: string;
    taskHash: string;
    lovelaceAmount: number;
  }[],
  sort: ContributorBreakdownSort = "total-earned-desc",
): ContributorBreakdownEntry[] {
  const byAlias = new Map<
    string,
    { tasks: Set<string>; totalEarned: number }
  >();

  for (const c of acceptedCommitments) {
    const entry = byAlias.get(c.submittedBy) ?? {
      tasks: new Set<string>(),
      totalEarned: 0,
    };
    entry.tasks.add(c.taskHash);
    entry.totalEarned += c.lovelaceAmount;
    byAlias.set(c.submittedBy, entry);
  }

  const rows = Array.from(byAlias.entries()).map(([alias, data]) => ({
    alias,
    tasksCompleted: data.tasks.size,
    totalEarned: data.totalEarned,
  }));

  if (sort === "alphabetical") {
    return rows.sort((a, b) =>
      a.alias.localeCompare(b.alias, undefined, { sensitivity: "base" }),
    );
  }
  return rows.sort((a, b) => b.totalEarned - a.totalEarned);
}

interface TaskActivityInput {
  taskHash: string;
  taskTitle?: string;
  contributor: string;
  reward: number; // lovelace
  assessedBy: string;
  slot?: number;
}

export function computeTaskActivityLog(
  inputs: TaskActivityInput[],
): TaskActivityEntry[] {
  return inputs
    .map((input) => ({
      taskTitle: input.taskTitle ?? input.taskHash.slice(0, 8),
      taskHash: input.taskHash,
      contributor: input.contributor,
      reward: input.reward,
      completedDate: input.slot != null ? slotToDate(input.slot) : null,
      approvedBy: input.assessedBy,
    }))
    .sort(compareByCompletedDateDesc);
}

/** Null-safe comparator: most recent completedDate first, nulls last. */
function compareByCompletedDateDesc(
  a: TaskActivityEntry,
  b: TaskActivityEntry,
): number {
  if (!a.completedDate && !b.completedDate) return 0;
  if (!a.completedDate) return 1;
  if (!b.completedDate) return -1;
  return b.completedDate.getTime() - a.completedDate.getTime();
}

/**
 * Groups `TaskActivityEntry[]` by contributor alias, sorted alphabetically
 * (case-insensitive). The fallback `"unknown"` bucket is displayed as
 * "Unattributed" and pinned last — symmetric with "Date not recorded" in
 * month mode, and avoids the data-quality-bucket-between-real-contributors
 * look in stakeholder PDFs.
 *
 * NOTE: The grouping key is the string `entry.contributor` (a display alias,
 * not an address-derived ID). Two contributors with the same alias would
 * merge into one group. This is the same assumption `computeContributorBreakdown`
 * already makes; preserving it keeps the per-group aggregates identical to
 * the breakdown for identical input (R5 invariant).
 */
export function computeTaskActivityByContributor(
  entries: TaskActivityEntry[],
): TaskActivityGroup[] {
  const byAlias = new Map<
    string,
    { tasks: Set<string>; totalEarned: number; entries: TaskActivityEntry[] }
  >();

  for (const entry of entries) {
    const bucket = byAlias.get(entry.contributor) ?? {
      tasks: new Set<string>(),
      totalEarned: 0,
      entries: [],
    };
    bucket.tasks.add(entry.taskHash);
    bucket.totalEarned += entry.reward;
    bucket.entries.push(entry);
    byAlias.set(entry.contributor, bucket);
  }

  const groups = Array.from(byAlias.entries()).map(([alias, data]) => {
    const isFallback = alias === "unknown";
    return {
      groupKey: isFallback ? UNATTRIBUTED_GROUP_KEY : alias,
      groupLabel: isFallback ? "Unattributed" : alias,
      tasksCompleted: data.tasks.size,
      totalEarned: data.totalEarned,
      entries: data.entries.slice().sort(compareByCompletedDateDesc),
      isFallback,
    };
  });

  return groups.sort((a, b) => {
    // Pin the unattributed fallback last regardless of alphabetical position.
    // Use the isFallback flag (not groupKey === SENTINEL) so a real alias
    // that happens to equal the sentinel string can't masquerade as the
    // fallback bucket.
    if (a.isFallback && !b.isFallback) return 1;
    if (!a.isFallback && b.isFallback) return -1;
    return a.groupLabel.localeCompare(b.groupLabel, undefined, {
      sensitivity: "base",
    });
  });
}

/**
 * Reusable formatter for group headings in month mode (e.g., "Apr 2026").
 * `timeZone: "UTC"` is required — we derive the bucket key from UTC via
 * `getUTCMonth` / `getUTCFullYear`, so the label must use the same zone to
 * avoid machine-local drift (e.g., April 1 00:00 UTC formatted as "Mar"
 * on a machine in US timezones).
 */
const MONTH_GROUP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Groups `TaskActivityEntry[]` by completion month (`YYYY-MM` derived in UTC
 * via `completedDate.getUTCFullYear`/`getUTCMonth`). Groups sort reverse-
 * chronologically (newest first). Entries with `completedDate === null` form
 * a sentinel group displayed as "Date not recorded" and pinned last.
 *
 * Timezone note: month buckets use UTC, matching `computeMonthlyTreasuryActivity`'s
 * derivation so the two tables agree on which month a task belongs to.
 */
export function computeTaskActivityByMonth(
  entries: TaskActivityEntry[],
): TaskActivityGroup[] {
  const byMonth = new Map<
    string,
    {
      label: string;
      tasks: Set<string>;
      totalEarned: number;
      entries: TaskActivityEntry[];
    }
  >();

  for (const entry of entries) {
    const date = entry.completedDate;
    const key = date
      ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
      : UNDATED_GROUP_KEY;
    const label = date
      ? MONTH_GROUP_FORMATTER.format(
          new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)),
        )
      : "Date not recorded";

    const bucket = byMonth.get(key) ?? {
      label,
      tasks: new Set<string>(),
      totalEarned: 0,
      entries: [],
    };
    bucket.tasks.add(entry.taskHash);
    bucket.totalEarned += entry.reward;
    bucket.entries.push(entry);
    byMonth.set(key, bucket);
  }

  const groups = Array.from(byMonth.entries()).map(([key, data]) => ({
    groupKey: key,
    groupLabel: data.label,
    tasksCompleted: data.tasks.size,
    totalEarned: data.totalEarned,
    entries: data.entries.slice().sort(compareByCompletedDateDesc),
    isFallback: key === UNDATED_GROUP_KEY,
  }));

  return groups.sort((a, b) => {
    if (a.isFallback && !b.isFallback) return 1;
    if (!a.isFallback && b.isFallback) return -1;
    // Both dated groups: YYYY-MM keys compare lexicographically in reverse
    // (newest first).
    return b.groupKey.localeCompare(a.groupKey);
  });
}

/** Escape a CSV cell to prevent formula injection. */
export function escapeCsvCell(value: string): string {
  if (/^[=+\-@\t\r\0]/.test(value.trimStart())) {
    return `"'${value.replace(/"/g, '""')}"`;
  }
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateTreasuryReportCsv(
  projectTitle: string,
  projectId: string,
  network: string,
  summary: TreasuryReportSummary,
  monthly: MonthlyTreasuryEntry[],
  contributors: ContributorBreakdownEntry[] = [],
  taskActivity: TaskActivityEntry[] = [],
  reportPeriod?: string,
): string {
  const date = new Date().toISOString().split("T")[0];
  const toAda = (lovelace: number) => (lovelace / 1_000_000).toFixed(2);

  const rows: (string | undefined)[][] = [
    ["Treasury Report"],
    ["Project", projectTitle],
    ["Project ID", projectId],
    ["Network", network],
    ["Report Date", date],
    ["Report Period", reportPeriod ?? "All Time"],
    [],
    ["Summary", "Value"],
    ["Treasury Balance", `${toAda(summary.treasuryBalance)} ADA`],
    ["Total Deposited", `${toAda(summary.totalDeposited)} ADA`],
    ["Rewards Distributed", `${toAda(summary.rewardsDistributed)} ADA`],
    ["Platform Fee (1%)", `${toAda(summary.platformFee)} ADA`],
    ["Contributors", String(summary.contributorCount)],
    ["Tasks Completed", String(summary.tasksCompleted)],
  ];

  if (monthly.length > 0) {
    rows.push([]);
    rows.push([
      "Month",
      "Tasks",
      "Deposits (ADA)",
      "Rewards Paid (ADA)",
      "Platform Fee (ADA)",
      "Net Flow (ADA)",
    ]);
    for (const entry of monthly) {
      rows.push([
        entry.label,
        String(entry.tasksCompleted),
        toAda(entry.deposits),
        toAda(entry.rewardsPaid),
        toAda(entry.platformFee),
        toAda(entry.netFlow),
      ]);
    }
  }

  if (contributors.length > 0) {
    rows.push([]);
    rows.push(["Contributor Breakdown"]);
    rows.push(["Contributor", "Tasks Completed", "Total Earned (ADA)"]);
    for (const c of contributors) {
      rows.push([c.alias, String(c.tasksCompleted), toAda(c.totalEarned)]);
    }
  }

  if (taskActivity.length > 0) {
    rows.push([]);
    rows.push(["Task Activity Log"]);
    rows.push([
      "Date",
      "Task",
      "Task Hash",
      "Contributor",
      "Reward (ADA)",
      "Approved By",
    ]);
    for (const t of taskActivity) {
      rows.push([
        t.completedDate ? t.completedDate.toISOString().split("T")[0] : "N/A",
        t.taskTitle,
        t.taskHash.slice(0, 8),
        t.contributor,
        toAda(t.reward),
        t.approvedBy,
      ]);
    }
  }

  return rows
    .map((row) => row.map((cell) => escapeCsvCell(cell ?? "")).join(","))
    .join("\n");
}

export function downloadAsFile(
  content: string | Blob,
  filename: string,
  mimeType?: string,
): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
