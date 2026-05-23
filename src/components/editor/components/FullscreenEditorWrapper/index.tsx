"use client";

import { type Editor } from "@tiptap/core";
import { CloseIcon } from "~/components/icons";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { cn } from "~/lib/utils";

interface FullscreenEditorWrapperProps {
  isFullscreen: boolean;
  onExitFullscreen: () => void;
  editor: Editor | null;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * FullscreenEditorWrapper - Wrapper for full-screen editor mode
 * Provides a full-screen overlay with close button and toolbar
 */
export function FullscreenEditorWrapper({
  isFullscreen,
  onExitFullscreen,
  editor: _editor,
  toolbar,
  children,
}: FullscreenEditorWrapperProps) {
  if (!isFullscreen) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        "flex flex-col",
        "bg-background",
        "overflow-hidden",
      )}
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between border-b border-border bg-background p-4">
        <div className="flex-1">{toolbar}</div>
        <AndamioButton
          variant="ghost"
          size="sm"
          onClick={onExitFullscreen}
          aria-label="Exit full screen (Esc)"
          className="ml-4"
        >
          <CloseIcon className="h-4 w-4" />
          <span className="ml-2">Exit Full Screen</span>
        </AndamioButton>
      </div>

      {/* Editor content area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
