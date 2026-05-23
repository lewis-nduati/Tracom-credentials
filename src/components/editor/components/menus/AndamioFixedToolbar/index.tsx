"use client";

import { type Editor } from "@tiptap/core";
import { AndamioToggle } from "~/components/andamio/andamio-toggle";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  UnderlineIcon,
  Maximize2,
  Minimize2,
} from "lucide-react";
// Note: Editor-specific formatting icons remain from lucide-react as they are not Andamio domain concepts
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { cn } from "../../../utils";

interface AndamioFixedToolbarProps {
  editor: Editor | null;
  className?: string;
  /**
   * Whether full-screen mode is active
   */
  isFullscreen?: boolean;
  /**
   * Callback to toggle full-screen mode
   */
  onToggleFullscreen?: () => void;
}

/**
 * AndamioFixedToolbar - Fixed toolbar for editor formatting
 * Uses shadcn Toggle components for a clean, consistent UI
 */
export function AndamioFixedToolbar({
  editor,
  className,
  isFullscreen = false,
  onToggleFullscreen,
}: AndamioFixedToolbarProps) {
  // Don't render until editor is ready
  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-sm border border-border bg-background p-2 sm:p-3 md:gap-1.5",
        className,
      )}
    >
      {/* History */}
      <AndamioToggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
        className="touch-target"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
        className="touch-target"
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </AndamioToggle>

      <AndamioSeparator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        aria-label="Heading 1"
        className="touch-target"
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        aria-label="Heading 2"
        className="touch-target"
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        aria-label="Heading 3"
        className="touch-target"
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </AndamioToggle>

      <AndamioSeparator orientation="vertical" className="mx-1 h-6" />

      {/* Text formatting */}
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
        className="touch-target"
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
        className="touch-target"
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Underline"
        className="touch-target"
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strikethrough"
        className="touch-target"
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("code")}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        aria-label="Inline Code"
        className="touch-target"
        title="Inline Code"
      >
        <Code className="h-4 w-4" />
      </AndamioToggle>

      <AndamioSeparator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet List"
        className="touch-target"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered List"
        className="touch-target"
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </AndamioToggle>

      <AndamioSeparator orientation="vertical" className="mx-1 h-6" />

      {/* Block elements */}
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Blockquote"
        className="touch-target"
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </AndamioToggle>

      {/* Full-screen toggle (if enabled) */}
      {onToggleFullscreen && (
        <>
          <AndamioSeparator orientation="vertical" className="mx-1 h-6" />
          <AndamioToggle
            size="sm"
            pressed={isFullscreen}
            onPressedChange={onToggleFullscreen}
            aria-label={
              isFullscreen ? "Exit full screen" : "Enter full screen"
            }
            className="touch-target"
            title={isFullscreen ? "Exit full screen" : "Enter full screen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </AndamioToggle>
        </>
      )}
    </div>
  );
}
