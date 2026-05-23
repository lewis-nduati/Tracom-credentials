"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { CloseIcon, LessonIcon, LoadingIcon } from "~/components/icons";
import { cn } from "~/lib/utils";
import { SharedExtensionKit } from "../../extension-kits/shared";
import { EditorToolbar, type ToolbarConfig } from "./EditorToolbar";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useImageUpload } from "~/hooks/api/use-image-upload";
import { toast } from "sonner";

/**
 * ContentEditor Props
 *
 * A robust, extensible editor component for editing course content,
 * assignments, project tasks, and commitments.
 */
export interface ContentEditorProps {
  /**
   * Initial content to load into the editor.
   * Can be Tiptap JSONContent or HTML string.
   */
  content?: JSONContent | string | null;

  /**
   * Callback fired when content changes.
   * Use for autosave or dirty state tracking.
   */
  onContentChange?: (content: JSONContent) => void;

  /**
   * Callback fired on every update (including selection changes).
   * More frequent than onContentChange - use sparingly.
   */
  onUpdate?: (editor: Editor) => void;

  /**
   * Callback to get access to the editor instance.
   * Called after the editor is initialized.
   */
  onEditorReady?: (editor: Editor) => void;

  /**
   * Placeholder text when editor is empty.
   * @default "Start writing..."
   */
  placeholder?: string;

  /**
   * Whether to show the toolbar.
   * @default true
   */
  showToolbar?: boolean;

  /**
   * Toolbar configuration - which buttons to show.
   * @default "full"
   */
  toolbarConfig?: ToolbarConfig;

  /**
   * Whether to enable fullscreen mode toggle.
   * @default true
   */
  enableFullscreen?: boolean;

  /**
   * Whether to show word count in footer.
   * @default false
   */
  showWordCount?: boolean;

  /**
   * Whether to show character count in footer.
   * @default false
   */
  showCharacterCount?: boolean;

  /**
   * Minimum height of the editor content area.
   * @default "300px"
   */
  minHeight?: string;

  /**
   * Maximum height of the editor content area.
   * Set to enable scrolling for long content.
   */
  maxHeight?: string;

  /**
   * Additional CSS classes for the wrapper.
   */
  className?: string;

  /**
   * Additional content to render in the footer.
   * Useful for save buttons, status indicators, etc.
   */
  footer?: React.ReactNode;

  /**
   * Whether the editor is disabled/read-only.
   * For viewing content, use ContentViewer instead.
   * @default false
   */
  disabled?: boolean;

  /**
   * Autofocus the editor on mount.
   * @default false
   */
  autoFocus?: boolean;

  /**
   * Enable image upload via paste and drag-drop.
   * Requires user to be authenticated.
   * @default true
   */
  enableImageUpload?: boolean;
}

/**
 * ContentEditor - The primary editing component for Andamio content.
 *
 * Use this component for:
 * - Course content (Lessons, Assignments, Introductions)
 * - Project Task content
 * - Commitments and evidence entry
 *
 * Features:
 * - Rich text editing with full formatting support
 * - Markdown paste support
 * - Image blocks with alignment
 * - Code blocks with syntax highlighting
 * - Optional fullscreen mode
 * - Word/character count
 * - Configurable toolbar
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ContentEditor
 *   content={initialContent}
 *   onContentChange={(json) => setContent(json)}
 * />
 *
 * // With all options
 * <ContentEditor
 *   content={lesson.content_json}
 *   onContentChange={handleContentChange}
 *   showToolbar
 *   showWordCount
 *   enableFullscreen
 *   minHeight="500px"
 *   footer={<SaveButton />}
 * />
 * ```
 */
