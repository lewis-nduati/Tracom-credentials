import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { JSONContent } from "@tiptap/core";

import { parseContent } from "./parse-content";

// =============================================================================
// Happy path — doc-typed JSONContent
// =============================================================================

describe("parseContent — doc-typed JSONContent", () => {
  it("passes a doc-typed JSONContent object through unchanged", () => {
    const input: JSONContent = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "hello" }] },
      ],
    };
    assert.deepEqual(parseContent(input), input);
  });

  it("passes an empty doc through unchanged", () => {
    const input: JSONContent = { type: "doc", content: [] };
    assert.deepEqual(parseContent(input), input);
  });

  it("passes a doc-typed object missing a content field through unchanged", () => {
    // Preserves the current permissive behavior — the parser does not
    // reshape a doc that lacks a `content` field. Tiptap's schema is
    // authoritative for downstream validation.
    const input: JSONContent = { type: "doc" };
    assert.deepEqual(parseContent(input), input);
  });
});

// =============================================================================
// Wrapping — non-doc inputs
// =============================================================================

describe("parseContent — non-doc wrapping", () => {
  it("wraps a paragraph node in { type: 'doc', content: [node] }", () => {
    const input: JSONContent = {
      type: "paragraph",
      content: [{ type: "text", text: "hello" }],
    };
    assert.deepEqual(parseContent(input), {
      type: "doc",
      content: [input],
    });
  });

  it("wraps an array of nodes in { type: 'doc', content: arr }", () => {
    // Preserves the current `Array.isArray(content) ? content : [content]` behavior.
    const input = [
      { type: "paragraph", content: [{ type: "text", text: "a" }] },
      { type: "paragraph", content: [{ type: "text", text: "b" }] },
    ] as unknown as JSONContent;
    assert.deepEqual(parseContent(input), {
      type: "doc",
      content: input as unknown as JSONContent[],
    });
  });

  it("wraps an object with no type field in a doc (current permissive behavior)", () => {
    const input = { content: [] } as unknown as JSONContent;
    assert.deepEqual(parseContent(input), {
      type: "doc",
      content: [input],
    });
  });
});

// =============================================================================
// Fail-closed — unrecognized inputs
// =============================================================================

describe("parseContent — fail-closed inputs", () => {
  it("returns null for null", () => {
    assert.equal(parseContent(null), null);
  });

  it("returns null for undefined", () => {
    assert.equal(parseContent(undefined), null);
  });
});
