import { useEditor, type UseEditorOptions } from "@tiptap/react";
import { FullEditorKit } from "../extension-kits";

/**
 * Custom hook to create an Andamio editor instance
 * Wrapper around Tiptap's useEditor with sensible defaults
 */
export function useAndamioEditor(options: Partial<UseEditorOptions> = {}) {
  const editor = useEditor({
    extensions: FullEditorKit(),
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none",
      },
    },
    immediatelyRender: false,
    ...options,
  });

  return editor;
}