export function ContentEditor({
  content,
  onContentChange,
  onUpdate,
  onEditorReady,
  placeholder = "Start writing...",
  showToolbar = true,
  toolbarConfig = "full",
  enableFullscreen = true,
  showWordCount = false,
  showCharacterCount = false,
  minHeight = "300px",
  maxHeight,
  className,
  footer,
  disabled = false,
  autoFocus = false,
  enableImageUpload = true,
}: ContentEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Image upload integration
  const { isAuthenticated } = useAndamioAuth();
  const uploadMutation = useImageUpload();

  // Configure extensions with optional image upload
  const extensions = useMemo(() => {
    // Enable image upload if: feature enabled, user authenticated, and storage configured
    const shouldEnableUpload = enableImageUpload && isAuthenticated;

    return SharedExtensionKit({
      readonly: false,
      ...(shouldEnableUpload && {
        imageUpload: {
          onUpload: async (file: File) => {
            const result = await uploadMutation.mutateAsync(file);
            return result.url;
          },
          onUploadStart: () => setIsUploading(true),
          onUploadEnd: () => setIsUploading(false),
          onUploadError: (error: Error) => {
            toast.error(error.message);
            setIsUploading(false);
          },
        },
      }),
    });
  }, [enableImageUpload, isAuthenticated, uploadMutation]);

  // Initialize editor
  const editor = useEditor({
    extensions,
    content: content ?? undefined,
    editable: !disabled,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: cn(
          "andamio-editor-content",
          "prose prose-sm sm:prose-base max-w-none dark:prose-invert",
          "focus:outline-none",
          "min-h-full",

          // Headings - distinct size hierarchy with proper spacing
          "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
          "prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-8 first:prose-h1:mt-0",
          "prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/50",
          "prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-6",
          "prose-h4:text-lg prose-h4:font-medium prose-h4:mb-2 prose-h4:mt-6",
          "prose-h5:text-base prose-h5:font-medium prose-h5:mb-2 prose-h5:mt-4 prose-h5:text-foreground/90",
          "prose-h6:text-sm prose-h6:font-medium prose-h6:uppercase prose-h6:tracking-wide prose-h6:mb-2 prose-h6:mt-4 prose-h6:text-muted-foreground",

          // Paragraphs and text
          "prose-p:leading-relaxed prose-p:mb-4",
          "prose-strong:font-semibold prose-strong:text-foreground",
          "prose-em:italic",

          // Links
          "prose-a:text-primary prose-a:no-underline prose-a:font-medium hover:prose-a:underline prose-a:transition-colors",

          // Blockquotes - accent border with subtle background
          "prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:bg-muted/30",
          "prose-blockquote:py-2 prose-blockquote:pl-4 prose-blockquote:pr-4 prose-blockquote:my-6",
          "prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:not-italic",

          // Code - inline and blocks
          "prose-code:bg-muted/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono",
          "prose-code:font-normal prose-code:before:content-none prose-code:after:content-none",
          "prose-code:border prose-code:border-border/30",
          "prose-pre:bg-muted/70 prose-pre:border prose-pre:border-border/50 prose-pre:shadow-sm",

          // Images
          "prose-img:rounded-lg prose-img:shadow-md",

          // Lists - proper spacing
          "prose-ul:my-4 prose-ol:my-4",
          "prose-li:my-1 prose-li:leading-relaxed",

          // Tables - visible borders
          "prose-table:border prose-table:border-border prose-table:rounded-lg prose-table:overflow-hidden prose-table:shadow-sm",
          "prose-thead:bg-muted/70",
          "prose-th:border prose-th:border-border/50 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold",
          "prose-td:border prose-td:border-border/50 prose-td:px-4 prose-td:py-3",
          "prose-tr:border-b prose-tr:border-border/50",

          // Horizontal rule
          "prose-hr:border-border prose-hr:my-8",
        ),
        "data-placeholder": placeholder,
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor: updatedEditor }) => {
      // Update counts
      const text = updatedEditor.getText();
      setWordCount(text.split(/\s+/).filter((word) => word.length > 0).length);
      setCharacterCount(text.length);

      // Fire callbacks
      if (onContentChange) {
        onContentChange(updatedEditor.getJSON());
      }
      if (onUpdate) {
        onUpdate(updatedEditor);
      }
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  // Notify when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Update content when prop changes (external updates)
  useEffect(() => {
    if (editor && content !== undefined) {
      // Only update if content is different to avoid cursor jumping
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(content);
      if (currentContent !== newContent) {
        editor.commands.setContent(content ?? "");
      }
    }
  }, [editor, content]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitFullscreen();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isFullscreen, exitFullscreen]);

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // Loading skeleton with subtle animation
  if (!editor) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="h-11 bg-muted/50 rounded-lg animate-pulse" />
        <div className="rounded-sm border border-border bg-background p-6">
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-muted/50 rounded w-3/4" />
            <div className="h-4 bg-muted/50 rounded w-full" />
            <div className="h-4 bg-muted/50 rounded w-5/6" />
            <div className="h-4 bg-muted/50 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // Editor-specific styles — must render in BOTH normal and fullscreen modes.
  // Previously lived inside the normal mode branch, causing styles to unmount in fullscreen (#428).
  const editorStyles = (
    <style jsx global>{`
      .andamio-editor-content.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        color: hsl(var(--muted-foreground));
        opacity: 0.5;
        pointer-events: none;
        height: 0;
      }
      .andamio-editor-content p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        color: hsl(var(--muted-foreground));
        opacity: 0.5;
        pointer-events: none;
        height: 0;
      }
      /* Table styles for responsive scrolling */
      .andamio-editor-content .tableWrapper {
        overflow-x: auto;
        margin: 1rem 0;
      }
      .andamio-editor-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 0;
      }
      .andamio-editor-content th,
      .andamio-editor-content td {
        border: 1px solid hsl(var(--border));
        padding: 0.5rem;
        min-width: 100px;
        vertical-align: top;
        position: relative;
      }
      .andamio-editor-content th {
        background-color: hsl(var(--muted));
        font-weight: 600;
        text-align: left;
      }
      /* Selected cell highlight */
      .andamio-editor-content .selectedCell::after {
        content: "";
        position: absolute;
        inset: 0;
        background: hsl(var(--primary) / 0.1);
        pointer-events: none;
      }
      /* Column resize handle (disabled but styled for consistency) */
      .andamio-editor-content .column-resize-handle {
        position: absolute;
        right: -2px;
        top: 0;
        bottom: 0;
        width: 4px;
        background-color: hsl(var(--primary));
        cursor: col-resize;
      }
    `}</style>
  );

  // Fullscreen mode - immersive writing experience
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {editorStyles}
        {/* Fullscreen header - clean and minimal */}
        <div className="flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <LessonIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Focus Mode</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex-1">
              {showToolbar && (
                <EditorToolbar
                  editor={editor}
                  config={toolbarConfig}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={enableFullscreen ? toggleFullscreen : undefined}
                />
              )}
            </div>
          </div>
          <AndamioButton
            variant="ghost"
            size="sm"
            onClick={exitFullscreen}
            aria-label="Exit full screen (Esc)"
            className="text-muted-foreground hover:text-foreground"
          >
            <CloseIcon className="h-4 w-4 mr-2" />
            Exit
            <kbd className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">Esc</kbd>
          </AndamioButton>
        </div>

        {/* Fullscreen content - centered and spacious */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-12">
            <EditorContent
              editor={editor}
              className={cn(
                "min-h-[calc(100vh-14rem)]",
                "focus-within:outline-none",
              )}
            />
          </div>
        </div>

        {/* Fullscreen footer - subtle stats */}
        {(showWordCount || showCharacterCount || footer) && (
          <div className="border-t border-border/50 bg-background/95 backdrop-blur-sm px-6 py-3">
            <div className="mx-auto max-w-3xl flex items-center justify-between">
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                {showWordCount && (
                  <span className="tabular-nums">{wordCount.toLocaleString()} words</span>
                )}
                {showCharacterCount && (
                  <span className="tabular-nums">{characterCount.toLocaleString()} characters</span>
                )}
              </div>
              {footer && <div>{footer}</div>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normal mode - polished and professional
  return (
    <div className={cn("space-y-3 w-full min-w-0 overflow-hidden", className)}>
      {/* Toolbar - refined styling, contained within parent */}
      {showToolbar && (
        <div className="w-full overflow-hidden">
          <EditorToolbar
            editor={editor}
            config={toolbarConfig}
            isFullscreen={isFullscreen}
            onToggleFullscreen={enableFullscreen ? toggleFullscreen : undefined}
          />
        </div>
      )}

      {/* Editor content - elegant container */}
      <div
        className={cn(
          "relative rounded-sm border bg-background transition-all duration-200",
          isFocused
            ? "border-primary/50 ring-4 ring-primary/10 shadow-sm"
            : "border-border hover:border-border/80",
          disabled && "opacity-50 cursor-not-allowed bg-muted/20",
        )}
      >
        <EditorContent
          editor={editor}
          className="px-5 py-4"
          style={{
            minHeight,
            maxHeight,
            overflowY: maxHeight ? "auto" : undefined,
          }}
        />

        {/* Image upload loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-sm z-10">
            <div className="flex items-center gap-2 text-muted-foreground bg-background/90 px-4 py-2 rounded-lg shadow-lg border border-border">
              <LoadingIcon className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Uploading image...</span>
            </div>
          </div>
        )}

        {editorStyles}
      </div>

      {/* Footer - clean stats display */}
      {(showWordCount || showCharacterCount || footer) && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {showWordCount && (
              <span className="tabular-nums">{wordCount.toLocaleString()} words</span>
            )}
            {showCharacterCount && (
              <span className="tabular-nums">{characterCount.toLocaleString()} characters</span>
            )}
          </div>
          {footer && <div>{footer}</div>}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to use ContentEditor with external state management
 *
 * Use this when you need more control over the editor instance,
 * such as programmatic content manipulation or custom toolbar actions.
 *
 * @example
 * ```tsx
 * const { editor, getContent, setContent, isEmpty } = useContentEditor({
 *   content: initialContent,
 *   onContentChange: handleChange,
 * });
 *
 * // Programmatic access
 * const handleSave = () => {
 *   const content = getContent();
 *   saveToServer(content);
 * };
 * ```
 */
export function useContentEditor(
  options: Pick<ContentEditorProps, "content" | "onContentChange" | "onUpdate" | "disabled"> = {},
) {
  const { content, onContentChange, onUpdate, disabled = false } = options;
  const extensions = useMemo(() => SharedExtensionKit({ readonly: false }), []);

  const editor = useEditor({
    extensions,
    content: content ?? undefined,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: cn(
          "andamio-editor-content",
          "prose prose-sm sm:prose-base max-w-none",
          "focus:outline-none",
          "prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-p:leading-relaxed",
          "prose-a:text-primary",
        ),
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor: updatedEditor }) => {
      if (onContentChange) {
        onContentChange(updatedEditor.getJSON());
      }
      if (onUpdate) {
        onUpdate(updatedEditor);
      }
    },
  });

  const getContent = useCallback((): JSONContent | null => {
    return editor?.getJSON() ?? null;
  }, [editor]);

  const setContent = useCallback(
    (newContent: JSONContent | string) => {
      editor?.commands.setContent(newContent);
    },
    [editor],
  );

  const getHTML = useCallback((): string => {
    return editor?.getHTML() ?? "";
  }, [editor]);

  const getText = useCallback((): string => {
    return editor?.getText() ?? "";
  }, [editor]);

  const isEmpty = useCallback((): boolean => {
    return editor?.isEmpty ?? true;
  }, [editor]);

  const focus = useCallback(() => {
    editor?.commands.focus();
  }, [editor]);

  const clear = useCallback(() => {
    editor?.commands.clearContent();
  }, [editor]);

  return {
    editor,
    getContent,
    setContent,
    getHTML,
    getText,
    isEmpty,
    focus,
    clear,
  };
}

export default ContentEditor;
