import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeContributorBreakdown,
  computeMonthlyTreasuryActivity,
  computeTaskActivityByContributor,
  computeTaskActivityByMonth,
  escapeCsvCell,
  UNATTRIBUTED_GROUP_KEY,
  type TaskActivityEntry,
} from "./treasury-report-utils";

// Preprod Shelley genesis: startSlot=0, startUnix=1655683200.
// slotToDate(slot) returns new Date((1655683200 + slot) * 1000).
// These slots correspond to Mar 31 23:59 UTC 2026 and Apr 1 00:01 UTC 2026.
const MAR_31_2359_UTC_SLOT = 119318340;
const APR_01_0001_UTC_SLOT = 119318460;

function entry(overrides: Partial<TaskActivityEntry>): TaskActivityEntry {
  return {
    taskTitle: "task",
    taskHash: "hash",
    contributor: "alice",
    reward: 10_000_000,
    completedDate: new Date("2026-04-15T12:00:00Z"),
    approvedBy: "admin",
    ...overrides,
  };
}

describe("escapeCsvCell", () => {
  it("passes plain strings through untouched", () => {
    assert.equal(escapeCsvCell("hello"), "hello");
    assert.equal(escapeCsvCell("alice.ada"), "alice.ada");
    assert.equal(escapeCsvCell(""), "");
  });

  it("prefixes formula-lead characters with an apostrophe inside quotes", () => {
    assert.equal(escapeCsvCell("=SUM(A1)"), `"'=SUM(A1)"`);
    assert.equal(escapeCsvCell("+1"), `"'+1"`);
    assert.equal(escapeCsvCell("-2"), `"'-2"`);
    assert.equal(escapeCsvCell("@cmd"), `"'@cmd"`);
  });

  it("still detects formula prefixes when leading whitespace is present", () => {
    // trimStart strips ASCII + Unicode whitespace including NBSP/BOM before
    // the regex tests the first real character.
    assert.equal(escapeCsvCell("   =SUM(A1)"), `"'   =SUM(A1)"`);
    assert.equal(escapeCsvCell("\u00A0=evil"), `"'\u00A0=evil"`);
    assert.equal(escapeCsvCell("\uFEFF=evil"), `"'\uFEFF=evil"`);
  });

  it("quotes and doubles internal quotes for cells with ,", () => {
    assert.equal(escapeCsvCell("a, b, c"), `"a, b, c"`);
  });

  it("quotes and doubles internal quotes for cells with embedded quotes", () => {
    assert.equal(escapeCsvCell(`say "hi"`), `"say ""hi"""`);
  });

  it("quotes cells containing newlines and carriage returns", () => {
    assert.equal(escapeCsvCell("line1\nline2"), `"line1\nline2"`);
    assert.equal(escapeCsvCell("a\rb"), `"a\rb"`);
  });

  it("formula escaping takes precedence over plain special-char quoting", () => {
    // A cell that is both formula-prefixed and contains a comma should still
    // be handled by the formula branch (leading apostrophe + wrapped).
    assert.equal(escapeCsvCell("=A1,B1"), `"'=A1,B1"`);
  });

  it("escapes internal quotes even when the formula branch triggers", () => {
    assert.equal(escapeCsvCell(`="safe"`), `"'=""safe"""`);
  });
});

