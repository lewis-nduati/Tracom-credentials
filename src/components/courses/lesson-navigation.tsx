"use client";

import React from "react";
import Link from "next/link";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { PreviousIcon, NextIcon, AssignmentIcon } from "~/components/icons";

export interface LessonNavItem {
  /** SLT module_index (1-based) */
  index: number;
  /** Lesson title for subtitle display */
  title: string;
}

interface LessonNavigationProps {
  /** Current lesson's SLT index */
  currentIndex: number;
  /** All SLTs in this module that have lessons, sorted by index */
  lessonsWithNav: LessonNavItem[];
  /** Course ID for building hrefs */
  courseId: string;
  /** Module code for building hrefs */
  moduleCode: string;
}

/**
 * LessonNavigation - Prev/Next navigation between lessons within a module
 *
 * Cycles through SLTs that have lessons. First lesson has no previous button.
 * Last lesson's "Next" becomes "Go to Assignment". Shows destination lesson
 * title as a subtitle on each button.
 */
export function LessonNavigation({
  currentIndex,
  lessonsWithNav,
  courseId,
  moduleCode,
}: LessonNavigationProps) {
  if (lessonsWithNav.length === 0) return null;

  const currentPos = lessonsWithNav.findIndex((l) => l.index === currentIndex);
  if (currentPos === -1) return null;

  const prev = currentPos > 0 ? lessonsWithNav[currentPos - 1] : null;
  const next = currentPos < lessonsWithNav.length - 1 ? lessonsWithNav[currentPos + 1] : null;
  const isLastLesson = currentPos === lessonsWithNav.length - 1;

  return (
    <div className="flex items-stretch justify-between gap-4 pt-6 border-t">
      {/* Previous */}
      <div className="flex-1">
        {prev && (
          <Link href={`/course/${courseId}/${moduleCode}/${prev.index}`} className="block">
            <AndamioButton variant="outline" className="w-full justify-start h-auto py-3">
              <PreviousIcon className="h-4 w-4 mr-2 shrink-0" />
              <div className="text-left">
                <div className="text-sm">Previous</div>
                <AndamioText variant="small" className="text-xs text-muted-foreground">
                  {prev.title}
                </AndamioText>
              </div>
            </AndamioButton>
          </Link>
        )}
      </div>

      {/* Next or Go to Assignment */}
      <div className="flex-1">
        {next ? (
          <Link href={`/course/${courseId}/${moduleCode}/${next.index}`} className="block">
            <AndamioButton variant="outline" className="w-full justify-end h-auto py-3">
              <div className="text-right">
                <div className="text-sm">Next</div>
                <AndamioText variant="small" className="text-xs text-muted-foreground">
                  {next.title}
                </AndamioText>
              </div>
              <NextIcon className="h-4 w-4 ml-2 shrink-0" />
            </AndamioButton>
          </Link>
        ) : isLastLesson ? (
          <Link href={`/course/${courseId}/${moduleCode}/assignment`} className="block">
            <AndamioButton className="w-full justify-end h-auto py-3">
              <div className="text-right">
                <div className="text-sm">Go to Assignment</div>
              </div>
              <AssignmentIcon className="h-4 w-4 ml-2 shrink-0" />
            </AndamioButton>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
