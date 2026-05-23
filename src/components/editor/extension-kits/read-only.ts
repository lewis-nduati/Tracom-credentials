import Link from "@tiptap/extension-link";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { TextAlign } from "@tiptap/extension-text-align";
import { Markdown } from "tiptap-markdown";
import { ImageBlock } from "../extensions/ImageBlock";

/**
 * Read-Only Extension Kit
 * For displaying content without editing
 * Includes all formatting and media display capabilities
 */
export function ReadOnlyExtensionKit(): Extensions {
  const lowlight = createLowlight(common);

  return [
    StarterKit.configure({
      // Disable extensions we'll configure separately
      bulletList: false,
      orderedList: false,
      listItem: false,
      codeBlock: false,
      link: false, // Disable default link to use custom configuration
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Markdown.configure({
      html: true,
      transformPastedText: true,
      transformCopiedText: true,
    }),
    Underline,
    TextStyle,
    Color.configure({
      types: ["textStyle"],
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
    }),
    Link.configure({
      openOnClick: true, // Allow clicking links in read-only mode
      HTMLAttributes: {
        class: "text-primary underline underline-offset-4 cursor-pointer",
        target: "_blank",
        rel: "noopener noreferrer",
      },
    }),
    BulletList.configure({
      HTMLAttributes: {
        class: "list-disc list-outside ml-6 space-y-2",
      },
    }),
    OrderedList.configure({
      HTMLAttributes: {
        class: "list-decimal list-outside ml-6 space-y-2",
      },
    }),
    ListItem.configure({
      HTMLAttributes: {
        class: "leading-relaxed",
      },
    }),
    ImageBlock,
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class:
          "bg-muted text-muted-foreground rounded-lg p-4 font-mono text-sm overflow-x-auto",
      },
    }),
  ];
}
