import Link from "@tiptap/extension-link";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import type { Extensions } from "@tiptap/core";
import { BaseExtensionKit } from "./base";

/**
 * Basic Editor Kit
 * For text editing without images or advanced features
 * Suitable for simple content editing
 */
export function BasicEditorKit(): Extensions {
  return [
    ...BaseExtensionKit(),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: {
        class: "text-primary underline underline-offset-4 cursor-pointer",
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
  ];
}
