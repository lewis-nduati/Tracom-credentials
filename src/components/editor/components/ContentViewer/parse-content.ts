import type { JSONContent } from "@tiptap/core";

/**
 * Parses and normalizes Tiptap JSON content for `ContentViewer`.
 *
 * Accepts only JSON-shaped input. Strings are NOT accepted — the caller
 * contract is narrowed (see issue #509) so that chain-sourced or
 * user-submitted strings cannot silently flow into Tiptap's HTML parser.
 * Callers that need to render trusted HTML should use the
 * `trustedHtml` prop on `ContentViewer` instead.
 *
 * Returns `null` for any input this function does not recognize — the
 * consumer renders empty state rather than best-effort.
 *
 * Extracted as a pure module so it can be unit-tested without loading
 * React or Tiptap.
 */
export function parseContent(
  content: JSONContent | null | undefined,
): JSONContent | null {
  if (!content) return null;

  if (typeof content === "object") {
    // Doc-typed content passes through unchanged.
    if ((content).type === "doc") {
      return content;
    }
    // Any other object (including arrays and untyped nodes) is wrapped in
    // a doc. This preserves pre-refactor behavior so Tiptap's schema —
    // not this parser — remains the authoritative validator.
    return {
      type: "doc",
      content: Array.isArray(content)
        ? (content as JSONContent[])
        : [content],
    };
  }

  return null;
}
