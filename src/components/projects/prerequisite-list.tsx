"use client";

import React from "react";
import Link from "next/link";
import { useCourse } from "~/hooks/api/course/use-course";
import { useCourseModules } from "~/hooks/api/course/use-course-module";
import type { ProjectPrerequisite } from "~/hooks/api/project/use-project";
import type { StudentCompletionInput } from "~/lib/project-eligibility";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { CourseIcon, SLTIcon, SuccessIcon, PendingIcon, NextIcon } from "~/components/icons";

/**
 * Renders a single prerequisite row, fetching course title and module names by ID.
 * When `completions` is provided, shows per-module completion status.
 */
export function PrerequisiteRow({
  prereq,
  completions,
}: {
  prereq: ProjectPrerequisite;
  completions?: StudentCompletionInput[];
}) {
  const { data: courseData, isLoading: isCourseLoading } = useCourse(prereq.courseId);
  const { data: modules = [], isLoading: isModulesLoading } = useCourseModules(prereq.courseId);
  const isLoading = isCourseLoading || isModulesLoading;

  // Build lookup: sltHash → { moduleCode, title }
  const moduleMap = new Map(
    modules.map((m) => [m.sltHash, { moduleCode: m.moduleCode, title: m.title }])
  );

  // Build completed hashes set for this course
  const courseCompletion = completions?.find((c) => c.courseId === prereq.courseId);
  const completedSet = new Set(courseCompletion?.completedModuleHashes ?? []);
  const hasCompletionData = !!courseCompletion;

  // Count completed vs total for this course's required modules
  const requiredHashes = prereq.sltHashes ?? [];
  const completedCount = requiredHashes.filter((h) => completedSet.has(h)).length;

  return (
    <Link
      href={`/course/${prereq.courseId}`}
      className="flex items-start gap-3 p-3 border rounded-lg hover:border-primary/30 hover:bg-accent/5 transition-colors group"
    >
      <CourseIcon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 truncate text-sm font-medium group-hover:text-primary transition-colors">
            {isLoading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : courseData?.title ? (
              courseData.title
            ) : (
              <span className="font-mono text-muted-foreground">{prereq.courseId.slice(0, 12)}...</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasCompletionData && requiredHashes.length > 0 && (
              <AndamioBadge
                variant="outline"
                className={
                  completedCount === requiredHashes.length
                    ? "text-primary border-primary/30"
                    : "text-muted-foreground"
                }
              >
                {completedCount}/{requiredHashes.length} completed
              </AndamioBadge>
            )}
            <NextIcon className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
        {requiredHashes.length > 0 && (
          <div className="mt-2 space-y-1">
            <AndamioText variant="small" className="text-muted-foreground">
              {requiredHashes.length} required module{requiredHashes.length !== 1 ? "s" : ""}
            </AndamioText>
            <div className="flex flex-wrap gap-1">
              {requiredHashes.map((hash) => {
                const mod = moduleMap.get(hash);
                const label = mod?.moduleCode && mod?.title
                  ? `${mod.moduleCode}: ${mod.title}`
                  : mod?.moduleCode
                    ? mod.moduleCode
                    : `${hash.slice(0, 12)}...`;
                const isCompleted = completedSet.has(hash);
                return (
                  <AndamioBadge
                    key={hash}
                    variant={hasCompletionData && isCompleted ? "default" : "outline"}
                    className={
                      hasCompletionData && isCompleted
                        ? "text-xs bg-primary text-primary-foreground"
                        : "text-xs"
                    }
                  >
                    {hasCompletionData ? (
                      isCompleted ? (
                        <SuccessIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <PendingIcon className="h-3 w-3 mr-1" />
                      )
                    ) : (
                      <SLTIcon className="h-3 w-3 mr-1" />
                    )}
                    {label}
                  </AndamioBadge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * Resolves a module hash to a human-readable label using the module map from a course.
 */
export function useModuleLabel(courseId: string, sltHash: string): { label: string; isLoading: boolean } {
  const { data: modules = [], isLoading } = useCourseModules(courseId);
  const mod = modules.find((m) => m.sltHash === sltHash);
  const label = mod?.moduleCode && mod?.title
    ? `${mod.moduleCode}: ${mod.title}`
    : mod?.moduleCode
      ? mod.moduleCode
      : `${sltHash.slice(0, 12)}...`;
  return { label, isLoading };
}

/**
 * Renders a list of prerequisites with course titles and module names.
 * When `completions` is provided, shows per-module completion status overlay.
 */
export function PrerequisiteList({
  prerequisites,
  completions,
}: {
  prerequisites: ProjectPrerequisite[];
  completions?: StudentCompletionInput[];
}) {
  if (prerequisites.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <CourseIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <AndamioText variant="muted">No prerequisites required</AndamioText>
        <AndamioText variant="small">Any contributor can join this project</AndamioText>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prerequisites.map((prereq, i) => (
        <PrerequisiteRow
          key={prereq.courseId || i}
          prereq={prereq}
          completions={completions}
        />
      ))}
    </div>
  );
}
