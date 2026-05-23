/**
 * Shared Extension Configuration
 *
 * This file provides a single source of truth for Tiptap extension configuration.
 * Both ContentEditor and ContentViewer use these configurations to ensure
 * consistent rendering of content across editing and viewing modes.
 */

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { TextAlign } from "@tiptap/extension-text-align";
import { Markdown } from "tiptap-markdown";
import Link from "@tiptap/extension-link";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { CodeBlock } from "../extensions/CodeBlock";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { common, createLowlight } from "lowlight";
import type { Extensions } from "@tiptap/core";
import { ImageBlock } from "../extensions/ImageBlock";
import { ImageUpload, type ImageUploadOptions } from "../extensions/ImageUpload";
import { MarkdownPaste } from "../extensions/MarkdownPaste";
import { isAllowedLinkUri } from "./link-safety";

/**
 * Extension configuration options
 */
export interface ExtensionConfig {
  /**
   * Whether the editor is in read-only/view mode
   * Affects link behavior (clickable vs editable)
   */
  readonly?: boolean;

  /**
   * Image upload configuration
   * When provided, enables paste and drag-drop image upload
   */
  imageUpload?: {
    /** Callback to upload a file and return its public URL */
    onUpload: (file: File) => Promise<string>;
    /** Called when upload starts */
    onUploadStart?: () => void;
    /** Called when upload ends */
    onUploadEnd?: () => void;
    /** Called when upload fails */
    onUploadError?: (error: Error) => void;
  };
}

/**
 * CSS classes for consistent styling across editor and viewer
 * Uses semantic colors from globals.css for full dark/light mode support
 */
export const EDITOR_STYLES = {
  // Links - primary color with underline offset for readability
  link: "text-primary underline underline-offset-4 cursor-pointer hover:text-primary/80 transition-colors",

  // Lists - proper indentation and spacing
  bulletList: "list-disc list-outside ml-6 space-y-1.5 marker:text-muted-foreground",
  orderedList: "list-decimal list-outside ml-6 space-y-1.5 marker:text-muted-foreground",
  listItem: "leading-relaxed pl-1",

  // Code blocks - distinct background with syntax highlighting support
  // Use bg-muted (not bg-muted/70) for sufficient contrast in both normal and fullscreen modes
  codeBlock:
    "bg-muted text-foreground rounded-lg p-4 font-mono text-sm overflow-x-auto not-prose border border-border/50 shadow-sm",

  // Images - rounded with subtle shadow
  image: "rounded-lg max-w-full h-auto shadow-md",

  // Table styles - visible borders, proper spacing, professional look
  table: "border-collapse w-full my-6 text-sm border border-border rounded-lg overflow-hidden shadow-sm",
  tableRow: "border-b border-border last:border-b-0 even:bg-muted/30",
  tableCell: "border border-border/50 px-4 py-3 min-w-[120px] align-top text-left",
  tableHeader:
    "border border-border/50 px-4 py-3 min-w-[120px] align-middle bg-muted/70 font-semibold text-left text-foreground",

  // Headings - distinct sizing hierarchy (applied via prose classes, here for reference)
  heading1: "text-3xl font-bold tracking-tight mt-8 mb-4 text-foreground",
  heading2: "text-2xl font-semibold tracking-tight mt-8 mb-3 text-foreground",
  heading3: "text-xl font-semibold tracking-tight mt-6 mb-2 text-foreground",
  heading4: "text-lg font-medium mt-6 mb-2 text-foreground",
  heading5: "text-base font-medium mt-4 mb-2 text-foreground/90",
  heading6: "text-sm font-medium uppercase tracking-wide mt-4 mb-2 text-muted-foreground",

  // Blockquote - left border accent with subtle background
  blockquote: "border-l-4 border-primary/50 bg-muted/30 pl-4 py-2 pr-4 my-6 italic text-muted-foreground",

  // Horizontal rule - subtle divider
  horizontalRule: "border-t-2 border-border my-8",
} as const;

/**
 * Create a lowlight instance for code syntax highlighting
 */
function createLowlightInstance() {
  return createLowlight(common);
}

