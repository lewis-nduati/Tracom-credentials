import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  messageForStatus,
  parseQualifiedContributorsResponse,
} from "./use-qualified-contributors";

describe("messageForStatus", () => {
  it("maps each documented status to its distinct user-facing message", () => {
    assert.equal(messageForStatus(401, ""), "Sign in to manage this project");
    assert.equal(
      messageForStatus(403, ""),
      "You are not a manager of this project",
    );
    assert.equal(messageForStatus(404, ""), "Project not found");
    assert.equal(
      messageForStatus(502, ""),
      "Scan temporarily unavailable, retry later",
    );
    assert.equal(messageForStatus(504, ""), "Scan timed out, retry later");
  });

  it("falls back to the gateway statusText for unmapped codes", () => {
    assert.equal(
      messageForStatus(500, "Internal Server Error"),
      "Failed to fetch qualified contributors: Internal Server Error",
    );
    assert.equal(
      messageForStatus(418, "I'm a teapot"),
      "Failed to fetch qualified contributors: I'm a teapot",
    );
  });
});

describe("parseQualifiedContributorsResponse", () => {
  it("parses a well-formed envelope", () => {
    const raw = {
      data: {
        aliases: ["alice", "bob", "charlie"],
        total_count: 3,
        truncated: false,
      },
    };
    assert.deepEqual(parseQualifiedContributorsResponse(raw), {
      aliases: ["alice", "bob", "charlie"],
      totalCount: 3,
      truncated: false,
    });
  });

  it("preserves truncated=true and the server's totalCount", () => {
    const raw = {
      data: {
        aliases: Array.from({ length: 500 }, (_, i) => `alias-${i}`),
        total_count: 1234,
        truncated: true,
      },
    };
    const parsed = parseQualifiedContributorsResponse(raw);
    assert.equal(parsed.aliases.length, 500);
    assert.equal(parsed.totalCount, 1234);
    assert.equal(parsed.truncated, true);
  });

  it("returns safe defaults when the response is null or non-object", () => {
    assert.deepEqual(parseQualifiedContributorsResponse(null), {
      aliases: [],
      totalCount: 0,
      truncated: false,
    });
    assert.deepEqual(parseQualifiedContributorsResponse("oops"), {
      aliases: [],
      totalCount: 0,
      truncated: false,
    });
    assert.deepEqual(parseQualifiedContributorsResponse(42), {
      aliases: [],
      totalCount: 0,
      truncated: false,
    });
  });

  it("returns safe defaults when the data field is missing or non-object", () => {
    assert.deepEqual(parseQualifiedContributorsResponse({}), {
      aliases: [],
      totalCount: 0,
      truncated: false,
    });
    assert.deepEqual(parseQualifiedContributorsResponse({ data: null }), {
      aliases: [],
      totalCount: 0,
      truncated: false,
    });
    assert.deepEqual(parseQualifiedContributorsResponse({ data: "wrong" }), {
      aliases: [],
      totalCount: 0,
      truncated: false,
    });
  });

  it("filters non-string entries out of aliases instead of rendering them", () => {
    const raw = {
      data: {
        aliases: ["alice", null, "bob", 42, undefined, "charlie", { x: 1 }],
        total_count: 7,
        truncated: false,
      },
    };
    assert.deepEqual(parseQualifiedContributorsResponse(raw).aliases, [
      "alice",
      "bob",
      "charlie",
    ]);
  });

  it("falls back when total_count is missing or wrong type", () => {
    const raw = {
      data: {
        aliases: ["alice", "bob"],
        truncated: false,
      },
    };
    // Missing total_count → use aliases.length as a sane default.
    assert.equal(parseQualifiedContributorsResponse(raw).totalCount, 2);

    const wrongType = {
      data: {
        aliases: ["alice"],
        total_count: "lots",
        truncated: false,
      },
    };
    assert.equal(parseQualifiedContributorsResponse(wrongType).totalCount, 1);
  });

  it("falls back when truncated is missing or wrong type", () => {
    const raw = {
      data: {
        aliases: ["alice"],
        total_count: 1,
      },
    };
    assert.equal(parseQualifiedContributorsResponse(raw).truncated, false);

    const wrongType = {
      data: {
        aliases: ["alice"],
        total_count: 1,
        truncated: "yes",
      },
    };
    assert.equal(
      parseQualifiedContributorsResponse(wrongType).truncated,
      false,
    );
  });

  it("returns an empty alias list when aliases is missing or not an array", () => {
    const missing = { data: { total_count: 0, truncated: false } };
    assert.deepEqual(parseQualifiedContributorsResponse(missing).aliases, []);

    const wrongType = {
      data: { aliases: "alice,bob", total_count: 0, truncated: false },
    };
    assert.deepEqual(parseQualifiedContributorsResponse(wrongType).aliases, []);
  });
});
