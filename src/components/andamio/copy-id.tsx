"use client";

import React from "react";
import { useCopyFeedback } from "~/hooks/ui/use-success-notification";
import { CopyIcon, CompletedIcon } from "~/components/icons";
import { cn } from "~/lib/utils";

interface CopyIdProps {
  /** The full ID to display and copy */
  id: string;
  /** Optional label for accessibility */
  label?: string;
  /** Additional class names */
  className?: string;
}

/**
 * CopyId - Display a copyable ID with responsive truncation
 *
 * - Mobile (< md): Shows truncated ID (first 8...last 6), full ID in title tooltip
 * - Desktop (md+): Shows full ID
 * - Click anywhere to copy, with subtle checkmark feedback
 *
 * @example
 * ```tsx
 * <CopyId id={project.projectId} label="Project ID" />
 * <CopyId id={course.courseId} label="Course ID" />
 * ```
 */
export function CopyId({ id, label, className }: CopyIdProps) {
  const { isCopied, copy } = useCopyFeedback();

  const truncatedId = `${id.slice(0, 8)}…${id.slice(-6)}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await copy(id);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={id}
      aria-label={label ? `Copy ${label}: ${id}` : `Copy ${id}`}
      className={cn(
        "group inline-flex items-center gap-1 font-mono text-[10px]",
        "hover:text-primary transition-colors cursor-pointer",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded",
        className
      )}
    >
      {/* Truncated ID - visible on mobile only */}
      <span className="md:hidden">{truncatedId}</span>
      {/* Full ID - visible on md+ */}
      <span className="hidden md:inline break-all">{id}</span>
      {/* Copy/Copied icon */}
      {isCopied ? (
        <CompletedIcon className="h-3 w-3 text-primary shrink-0" />
      ) : (
        <CopyIcon className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
      )}
    </button>
  );
}
