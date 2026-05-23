/**
 * Markdown to TipTap JSONContent Converter
 *
 * Converts markdown strings to TipTap's JSONContent format using
 * the unified/remark ecosystem for parsing.
 *
 * Supported markdown features:
 * - Headings (h1-h6)
 * - Paragraphs
 * - Bold, italic, strikethrough
 * - Links
 * - Inline code and code blocks
 * - Bullet and numbered lists
 * - Blockquotes
 * - Images (by URL, with optional URL substitution for uploaded files)
 * - Tables (via remark-gfm, converted to Tiptap table nodes)
 *
 * Unsupported features (silently converted to paragraphs or stripped):
 * - Footnotes
 * - LaTeX math
 * - HTML tags
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import type { JSONContent } from "@tiptap/core";
import type { Root, Content, PhrasingContent, Table, TableRow, TableCell } from "mdast";

// =============================================================================
// Types
// =============================================================================

/** TipTap text mark */
interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

/** TipTap text node with optional marks */
interface TipTapText {
  type: "text";
  text: string;
  marks?: TipTapMark[];
}

/** TipTap inline content (text or hard break) */
type TipTapInline = TipTapText | { type: "hardBreak" };

// =============================================================================
// Remark Parser
// =============================================================================

/**
 * Parse markdown string to mdast (Markdown Abstract Syntax Tree)
 * Uses remark-gfm for GitHub-flavored markdown support (tables, strikethrough, etc.)
 * Uses remark-frontmatter to recognize (and skip) YAML frontmatter blocks
 * that would otherwise be mis-parsed as setext headings.
 */
function parseMarkdown(markdown: string): Root {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter);
  return processor.parse(markdown);
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Resolve an image URL, substituting local paths with uploaded URLs if available
 */