describe("computeTaskActivityByContributor", () => {
  it("returns [] for empty input", () => {
    assert.deepEqual(computeTaskActivityByContributor([]), []);
  });

  it("groups entries by contributor alias, sorted alphabetically (case-insensitive)", () => {
    const entries = [
      entry({ contributor: "Zoe", taskHash: "z1" }),
      entry({ contributor: "alice", taskHash: "a1" }),
      entry({ contributor: "bob", taskHash: "b1" }),
    ];
    const groups = computeTaskActivityByContributor(entries);
    assert.deepEqual(
      groups.map((g) => g.groupLabel),
      ["alice", "bob", "Zoe"],
    );
  });

  it("sorts entries within a group by completedDate desc, nulls last", () => {
    const entries = [
      entry({ contributor: "alice", taskHash: "a1", completedDate: new Date("2026-03-01T00:00:00Z") }),
      entry({ contributor: "alice", taskHash: "a2", completedDate: null }),
      entry({ contributor: "alice", taskHash: "a3", completedDate: new Date("2026-04-01T00:00:00Z") }),
    ];
    const [alice] = computeTaskActivityByContributor(entries);
    assert.equal(alice!.entries[0]!.taskHash, "a3");
    assert.equal(alice!.entries[1]!.taskHash, "a1");
    assert.equal(alice!.entries[2]!.taskHash, "a2");
  });

  it("aggregates tasksCompleted (unique taskHashes) and totalEarned (sum of rewards)", () => {
    const entries = [
      entry({ contributor: "alice", taskHash: "a1", reward: 100 }),
      entry({ contributor: "alice", taskHash: "a2", reward: 200 }),
      entry({ contributor: "alice", taskHash: "a1", reward: 100 }), // duplicate hash, different assessment row
    ];
    const [alice] = computeTaskActivityByContributor(entries);
    assert.equal(alice!.tasksCompleted, 2); // a1 deduped
    assert.equal(alice!.totalEarned, 400); // all three rewards summed
  });

  it("pins 'unknown' contributor group last, relabeled 'Unattributed'", () => {
    const entries = [
      entry({ contributor: "rob", taskHash: "r1" }),
      entry({ contributor: "unknown", taskHash: "u1" }),
      entry({ contributor: "vera", taskHash: "v1" }),
    ];
    const groups = computeTaskActivityByContributor(entries);
    assert.deepEqual(
      groups.map((g) => g.groupLabel),
      ["rob", "vera", "Unattributed"],
    );
  });

  it("groups entries with identical contributor string into one group (alias collision assumption)", () => {
    const entries = [
      entry({ contributor: "alice", taskHash: "a1", reward: 100 }),
      entry({ contributor: "alice", taskHash: "a2", reward: 200 }),
    ];
    const groups = computeTaskActivityByContributor(entries);
    assert.equal(groups.length, 1);
    assert.equal(groups[0]!.groupLabel, "alice");
    assert.equal(groups[0]!.tasksCompleted, 2);
    assert.equal(groups[0]!.totalEarned, 300);
  });

  it("keeps a real contributor named '__unattributed__' distinct from the 'unknown' fallback group", () => {
    // Regression test: exported UNATTRIBUTED_GROUP_KEY must not let a crafted
    // alias masquerade as the fallback. Sort position is driven by an
    // isFallback flag on the group, not by groupKey equality with the sentinel.
    const entries = [
      entry({ contributor: "unknown", taskHash: "u1", reward: 100 }),
      entry({ contributor: "__unattributed__", taskHash: "x1", reward: 200 }),
      entry({ contributor: "alice", taskHash: "a1", reward: 50 }),
    ];
    const groups = computeTaskActivityByContributor(entries);
    assert.equal(groups.length, 3);
    // "alice" and "__unattributed__" sort alphabetically (underscores first);
    // the real "Unattributed" fallback is pinned last.
    const fallback = groups[groups.length - 1];
    assert.equal(fallback!.groupLabel, "Unattributed");
    assert.equal(fallback!.isFallback, true);
    assert.equal(fallback!.totalEarned, 100); // the "unknown" entry, not the crafted alias
    // The crafted alias shows as itself, not masquerading as the fallback.
    const crafted = groups.find((g) => g.groupLabel === "__unattributed__");
    assert.ok(crafted, "expected a separate group for the crafted alias");
    assert.equal(crafted.isFallback, false);
    assert.equal(crafted.totalEarned, 200);
  });

  it("aggregates multiple 'unknown' entries into a single Unattributed group", () => {
    const entries = [
      entry({ contributor: "unknown", taskHash: "u1", reward: 100 }),
      entry({ contributor: "unknown", taskHash: "u2", reward: 200 }),
      entry({ contributor: "alice", taskHash: "a1", reward: 50 }),
    ];
    const groups = computeTaskActivityByContributor(entries);
    assert.equal(groups.length, 2);
    const unattributed = groups.find((g) => g.groupKey === UNATTRIBUTED_GROUP_KEY);
    assert.ok(unattributed, "expected an Unattributed group");
    assert.equal(unattributed.groupLabel, "Unattributed");
    assert.equal(unattributed.tasksCompleted, 2);
    assert.equal(unattributed.totalEarned, 300);
  });
});

