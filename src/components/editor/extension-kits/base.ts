import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { TextAlign } from "@tiptap/extension-text-align";
import { Markdown } from "tiptap-markdown";
import type { Extensions } from "@tiptap/core";

/**
 * Base Extension Kit
 * Core extensions that every editor should have
 */
export function BaseExtensionKit(): Extensions {
  return [
    StarterKit.configure({
      // Disable bullet and ordered list from StarterKit
      // We'll use custom lists later
      bulletList: false,
      orderedList: false,
      listItem: false,
      // Configure heading to support levels 1-6
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      // Enable code blocks with lowlight support
      codeBlock: false, // We'll use custom CodeBlock extension
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
  ];
}
