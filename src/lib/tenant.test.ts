import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseOwners, isOwnedBy } from "./tenant";

describe("parseOwners", () => {
  it("splits a comma-separated list and trims spaces", () => {
    assert.deepEqual(parseOwners("EverydayLewis, tracom"), ["EverydayLewis", "tracom"]);
  });

  it("returns nothing for an unset or blank value", () => {
    assert.deepEqual(parseOwners(undefined), []);
    assert.deepEqual(parseOwners(" , "), []);
  });
});

describe("isOwnedBy", () => {
  it("matches a configured owner exactly", () => {
    assert.equal(isOwnedBy("tracom", ["tracom"]), true);
    assert.equal(isOwnedBy("james", ["tracom"]), false);
  });

  it("fails closed when no owner is configured", () => {
    assert.equal(isOwnedBy("james", []), false);
  });

  it("rejects a missing owner", () => {
    assert.equal(isOwnedBy(undefined, ["tracom"]), false);
    assert.equal(isOwnedBy(null, ["tracom"]), false);
  });
});