describe("computeTaskActivityByMonth", () => {
  it("returns [] for empty input", () => {
    assert.deepEqual(computeTaskActivityByMonth([]), []);
  });

  it("groups entries by YYYY-MM (UTC), sorted reverse-chronologically", () => {
    const entries = [
      entry({ taskHash: "feb1", completedDate: new Date("2026-02-10T00:00:00Z") }),
      entry({ taskHash: "apr1", completedDate: new Date("2026-04-05T00:00:00Z") }),
      entry({ taskHash: "mar1", completedDate: new Date("2026-03-20T00:00:00Z") }),
    ];
    const groups = computeTaskActivityByMonth(entries);
    assert.deepEqual(
      groups.map((g) => g.groupLabel),
      ["Apr 2026", "Mar 2026", "Feb 2026"],
    );
  });

  it("sorts entries within a month by completedDate desc", () => {
    const entries = [
      entry({ taskHash: "early", completedDate: new Date("2026-04-03T00:00:00Z") }),
      entry({ taskHash: "late", completedDate: new Date("2026-04-28T00:00:00Z") }),
      entry({ taskHash: "mid", completedDate: new Date("2026-04-15T00:00:00Z") }),
    ];
    const [apr] = computeTaskActivityByMonth(entries);
    assert.deepEqual(
      apr!.entries.map((e) => e.taskHash),
      ["late", "mid", "early"],
    );
  });

  it("pins null-dated entries last in a group labeled 'Date not recorded'", () => {
    const entries = [
      entry({ taskHash: "mar1", completedDate: new Date("2026-03-15T00:00:00Z") }),
      entry({ taskHash: "undated1", completedDate: null }),
      entry({ taskHash: "apr1", completedDate: new Date("2026-04-01T00:00:00Z") }),
    ];
    const groups = computeTaskActivityByMonth(entries);
    assert.deepEqual(
      groups.map((g) => g.groupLabel),
      ["Apr 2026", "Mar 2026", "Date not recorded"],
    );
  });

  it("aggregates tasksCompleted and totalEarned per month", () => {
    const entries = [
      entry({ taskHash: "a1", reward: 100, completedDate: new Date("2026-04-05T00:00:00Z") }),
      entry({ taskHash: "a2", reward: 200, completedDate: new Date("2026-04-10T00:00:00Z") }),
    ];
    const [apr] = computeTaskActivityByMonth(entries);
    assert.equal(apr!.tasksCompleted, 2);
    assert.equal(apr!.totalEarned, 300);
  });

  it("returns a single 'Date not recorded' group when all entries are null-dated", () => {
    const entries = [
      entry({ taskHash: "u1", completedDate: null }),
      entry({ taskHash: "u2", completedDate: null }),
    ];
    const groups = computeTaskActivityByMonth(entries);
    assert.equal(groups.length, 1);
    assert.equal(groups[0]!.groupLabel, "Date not recorded");
    assert.equal(groups[0]!.tasksCompleted, 2);
  });

  it("buckets UTC month boundaries correctly (Mar 31 23:59 UTC → Mar, Apr 1 00:01 UTC → Apr)", () => {
    const entries = [
      entry({ taskHash: "mar-end", completedDate: new Date("2026-03-31T23:59:00Z") }),
      entry({ taskHash: "apr-start", completedDate: new Date("2026-04-01T00:01:00Z") }),
    ];
    const groups = computeTaskActivityByMonth(entries);
    assert.deepEqual(
      groups.map((g) => g.groupLabel),
      ["Apr 2026", "Mar 2026"],
    );
    const apr = groups.find((g) => g.groupLabel === "Apr 2026");
    const mar = groups.find((g) => g.groupLabel === "Mar 2026");
    assert.equal(apr!.entries[0]!.taskHash, "apr-start");
    assert.equal(mar!.entries[0]!.taskHash, "mar-end");
  });
});

