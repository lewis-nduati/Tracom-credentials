/**
 * MarkdownPaste Tiptap Extension
 *
 * Intercepts paste events, detects when the clipboard's `text/plain` payload
 * is markdown, and inserts it as structured Tiptap content via the existing
 * `markdownToTipTap()` converter.
 *
 * Why this exists:
 *
 * `tiptap-markdown` ships a paste hook via its `transformPastedText` option,
 * but that hook is wired to ProseMirror's `clipboardTextParser` prop, which
 * only fires when the clipboard contains `text/plain` and nothing else.
 * Every major source (VS Code, Obsidian, Notion, Slack, GitHub, Google Docs,
 * most web pages) writes `text/html` alongside `text/plain`, so ProseMirror
 * takes the HTML branch and the markdown transform is silently bypassed.
 *
 * This extension fixes that by hooking `handlePaste` — which runs on every
 * paste, regardless of mime type. It applies a heuristic (`detectMarkdown`)
 * to decide whether a given payload should be routed through our markdown
 * converter, and otherwise falls through to the default HTML paste pipeline.
 *
 * Design constraints:
 *
 * 1. File / image paste is owned by the `ImageUpload` extension. We bail
 *    whenever `clipboardData.files` is non-empty so `ImageUpload` gets the
 *    event. `MarkdownPaste` is registered *after* `ImageUpload` in
 *    `SharedExtensionKit` as a belt-and-suspenders measure.
 * 2. Paste inside a `codeBlock` node must stay verbatim. Markdown syntax
 *    inside a code fence is source, not structure. We short-circuit before
 *    detection runs.
 * 3. Converter errors never eat the paste. If `markdownToTipTap()` throws,
 *    we log and return `false`, letting the default pipeline run.
 *
 * @see src/components/editor/extensions/ImageUpload/ImageUpload.ts (pattern)
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Fragment, Slice } from "@tiptap/pm/model";
import { createDebugLogger } from "~/lib/debug-logger";
import { markdownToTipTap } from "~/lib/markdown-to-tiptap";
import { detectMarkdown } from "./detect-markdown";

const logger = createDebugLogger({ namespace: "MarkdownPaste" });

/** Options for the MarkdownPaste extension (none for v1). */
export type MarkdownPasteOptions = Record<string, never>;

/**
 * Node type names that should receive verbatim paste (no markdown
 * conversion). Currently just code blocks — inline code is a mark on a
 * text node, not a container, so it doesn't apply here.
 */
const VERBATIM_PARENT_TYPES = new Set(["codeBlock"]);

export const MarkdownPaste = Extension.create<MarkdownPasteOptions>({
  name: "markdownPaste",

  addOptions() {
    return {};
  },

  addProseMirrorPlugins() {
    // Capture the editor instance for use inside the Plugin closure — `this`
    // inside `handlePaste` refers to the Plugin, not the extension.
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey("markdownPaste"),
        props: {
          /**
           * Handle paste events.
           *
           * Return `true` to claim the event (stops the default pipeline).
           * Return `false` to let the next plugin or the default pipeline run.
           */
          handlePaste(_view, event) {
            try {
              const clipboardData = event.clipboardData;
              if (!clipboardData) {
                return false;
              }

              // 1. File / image paste → let ImageUpload handle it.
              if (clipboardData.files && clipboardData.files.length > 0) {
                return false;
              }

              // 2. Inside a code block → verbatim paste, no conversion.
              const parentType = editor.state.selection.$from.parent.type.name;
              if (VERBATIM_PARENT_TYPES.has(parentType)) {
                return false;
              }

              // 3. Read clipboard payloads.
              const plain = clipboardData.getData("text/plain");
              if (!plain) {
                return false;
              }

              // 4. Skip mega-pastes.
              if (plain.length > 50_000) {
                return false;
              }

              const html = clipboardData.getData("text/html");
              const hasHtml = html.length > 0;

              // 5. Detect markdown.
              if (!detectMarkdown(plain, hasHtml)) {
                return false;
              }

              // 6. Convert and insert.
              const doc = markdownToTipTap(plain);
              const blocks = doc.content ?? [];
              if (blocks.length === 0) {
                return false;
              }

              if (editor.isDestroyed) {
                return false;
              }

              // Insert via ProseMirror transaction directly — bypasses
              // tiptap-markdown's insertContentAt override which can
              // interfere with JSONContent insertion.
              const { schema } = editor.state;
              const nodes = blocks.map((block) =>
                schema.nodeFromJSON(block),
              );
              const fragment = Fragment.from(nodes);
              const { tr } = editor.state;
              tr.replaceSelection(new Slice(fragment, 0, 0));
              editor.view.dispatch(tr);
              event.preventDefault();
              return true;
            } catch (err) {
              logger.error("paste conversion failed, falling back to default", err);
              return false;
            }
          },
        },
      }),
    ];
  },
});