/**
 * Creates the shared extension kit used by both ContentEditor and ContentViewer
 *
 * This ensures content created in the editor renders identically in the viewer.
 *
 * @param config - Configuration options
 * @returns Array of Tiptap extensions
 */
export function SharedExtensionKit(config: ExtensionConfig = {}): Extensions {
  const { readonly = false, imageUpload } = config;
  const lowlight = createLowlightInstance();

  return [
    // Core extensions from StarterKit
    StarterKit.configure({
      // Disable extensions we configure separately
      bulletList: false,
      orderedList: false,
      listItem: false,
      codeBlock: false,
      link: false,
      underline: false,
      // Configure heading to support levels 1-6
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),

    // Markdown support for copy (markdown → clipboard on copy).
    //
    // `transformPastedText` is intentionally disabled: its hook only fires
    // when the clipboard has no `text/html`, which excludes every major
    // source (VS Code, Obsidian, Notion, Slack, GitHub, Google Docs). The
    // `MarkdownPaste` extension below replaces it with a `handlePaste`
    // implementation that runs regardless of mime type.
    //
    // `transformCopiedText` stays on so users copying *out* of the editor
    // still land markdown on their clipboard.
    Markdown.configure({
      html: true,
      transformPastedText: false,
      transformCopiedText: true,
    }),

    // Text formatting
    Underline,
    TextStyle,
    Color.configure({
      types: ["textStyle"],
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
    }),

    // Links - behavior differs between edit and view modes.
    // `isAllowedUri` is the defense — it enforces an explicit app-level scheme
    // allow-list (see `isAllowedLinkUri` in ./link-safety). The `protocols`
    // option is NOT a restriction; Tiptap's internal isAllowedUri treats it as
    // ADDITIVE to a hardcoded 10-scheme default. We pass our narrow list here
    // only so linkifyjs's autolink detection matches what `isAllowedUri` will
    // accept at render time — keeps UI autolink behavior consistent with the
    // security allow-list. See #508.
    Link.configure({
      openOnClick: readonly,
      autolink: true,
      defaultProtocol: "https",
      protocols: ["http", "https", "mailto"],
      isAllowedUri: isAllowedLinkUri,
      HTMLAttributes: {
        class: EDITOR_STYLES.link,
        ...(readonly && {
          target: "_blank",
          rel: "noopener noreferrer",
        }),
      },
    }),

    // Lists
    BulletList.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.bulletList,
      },
    }),
    OrderedList.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.orderedList,
      },
    }),
    ListItem.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.listItem,
      },
    }),

    // Images - using ImageBlock for block-level images with alignment
    ImageBlock.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.image,
      },
    }),

    // Code blocks with syntax highlighting and copy button
    CodeBlock.configure({
      lowlight,
    }),

    // Tables - conservative config (no resizing to avoid known bugs)
    Table.configure({
      resizable: false, // Disabled due to known Tiptap bugs
      HTMLAttributes: {
        class: EDITOR_STYLES.table,
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.tableRow,
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.tableCell,
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.tableHeader,
      },
    }),

    // Image upload - only included when configured (editing mode with auth)
    ...(imageUpload
      ? [
          ImageUpload.configure({
            onUpload: imageUpload.onUpload,
            onUploadStart: imageUpload.onUploadStart,
            onUploadEnd: imageUpload.onUploadEnd,
            onUploadError: imageUpload.onUploadError,
          }),
        ]
      : []),

    // Markdown auto-detect on paste - editing mode only. Placed *after*
    // ImageUpload so ImageUpload's `handlePaste` gets first priority on
    // file / image clipboards; MarkdownPaste only runs when the clipboard
    // is text-shaped. See `extensions/MarkdownPaste/MarkdownPaste.ts`.
    ...(!readonly ? [MarkdownPaste] : []),
  ];
}

/**
 * Editor-specific extension kit
 * Extends SharedExtensionKit with editing-focused configurations
 */
export function EditorExtensionKit(): Extensions {
  return SharedExtensionKit({ readonly: false });
}

/**
 * Viewer-specific extension kit
 * Extends SharedExtensionKit with viewing-focused configurations
 */
export function ViewerExtensionKit(): Extensions {
  return SharedExtensionKit({ readonly: true });
}