describe("computeMonthlyTreasuryActivity — UTC month boundaries", () => {
  it("buckets Mar 31 23:59 UTC payouts into 'Mar' and Apr 1 00:01 UTC into 'Apr'", () => {
    const rows = computeMonthlyTreasuryActivity(
      [],
      [
        { taskHash: "mar-end", lovelace: 100, slot: MAR_31_2359_UTC_SLOT },
        { taskHash: "apr-start", lovelace: 200, slot: APR_01_0001_UTC_SLOT },
      ],
    );
    assert.deepEqual(
      rows.map((r) => r.label),
      ["Mar 2026", "Apr 2026"],
    );
    assert.equal(rows.find((r) => r.label === "Mar 2026")!.rewardsPaid, 100);
    assert.equal(rows.find((r) => r.label === "Apr 2026")!.rewardsPaid, 200);
  });
});

describe("computeContributorBreakdown with sort parameter", () => {
  const acceptedCommitments = [
    { submittedBy: "Zoe", taskHash: "z1", lovelaceAmount: 300 },
    { submittedBy: "alice", taskHash: "a1", lovelaceAmount: 100 },
    { submittedBy: "bob", taskHash: "b1", lovelaceAmount: 200 },
  ];

  it("defaults to total-earned-desc (preserves existing caller behavior)", () => {
    const rows = computeContributorBreakdown(acceptedCommitments);
    assert.deepEqual(
      rows.map((r) => r.alias),
      ["Zoe", "bob", "alice"],
    );
  });

  it("sorts alphabetically (case-insensitive) when sort='alphabetical'", () => {
    const rows = computeContributorBreakdown(acceptedCommitments, "alphabetical");
    assert.deepEqual(
      rows.map((r) => r.alias),
      ["alice", "bob", "Zoe"],
    );
  });
});

describe("cross-util R5 invariant: grouped contributor totals match breakdown", () => {
  it("per-group tasksCompleted/totalEarned in by-contributor groups equal breakdown rows", () => {
    const entries = [
      entry({ contributor: "alice", taskHash: "a1", reward: 100 }),
      entry({ contributor: "alice", taskHash: "a2", reward: 150 }),
      entry({ contributor: "bob", taskHash: "b1", reward: 200 }),
      entry({ contributor: "unknown", taskHash: "u1", reward: 50 }),
    ];
    const groups = computeTaskActivityByContributor(entries);
    const accepted = entries.map((e) => ({
      submittedBy: e.contributor,
      taskHash: e.taskHash,
      lovelaceAmount: e.reward,
    }));
    const breakdown = computeContributorBreakdown(accepted, "alphabetical");

    // Align groups with breakdown by alias (groupLabel "Unattributed" ↔ alias "unknown").
    const byAlias = new Map(
      groups.map((g) => {
        const alias = g.groupKey === UNATTRIBUTED_GROUP_KEY ? "unknown" : g.groupLabel;
        return [alias, { tasksCompleted: g.tasksCompleted, totalEarned: g.totalEarned }];
      }),
    );

    for (const row of breakdown) {
      const matched = byAlias.get(row.alias);
      assert.ok(matched, `group for alias ${row.alias} missing`);
      assert.equal(matched.tasksCompleted, row.tasksCompleted);
      assert.equal(matched.totalEarned, row.totalEarned);
    }
    assert.equal(byAlias.size, breakdown.length);
  });
});
