"use client";

import { useState } from "react";
import { type NodeViewProps, NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { useCopyFeedback } from "~/hooks/ui/use-success-notification";
import { CopyIcon, CompletedIcon } from "~/components/icons";
import { cn } from "~/lib/utils";
import { EDITOR_STYLES } from "../../../extension-kits/shared";

/**
 * CodeBlockView - Renders code blocks with a copy button and optional language label
 *
 * Features:
 * - Copy button appears on hover (top-right corner)
 * - Shows detected language from syntax highlighting
 * - Works in both editor and viewer modes
 */
export function CodeBlockView({ node }: NodeViewProps) {
  const [showControls, setShowControls] = useState(false);
  const { isCopied, copy } = useCopyFeedback();

  // Get language from node attributes (set by CodeBlockLowlight)
  const language = node.attrs.language as string | null;

  const handleCopy = async () => {
    // Get the text content from the node
    const code = node.textContent;
    await copy(code);
  };

  return (
    <NodeViewWrapper>
      <div
        className="relative"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <pre className={cn(EDITOR_STYLES.codeBlock, "relative")}>
          {/* Copy button and language label - show on hover */}
          {showControls && (
            <div
              className="absolute top-2 right-2 flex items-center gap-2"
              contentEditable={false}
            >
              {/* Language label */}
              {language && (
                <span className="text-xs text-muted-foreground/70 font-sans select-none">
                  {language}
                </span>
              )}
              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  "bg-background/80 backdrop-blur-sm border border-border/50",
                  "hover:bg-background hover:border-border",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                )}
                aria-label="Copy code"
              >
                {isCopied ? (
                  <CompletedIcon className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <CopyIcon className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          )}
          {/* Code content - NodeViewContent renders the actual code */}
          <code>
            <NodeViewContent />
          </code>
        </pre>
      </div>
    </NodeViewWrapper>
  );
}

export default CodeBlockView;
