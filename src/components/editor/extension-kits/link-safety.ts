/**
 * Link href validator used as `isAllowedUri` on the Tiptap Link extension.
 *
 * Runs BOTH Tiptap's `defaultValidate` AND an explicit dangerous-scheme regex
 * on a whitespace-normalized copy of the URL. Belt-and-braces: `defaultValidate`
 * alone rejects `javascript:`/`data:`/`vbscript:` today (Tiptap's default
 * protocol allow-list excludes them), but if a future maintainer replaces it
 * with something permissive, the explicit regex on a normalized URL still
 * blocks the known XSS vectors and common bypass variants like `java\nscript:`,
 * `\tjavascript:`, or `java\u200Bscript:`.
 *
 * The whitespace-strip pattern matches Tiptap's own
 * `UNICODE_WHITESPACE_REGEX_GLOBAL` (ASCII control chars + NBSP + OGHAM +
 * MVS + U+2000-U+2029 which includes zero-width spaces and bidi formatting +
 * U+205F + U+3000 + BOM), so our belt-and-braces sees the same normalized
 * input `defaultValidate` does even when `defaultValidate` is replaced.
 *
 * Lives in a dedicated pure module (no Tiptap, no env, no framework imports)
 * so `link-safety.test.ts` can import it without triggering `~/env` validation.
 * Follows the same boundary pattern as `~/lib/promise-utils`.
 *
 * See issue #508 and the "Editor security" convention in `.claude/CLAUDE.md`.
 */

// Mirrors @tiptap/extension-link's UNICODE_WHITESPACE_PATTERN so our explicit
// check normalizes the same invisible/whitespace characters Tiptap does.
const INVISIBLE_CHARS_REGEX = /[\0-\x20\xA0\u1680\u180E\u2000-\u2029\u205F\u3000\uFEFF]/g;

// Dangerous URI schemes that must never render as a live link. Case-insensitive.
const DANGEROUS_SCHEME_REGEX = /^(?:javascript|data|vbscript):/i;

// Extracts the scheme from a URL (everything before the first `:`, lowercased).
// Returns `null` for schemeless URLs (relative paths, anchors, bare URLs).
// Only considers a prefix a scheme if it matches the URI scheme grammar
// (RFC 3986: scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )), which
// prevents paths containing colons (e.g., `foo:bar` in a query string after a
// slash) from being misread as a scheme.
const SCHEME_REGEX = /^([a-z][a-z0-9+\-.]*):/i;

function extractScheme(url: string): string | null {
  const match = SCHEME_REGEX.exec(url);
  return match ? match[1]!.toLowerCase() : null;
}

/**
 * Explicit app-level allow-list. If a Link mark's scheme isn't in this list,
 * the validator rejects it regardless of what `defaultValidate` returns.
 *
 * Tiptap's `protocols` option (in `Link.configure(...)`) does NOT narrow the
 * allow-list — it's additive to Tiptap's hardcoded 10-scheme default. This
 * constant is the actual restrictive allow-list for the editor.
 */
const ALLOWED_SCHEMES: ReadonlySet<string> = new Set([
  "http",
  "https",
  "mailto",
]);

export function isAllowedLinkUri(
  url: string,
  ctx: { defaultValidate: (url: string) => boolean },
): boolean {
  // Defensive guard: Tiptap's Link option declares `url: string`, but be
  // safe against unexpected inputs (empty strings, non-strings via JS runtime).
  if (typeof url !== "string" || url.length === 0) return false;

  const stripped = url.replace(INVISIBLE_CHARS_REGEX, "");

  // Scheme narrowing. Relative URLs (no scheme) pass through — they're safe
  // (same-origin). Anything with a scheme must be in the app-level allow-list.
  const scheme = extractScheme(stripped);
  if (scheme !== null && !ALLOWED_SCHEMES.has(scheme)) return false;

  return ctx.defaultValidate(url) && !DANGEROUS_SCHEME_REGEX.test(stripped);
}
