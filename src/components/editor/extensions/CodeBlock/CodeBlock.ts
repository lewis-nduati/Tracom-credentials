import { ReactNodeViewRenderer } from "@tiptap/react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { CodeBlockView } from "./components/CodeBlockView";

/**
 * CodeBlock - Extended CodeBlockLowlight with copy button overlay
 *
 * Extends the default code block with:
 * - Copy-to-clipboard button on hover
 * - Language label display
 * - Syntax highlighting via lowlight
 */
export const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});

export default CodeBlock;
