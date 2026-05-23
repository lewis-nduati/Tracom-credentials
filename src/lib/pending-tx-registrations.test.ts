import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

import { pendingTxRegistrations } from "./pending-tx-registrations";

const STORAGE_KEY = "pendingTxRegistrations";

interface FakeStorage {
  store: Record<string, string>;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

function installFakeWindowAndStorage(): FakeStorage {
  const store: Record<string, string> = {};
  const fake: FakeStorage = {
    store,
    getItem: (key) => (key in store ? store[key]! : null),
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
  };
  // The module guards on `typeof window === "undefined"`, so window must exist.
  (globalThis as unknown as { window?: unknown }).window = {};
  (globalThis as unknown as { localStorage?: unknown }).localStorage = fake;
  return fake;
}

function uninstallFakeWindowAndStorage(): void {
  delete (globalThis as unknown as { window?: unknown }).window;
  delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
}

const V2_ENTRY_BASE = {
  schemaVersion: 2,
  txHash: "0xabc",
  gatewayTxType: "project_join",
  frontendTxType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
  createdAt: Date.now(),
};

describe("pending-tx-registrations", () => {
  let fakeStorage: FakeStorage;
  let warnSpy: ReturnType<typeof mock.method>;

  beforeEach(() => {
    fakeStorage = installFakeWindowAndStorage();
    warnSpy = mock.method(console, "warn", () => {});
  });

  afterEach(() => {
    warnSpy.mock.restore();
    uninstallFakeWindowAndStorage();
  });

  describe("readAll (via getAll)", () => {
    it("v1-shape entry (no schemaVersion, has txType field) is dropped on read with console.warn AND cleaned list re-persisted", () => {
      const v1Entry = {
        txHash: "0xv1tx",
        txType: "project_join", // pre-v2 field name
        metadata: { foo: "bar" },
        createdAt: Date.now(),
      };
      fakeStorage.setItem(STORAGE_KEY, JSON.stringify([v1Entry]));

      const result = pendingTxRegistrations.getAll();

      assert.deepEqual(result, []);
      assert.equal(warnSpy.mock.callCount(), 1);
      const [warnArg] = warnSpy.mock.calls[0]!.arguments as [string];
      assert.match(warnArg, /Dropped 1 malformed/);

      // Cleaned list persisted: entry is gone from storage. Empty list ⇒
      // writeAll calls removeItem(STORAGE_KEY).
      assert.equal(fakeStorage.getItem(STORAGE_KEY), null);

      // Re-read does not warn again (cleaned list persisted).
      warnSpy.mock.resetCalls();
      const second = pendingTxRegistrations.getAll();
      assert.deepEqual(second, []);
      assert.equal(warnSpy.mock.callCount(), 0);
    });

    it("v2 entry round-trips through localStorage (add → getAll)", () => {
      pendingTxRegistrations.add({
        txHash: "0xnewtx",
        gatewayTxType: "project_join",
        frontendTxType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
        metadata: { courseTitle: "Course X" },
        recoveryContext: {
          kind: "project_contributor",
          projectId: "p1",
          taskHash: "t1",
        },
      });

      const all = pendingTxRegistrations.getAll();
      assert.equal(all.length, 1);
      const entry = all[0]!;
      assert.equal(entry.schemaVersion, 2);
      assert.equal(entry.txHash, "0xnewtx");
      assert.equal(entry.gatewayTxType, "project_join");
      assert.equal(entry.frontendTxType, "PROJECT_CONTRIBUTOR_TASK_COMMIT");
      assert.deepEqual(entry.metadata, { courseTitle: "Course X" });
      assert.deepEqual(entry.recoveryContext, {
        kind: "project_contributor",
        projectId: "p1",
        taskHash: "t1",
      });
      assert.equal(typeof entry.createdAt, "number");
    });

    it("isWellFormed rejects entries missing each required field, and entries with unknown frontendTxType", () => {
      const now = Date.now();
      const candidates = [
        // missing txHash
        {
          schemaVersion: 2,
          gatewayTxType: "project_join",
          frontendTxType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
          createdAt: now,
        },
        // missing gatewayTxType
        {
          schemaVersion: 2,
          txHash: "0xa",
          frontendTxType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
          createdAt: now,
        },
        // missing frontendTxType
        {
          schemaVersion: 2,
          txHash: "0xb",
          gatewayTxType: "project_join",
          createdAt: now,
        },
        // missing createdAt
        {
          schemaVersion: 2,
          txHash: "0xc",
          gatewayTxType: "project_join",
          frontendTxType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
        },
        // unknown frontendTxType
        {
          schemaVersion: 2,
          txHash: "0xd",
          gatewayTxType: "project_join",
          frontendTxType: "TOTALLY_FAKE_TX_TYPE",
          createdAt: now,
        },
        // schemaVersion 1 (pre-v2)
        {
          schemaVersion: 1,
          txHash: "0xe",
          gatewayTxType: "project_join",
          frontendTxType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
          createdAt: now,
        },
      ];
      fakeStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));

      const result = pendingTxRegistrations.getAll();
      assert.deepEqual(result, []);
      // Single warn for the batch drop
      assert.equal(warnSpy.mock.callCount(), 1);
    });

    it("returns [] safely when the JSON is corrupted", () => {
      fakeStorage.setItem(STORAGE_KEY, "{not json");
      const result = pendingTxRegistrations.getAll();
      assert.deepEqual(result, []);
    });
  });

