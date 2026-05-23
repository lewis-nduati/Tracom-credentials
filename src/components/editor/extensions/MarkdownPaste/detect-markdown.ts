/**
 * Markdown detection heuristic for clipboard text.
 *
 * Used by the MarkdownPaste extension to decide whether a pasted text/plain
 * payload should be routed through our markdown-to-tiptap converter or left
 * for the default (HTML / plain text) paste pipeline.
 *
 * Design notes:
 *
 * - Strong signals each individually return true when `hasHtml` is true. They
 *   are unambiguous markdown constructs that are vanishingly unlikely to
 *   appear coincidentally in prose copied from a web page.
 * - Weak signals each contribute one "point"; strict mode needs at least two
 *   on distinct lines to trigger.
 * - When `hasHtml` is false, we're in permissive mode — any signal wins. The
 *   rationale is that the default paste pipeline without HTML can't do
 *   better than flat plain text anyway, so we lose nothing by being
 *   aggressive, and we subsume tiptap-markdown's `transformPastedText`
 *   behavior for terminal / raw-file pastes.
 * - "Distinct lines" is counted by iterating the text's lines once and
 *   marking each line with the signal(s) it matches. A single line with
 *   three bold spans only contributes one weak signal.
 */

/**
 * Minimum length below which we don't even try to detect markdown. Shorter
 * pastes are almost always a word or a phrase where conversion would be
 * surprising (e.g., pasting `# tag` as a hashtag into a paragraph).
 */
const MIN_LENGTH = 4;

// =============================================================================
// Strong signals — any single match triggers detection in strict mode.
// =============================================================================

/** ATX heading: `#`, `##`, … `######` followed by a space and non-space. */
const RE_ATX_HEADING = /^#{1,6}[ \t]+\S/;

/** Fenced code block: line starts with ``` or ~~~ (optionally followed by a language tag). */
const RE_FENCED_CODE = /^(?:```|~~~)/;

/** Blockquote: line starts with `> ` followed by content. */
const RE_BLOCKQUOTE = /^>[ \t]+\S/;

/** Task list item: `- [ ]`, `- [x]`, `* [X]`, etc. */
const RE_TASK_LIST = /^[ \t]*[-*+][ \t]+\[[ xX]\][ \t]/;

/** Reference-style link definition: `[label]: https://...` */
const RE_REF_LINK_DEF = /^\[[^\]]+\]:[ \t]+\S/;

/** GFM table separator row: `| --- | :---: |` (with optional leading/trailing `|`). */
const RE_TABLE_SEPARATOR = /^\|?[ \t]*:?-{2,}:?[ \t]*(?:\|[ \t]*:?-{2,}:?[ \t]*)+\|?[ \t]*$/;

/** GFM table data row: starts with `|` and contains at least one more `|`. */
const RE_TABLE_ROW = /^\|.*\|/;

// =============================================================================
// Weak signals — need 2+ on distinct lines in strict mode.
// =============================================================================

/** Bullet list marker: `-`, `*`, or `+` followed by space and content. */
const RE_BULLET_LIST = /^[ \t]*[-*+][ \t]+\S/;

/** Ordered list marker: `1.`, `23.`, etc. followed by space and content. */
const RE_ORDERED_LIST = /^[ \t]*\d+\.[ \t]+\S/;

/** Inline link: `[text](url)` where url has no whitespace. */
const RE_INLINE_LINK = /\[[^\]\n]+\]\([^)\s]+\)/;

/** Bold: `**text**` or `__text__` with non-whitespace content between. */
const RE_BOLD = /(\*\*|__)(?=\S)[^*_\n]*?(?<=\S)\1/;

/**
 * Italic: single `*word*` or `_word_` surrounded by non-word boundaries.
 * We require a word-boundary on each side to avoid matching the inside of
 * bold (`**word**` contains `*word*`) and to avoid matching mid-word
 * asterisks that programmers sometimes write.
 */
const RE_ITALIC = /(?:^|[^\w*_])([*_])(?=\S)[^*_\n]+?(?<=\S)\1(?:$|[^\w*_])/;

/** Inline code: `` `code` `` with at least one char between backticks. */
const RE_INLINE_CODE = /`[^`\n]+`/;

// =============================================================================
// Detection
// =============================================================================

/**
 * Determine whether a pasted text payload should be interpreted as markdown.
 *
 * @param text - The clipboard's `text/plain` content.
 * @param hasHtml - Whether the clipboard also carries `text/html`. Controls
 *                  strict (true) vs permissive (false) matching behavior.
 * @returns true if the text should be converted via markdownToTiptap().
 */
export function detectMarkdown(text: string, hasHtml: boolean): boolean {
  if (!text || text.length < MIN_LENGTH) {
    return false;
  }

  const lines = text.split("\n");
  let strongSignals = 0;
  let weakLines = 0;

  // First pass: line-level signals. We walk line-by-line so "distinct lines"
  // is the natural unit, and we can look ahead for setext headings and table
  // separators which are 2-line patterns.
  for (let i = 0; i < lines.length; i++) {
    // Strip trailing \r so CRLF line endings from Windows clipboards don't
    // break anchored regexes (RE_TABLE_SEPARATOR's `$` anchor in particular).
    const line = (lines[i] ?? "").replace(/\r$/, "");
    const nextLine = (lines[i + 1] ?? "").replace(/\r$/, "");

    // --- Strong, single-line ---
    if (
      RE_ATX_HEADING.test(line) ||
      RE_FENCED_CODE.test(line) ||
      RE_BLOCKQUOTE.test(line) ||
      RE_TASK_LIST.test(line) ||
      RE_REF_LINK_DEF.test(line)
    ) {
      strongSignals++;
      continue;
    }

    // --- Strong, two-line: setext heading (h1 only) ---
    // A non-empty line followed by a line of only `=` (len >= 2) is a
    // setext h1. Only `===` underlines are strong signals — `---` is
    // genuinely ambiguous with thematic breaks (CommonMark treats
    // `paragraph\n---` as a setext h2, but most copy sources use `---`
    // as a visual divider). Counting `---` here would false-positive on
    // pastes from Notion, GitHub, and email clients that use `---` as
    // section separators.
    if (line.trim().length > 0 && /^=+\s*$/.test(nextLine) && nextLine.trim().length >= 2) {
      strongSignals++;
      continue;
    }

    // --- Strong, two-line: GFM table ---
    // A header row followed by a separator row. We only count this once per
    // table to avoid double-counting rows.
    if (RE_TABLE_ROW.test(line) && RE_TABLE_SEPARATOR.test(nextLine)) {
      strongSignals++;
      continue;
    }

    // --- Weak, single-line ---
    // A line can contribute at most one weak signal, even if multiple weak
    // patterns match. That's the "distinct lines" rule.
    if (
      RE_BULLET_LIST.test(line) ||
      RE_ORDERED_LIST.test(line) ||
      RE_INLINE_LINK.test(line) ||
      RE_BOLD.test(line) ||
      RE_ITALIC.test(line) ||
      RE_INLINE_CODE.test(line)
    ) {
      weakLines++;
    }
  }

  // Permissive mode: any signal wins. We can't do worse than the default
  // plain-text paste pipeline.
  if (!hasHtml) {
    return strongSignals > 0 || weakLines > 0;
  }

  // Strict mode: require a strong signal or at least two distinct weak lines.
  return strongSignals > 0 || weakLines >= 2;
}