function resolveImageUrl(
  src: string,
  imageUrlMap?: Map<string, string>
): string {
  if (!imageUrlMap) return src;

  // Try exact match first
  const exactMatch = imageUrlMap.get(src);
  if (exactMatch) return exactMatch;

  // Try matching by filename (handles path variations like "./assets/" vs "assets/")
  const normalizedSrc = src.replace(/^\.\//, ""); // Remove leading ./
  const normalizedMatch = imageUrlMap.get(normalizedSrc);
  if (normalizedMatch) return normalizedMatch;

  // Try matching by filename only
  const filename = src.split("/").pop();
  if (filename) {
    for (const [path, uploadedUrl] of imageUrlMap) {
      if (path.endsWith(filename)) {
        return uploadedUrl;
      }
    }
  }

  return src;
}

/**
 * Transform phrasing content (inline elements) to TipTap inline nodes
 */
function transformPhrasingContent(
  nodes: PhrasingContent[],
  marks: TipTapMark[] = []
): TipTapInline[] {
  const result: TipTapInline[] = [];

  for (const node of nodes) {
    switch (node.type) {
      case "text": {
        if (node.value) {
          const textNode: TipTapText = {
            type: "text",
            text: node.value,
          };
          if (marks.length > 0) {
            textNode.marks = [...marks];
          }
          result.push(textNode);
        }
        break;
      }

      case "strong": {
        // Bold text
        const children = transformPhrasingContent(node.children, [
          ...marks,
          { type: "bold" },
        ]);
        result.push(...children);
        break;
      }

      case "emphasis": {
        // Italic text
        const children = transformPhrasingContent(node.children, [
          ...marks,
          { type: "italic" },
        ]);
        result.push(...children);
        break;
      }

      case "delete": {
        // Strikethrough text
        const children = transformPhrasingContent(node.children, [
          ...marks,
          { type: "strike" },
        ]);
        result.push(...children);
        break;
      }

      case "inlineCode": {
        // Inline code
        const textNode: TipTapText = {
          type: "text",
          text: node.value,
          marks: [...marks, { type: "code" }],
        };
        result.push(textNode);
        break;
      }

      case "link": {
        // Link - add link mark to children
        const linkMark: TipTapMark = {
          type: "link",
          attrs: {
            href: node.url,
            target: "_blank",
            rel: "noopener noreferrer nofollow",
            class: null,
          },
        };
        const children = transformPhrasingContent(node.children, [
          ...marks,
          linkMark,
        ]);
        result.push(...children);
        break;
      }

      case "image": {
        // Images are block-level in TipTap, handle them specially
        // For inline context, we'll create a text placeholder
        // The actual image handling is done at block level
        const altText = node.alt ?? "image";
        const textNode: TipTapText = {
          type: "text",
          text: `[${altText}]`,
        };
        if (marks.length > 0) {
          textNode.marks = [...marks];
        }
        result.push(textNode);
        break;
      }

      case "break": {
        // Hard line break
        result.push({ type: "hardBreak" });
        break;
      }

      default: {
        // For unknown inline types, try to extract text
        const unknownNode = node as { value?: string; children?: PhrasingContent[] };
        if (unknownNode.value) {
          const textNode: TipTapText = {
            type: "text",
            text: unknownNode.value,
          };
          if (marks.length > 0) {
            textNode.marks = [...marks];
          }
          result.push(textNode);
        } else if (unknownNode.children) {
          const children = transformPhrasingContent(unknownNode.children, marks);
          result.push(...children);
        }
      }
    }
  }

  return result;
}

/**
 * Transform block content nodes to TipTap block nodes
 *
 * @param nodes - mdast content nodes to transform
 * @param imageUrlMap - Optional map of local paths to uploaded URLs
 */
function transformContent(
  nodes: Content[],
  imageUrlMap?: Map<string, string>
): JSONContent[] {
  const result: JSONContent[] = [];

  for (const node of nodes) {
    switch (node.type) {
      case "heading": {
        const level = Math.min(Math.max(node.depth, 1), 6);
        const content = transformPhrasingContent(node.children);
        result.push({
          type: "heading",
          attrs: { level },
          content: content.length > 0 ? content : undefined,
        });
        break;
      }

      case "paragraph": {
        // Check if this paragraph contains only an image
        if (
          node.children.length === 1 &&
          node.children[0]?.type === "image"
        ) {
          const imageNode = node.children[0];
          const resolvedSrc = resolveImageUrl(imageNode.url, imageUrlMap);
          result.push({
            type: "imageBlock",
            attrs: {
              src: resolvedSrc,
              alt: imageNode.alt ?? "",
              title: imageNode.title ?? null,
              width: "600", // Default to medium
              align: "center",
            },
          });
        } else {
          const content = transformPhrasingContent(node.children);
          result.push({
            type: "paragraph",
            content: content.length > 0 ? content : undefined,
          });
        }
        break;
      }

      case "blockquote": {
        const content = transformContent(node.children, imageUrlMap);
        result.push({
          type: "blockquote",
          content: content.length > 0 ? content : undefined,
        });
        break;
      }

      case "code": {
        // Code block with optional language
        result.push({
          type: "codeBlock",
          attrs: {
            language: node.lang ?? null,
          },
          content: [
            {
              type: "text",
              text: node.value,
            },
          ],
        });
        break;
      }

      case "list": {
        const listType = node.ordered ? "orderedList" : "bulletList";
        const items: JSONContent[] = [];

        for (const item of node.children) {
          if (item.type === "listItem") {
            const itemContent = transformContent(item.children, imageUrlMap);
            items.push({
              type: "listItem",
              content: itemContent,
            });
          }
        }

        result.push({
          type: listType,
          content: items.length > 0 ? items : undefined,
        });
        break;
      }

      case "thematicBreak": {
        // Horizontal rule
        result.push({
          type: "horizontalRule",
        });
        break;
      }

      case "image": {
        // Standalone image (not in paragraph)
        const resolvedSrc = resolveImageUrl(node.url, imageUrlMap);
        result.push({
          type: "imageBlock",
          attrs: {
            src: resolvedSrc,
            alt: node.alt ?? "",
            title: node.title ?? null,
            width: "600", // Default to medium
            align: "center",
          },
        });
        break;
      }

      case "html": {
        // HTML blocks are stripped - convert to paragraph if it has text content
        const textContent = node.value.replace(/<[^>]*>/g, "").trim();
        if (textContent) {
          result.push({
            type: "paragraph",
            content: [{ type: "text", text: textContent }],
          });
        }
        break;
      }

      case "table": {
        // Convert GFM table to Tiptap table
        const tableNode = node;
        const tableRows: JSONContent[] = [];

        for (let rowIndex = 0; rowIndex < tableNode.children.length; rowIndex++) {
          const row = tableNode.children[rowIndex]!;
          if (row?.type !== "tableRow") continue;

          const cells: JSONContent[] = [];
          for (let cellIndex = 0; cellIndex < row.children.length; cellIndex++) {
            const cell = row.children[cellIndex]!;
            if (cell?.type !== "tableCell") continue;

            // First row cells are headers
            const cellType = rowIndex === 0 ? "tableHeader" : "tableCell";

            // Get alignment from table.align array
            const align = tableNode.align?.[cellIndex] ?? null;

            // Transform cell content (table cells contain phrasing content)
            const cellContent = transformPhrasingContent(cell.children);

            cells.push({
              type: cellType,
              attrs: align ? { textAlign: align } : undefined,
              content: [
                {
                  type: "paragraph",
                  content: cellContent.length > 0 ? cellContent : undefined,
                },
              ],
            });
          }

          tableRows.push({
            type: "tableRow",
            content: cells,
          });
        }

        result.push({
          type: "table",
          content: tableRows,
        });
        break;
      }

      case "yaml": {
        // Frontmatter blocks (recognized by remark-frontmatter) are metadata,
        // not document content — skip them entirely.
        break;
      }

      default: {
        // For unknown block types, try to handle gracefully
        const unknownNode = node as { children?: Content[]; value?: string };
        if (unknownNode.children) {
          const content = transformContent(unknownNode.children, imageUrlMap);
          result.push(...content);
        } else if (unknownNode.value) {
          result.push({
            type: "paragraph",
            content: [{ type: "text", text: unknownNode.value }],
          });
        }
      }
    }
  }

  return result;
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Convert markdown string to TipTap JSONContent
 *
 * @param markdown - The markdown string to convert
 * @param imageUrlMap - Optional map of local image paths to uploaded URLs
 * @returns TipTap JSONContent object ready for the editor
 *
 * @example
 * ```typescript
 * import { markdownToTipTap } from "~/lib/markdown-to-tiptap";
 *
 * const markdown = `
 * # Hello World
 *
 * This is **bold** and *italic* text.
 *
 * - Item 1
 * - Item 2
 * `;
 *
 * const json = markdownToTipTap(markdown);
 * // { type: "doc", content: [...] }
 *
 * // With image URL substitution:
 * const imageUrlMap = new Map([["assets/img.png", "https://storage.example.com/img.png"]]);
 * const jsonWithImages = markdownToTipTap(markdownWithImages, imageUrlMap);
 * ```
 */
export function markdownToTipTap(
  markdown: string,
  imageUrlMap?: Map<string, string>
): JSONContent {
  // Handle empty or whitespace-only input
  if (!markdown?.trim()) {
    return {
      type: "doc",
      content: [],
    };
  }

  // Parse markdown to AST
  const ast = parseMarkdown(markdown);

  // Transform AST to TipTap content
  const content = transformContent(ast.children, imageUrlMap);

  // Wrap in doc structure
  return {
    type: "doc",
    content,
  };
}

/**
 * Check if a markdown string would produce any content
 *
 * @param markdown - The markdown string to check
 * @returns true if the markdown contains actual content
 */
export function hasMarkdownContent(markdown: string): boolean {
  if (!markdown?.trim()) {
    return false;
  }

  const result = markdownToTipTap(markdown);
  return (result.content?.length ?? 0) > 0;
}