  describe("pruneExpired", () => {
    it("removes entries older than the 2h TTL and keeps fresh ones", () => {
      const now = Date.now();
      const TTL_MS = 2 * 60 * 60 * 1000;
      const stale = {
        ...V2_ENTRY_BASE,
        txHash: "0xstale",
        createdAt: now - TTL_MS - 1,
      };
      const fresh = {
        ...V2_ENTRY_BASE,
        txHash: "0xfresh",
        createdAt: now - (TTL_MS - 1_000),
      };
      fakeStorage.setItem(STORAGE_KEY, JSON.stringify([stale, fresh]));

      pendingTxRegistrations.pruneExpired();

      const remaining = pendingTxRegistrations.getAll();
      assert.equal(remaining.length, 1);
      assert.equal(remaining[0]!.txHash, "0xfresh");
    });

    it("does not touch storage if all entries are within TTL", () => {
      const now = Date.now();
      const recent = {
        ...V2_ENTRY_BASE,
        txHash: "0xrecent",
        createdAt: now,
      };
      fakeStorage.setItem(STORAGE_KEY, JSON.stringify([recent]));

      pendingTxRegistrations.pruneExpired();

      const remaining = pendingTxRegistrations.getAll();
      assert.equal(remaining.length, 1);
      assert.equal(remaining[0]!.txHash, "0xrecent");
    });
  });

  describe("add / remove", () => {
    it("dedupes by txHash on add", () => {
      pendingTxRegistrations.add({
        txHash: "0xdup",
        gatewayTxType: "project_join",
        frontendTxType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
      });
      pendingTxRegistrations.add({
        txHash: "0xdup",
        gatewayTxType: "project_join",
        frontendTxType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
      });
      const all = pendingTxRegistrations.getAll();
      assert.equal(all.length, 1);
    });

    it("remove() drops the matching entry and clears storage when empty", () => {
      pendingTxRegistrations.add({
        txHash: "0xrem",
        gatewayTxType: "project_join",
        frontendTxType: "PROJECT_CONTRIBUTOR_TASK_COMMIT",
      });
      assert.equal(pendingTxRegistrations.getAll().length, 1);
      pendingTxRegistrations.remove("0xrem");
      assert.equal(pendingTxRegistrations.getAll().length, 0);
      assert.equal(fakeStorage.getItem(STORAGE_KEY), null);
    });
  });
});
