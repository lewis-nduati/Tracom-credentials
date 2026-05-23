"use client";

import { type Editor } from "@tiptap/react";
import { AndamioToggle } from "~/components/andamio/andamio-toggle";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  UnderlineIcon,
  Link as LinkIcon,
} from "lucide-react";
// Note: Editor-specific formatting icons remain from lucide-react as they are not Andamio domain concepts
import { cn } from "../../../utils";
import { useCallback, useState } from "react";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioButton } from "~/components/andamio/andamio-button";

interface AndamioBubbleMenusProps {
  editor: Editor;
  className?: string;
}

/**
 * AndamioBubbleMenus - Floating menu that appears on text selection
 * Uses shadcn components for consistent styling
 */
export function AndamioBubbleMenus({
  editor,
  className,
}: AndamioBubbleMenusProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const setLink = useCallback(() => {
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const openLinkInput = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href as string;
    setLinkUrl(previousUrl ?? "");
    setShowLinkInput(true);
  }, [editor]);

  if (showLinkInput) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-sm border border-border bg-popover p-2 shadow-lg",
          className,
        )}
      >
        <AndamioInput
          type="url"
          placeholder="Enter URL"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setLink();
            } else if (e.key === "Escape") {
              setShowLinkInput(false);
              setLinkUrl("");
            }
          }}
          className="h-8 w-64"
          autoFocus
        />
        <AndamioButton size="sm" onClick={setLink}>
          Set
        </AndamioButton>
        <AndamioButton
          size="sm"
          variant="ghost"
          onClick={() => {
            setShowLinkInput(false);
            setLinkUrl("");
          }}
        >
          Cancel
        </AndamioButton>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-sm border border-border bg-popover p-1 shadow-lg",
        className,
      )}
    >
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("code")}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        aria-label="Inline Code"
      >
        <Code className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("link")}
        onPressedChange={openLinkInput}
        aria-label="Link"
      >
        <LinkIcon className="h-4 w-4" />
      </AndamioToggle>
    </div>
  );
}
