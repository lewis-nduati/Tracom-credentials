/**
 * CoursePrereqsSelector Component (V2 - Redesigned)
 *
 * Elevated UI for selecting course prerequisites when creating a project.
 * Prerequisites define what courses a contributor must complete to join
 * a project and start earning — this is the core decision of project creation.
 *
 * Data format for Atlas API:
 * course_prereqs: [[course_policy_id, [module_hash_1, module_hash_2, ...]]]
 */

"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  useTeacherCoursesWithModules,
  type TeacherCourseWithModules,
} from "~/hooks/api";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioCheckbox } from "~/components/andamio/andamio-checkbox";
import {
  CourseIcon,
  ModuleIcon,
  SLTIcon,
  ShieldIcon,
  ExpandIcon,
  CollapseIcon,
  InfoIcon,
  SuccessIcon,
  AlertIcon,
  LockedIcon,
} from "~/components/icons";
import { AndamioButton } from "~/components/andamio/andamio-button";
import Link from "next/link";
import { Skeleton } from "~/components/ui/skeleton";

// Type for the course_prereqs format expected by Atlas API
export type CoursePrereq = [string, string[]]; // [course_policy_id, module_hashes[]]

interface CoursePrereqsSelectorProps {
  /** Current value of course prerequisites */
  value: CoursePrereq[];
  /** Callback when prerequisites change */
  onChange: (prereqs: CoursePrereq[]) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Optional callback to intercept "Create a Course" button click */
  onCreateCourse?: () => void;
}

export function CoursePrereqsSelector({
  value,
  onChange,
  disabled = false,
  onCreateCourse,
}: CoursePrereqsSelectorProps) {
  const { data: courses, isLoading: coursesLoading } =
    useTeacherCoursesWithModules();

  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  // Build a lookup: courseId -> selected module hashes
  const selectionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const [courseId, moduleHashes] of value) {
      map.set(courseId, new Set(moduleHashes));
    }
    return map;
  }, [value]);

  // Summary stats
  const selectedCourseCount = value.length;
  const selectedModuleCount = value.reduce(
    (sum, [, modules]) => sum + modules.length,
    0,
  );

  const handleToggleModule = useCallback(
    (courseId: string, moduleHash: string) => {
      const existing = selectionMap.get(courseId);

      if (existing?.has(moduleHash)) {
        // Remove module
        const newModules = [...existing].filter((m) => m !== moduleHash);
        if (newModules.length === 0) {
          // Remove course entirely
          onChange(value.filter(([id]) => id !== courseId));
        } else {
          onChange(
            value.map(([id, modules]): CoursePrereq =>
              id === courseId ? [id, newModules] : [id, modules],
            ),
          );
        }
      } else {
        // Add module
        if (existing) {
          onChange(
            value.map(([id, modules]): CoursePrereq =>
              id === courseId
                ? [id, [...modules, moduleHash]]
                : [id, modules],
            ),
          );
        } else {
          onChange([...value, [courseId, [moduleHash]]]);
        }
      }
    },
    [value, onChange, selectionMap],
  );

  const handleToggleCourse = useCallback(
    (courseId: string, allModuleHashes: string[]) => {
      const existing = selectionMap.get(courseId);
      const allSelected =
        existing && allModuleHashes.every((h) => existing.has(h));

      if (allSelected) {
        // Deselect all → remove course
        onChange(value.filter(([id]) => id !== courseId));
      } else {
        // Select all modules
        if (existing) {
          onChange(
            value.map(([id, modules]): CoursePrereq =>
              id === courseId ? [id, [...allModuleHashes]] : [id, modules],
            ),
          );
        } else {
          onChange([...value, [courseId, [...allModuleHashes]]]);
        }
      }
    },
    [value, onChange, selectionMap],
  );

  const handleSelectAll = useCallback(
    (courseId: string, allModuleHashes: string[]) => {
      const existing = selectionMap.get(courseId);
      if (existing) {
        onChange(
          value.map(([id, modules]): CoursePrereq =>
            id === courseId ? [id, [...allModuleHashes]] : [id, modules],
          ),
        );
      } else {
        onChange([...value, [courseId, [...allModuleHashes]]]);
      }
    },
    [value, onChange, selectionMap],
  );

  const handleClearCourse = useCallback(
    (courseId: string) => {
      onChange(value.filter(([id]) => id !== courseId));
    },
    [value, onChange],
  );

  // Only public courses with modules are eligible as prerequisites
  const availableCourses = useMemo(
    () => courses?.filter((c) => c.modules.length > 0 && c.isPublic !== false) ?? [],
    [courses],
  );

  // Private courses with modules — for the "make public" guidance
  const privateCourses = useMemo(
    () => courses?.filter((c) => c.modules.length > 0 && c.isPublic === false) ?? [],
    [courses],
  );

  if (coursesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10">
          <ShieldIcon className="h-5 w-5 text-secondary" />
        </div>
        <div className="flex-1 space-y-1">
          <AndamioHeading level={3} size="lg">
            Contributor Requirements
          </AndamioHeading>
          <AndamioText variant="muted" className="text-sm">
            Select which course modules contributors must complete to join.
          </AndamioText>
        </div>
      </div>

      {/* Summary Badges */}
      {selectedCourseCount > 0 && (
        <div className="flex items-center gap-2">
          <AndamioBadge variant="secondary">
            {selectedCourseCount} course{selectedCourseCount !== 1 ? "s" : ""}
          </AndamioBadge>
          <AndamioBadge variant="outline">
            {selectedModuleCount} module{selectedModuleCount !== 1 ? "s" : ""}{" "}
            required
          </AndamioBadge>
        </div>
      )}

      {/* Course Cards */}
      {availableCourses.length > 0 ? (
        <div className="space-y-3">
          <AndamioText variant="small" className="font-medium uppercase tracking-wide text-muted-foreground">
            Your Courses
          </AndamioText>

          {availableCourses.map((course) => {
            const allModuleHashes = course.modules.map(
              (m) => m.assignmentId,
            );
            const selected = selectionMap.get(course.courseId);
            const selectedCount = selected?.size ?? 0;
            const isExpanded = expandedCourseId === course.courseId;

            return (
              <CoursePrereqCard
                key={course.courseId}
                course={course}
                selectedModules={selected ? [...selected] : []}
                selectedCount={selectedCount}
                totalModules={course.modules.length}
                isExpanded={isExpanded}
                onToggleExpand={() =>
                  setExpandedCourseId(
                    isExpanded ? null : course.courseId,
                  )
                }
                onToggleCourse={() =>
                  handleToggleCourse(course.courseId, allModuleHashes)
                }
                onToggleModule={(hash) =>
                  handleToggleModule(course.courseId, hash)
                }
                onSelectAll={() =>
                  handleSelectAll(course.courseId, allModuleHashes)
                }
                onClear={() => handleClearCourse(course.courseId)}
                disabled={disabled}
              />
            );
          })}
        </div>
      ) : privateCourses.length > 0 ? (
        <div className="rounded-sm border border-warning/30 bg-warning/5 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <LockedIcon className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <AndamioHeading level={4} size="base" className="text-foreground">
                No Public Courses
              </AndamioHeading>
              <AndamioText variant="muted" className="text-sm">
                You have {privateCourses.length} private {privateCourses.length === 1 ? "course" : "courses"} with{" "}
                {(() => {
                  const total = privateCourses.reduce((sum, c) => sum + c.modules.length, 0);
                  return `${total} minted ${total === 1 ? "module" : "modules"}`;
                })()}, but only public courses can be used as project prerequisites.
                Contributors need to discover and enroll in prerequisite courses via Browse Courses.
              </AndamioText>
              <AndamioText variant="muted" className="text-sm">
                To make a course public, go to <span className="font-medium text-foreground">Course Studio &rarr; your course &rarr; Course Settings</span> and toggle the visibility to public.
              </AndamioText>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-sm border border-warning/30 bg-warning/5 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertIcon className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <AndamioHeading level={4} size="base" className="text-foreground">
                No Courses Available
              </AndamioHeading>
              <AndamioText variant="muted" className="text-sm">
                Create a course with at least one module to set contributor requirements.
              </AndamioText>
            </div>
          </div>

          {onCreateCourse ? (
            <AndamioButton className="w-full" onClick={onCreateCourse}>
              <CourseIcon className="h-4 w-4 mr-2" />
              Create a Course
            </AndamioButton>
          ) : (
            <Link href="/studio?create=course">
              <AndamioButton className="w-full">
                <CourseIcon className="h-4 w-4 mr-2" />
                Create a Course
              </AndamioButton>
            </Link>
          )}
        </div>
      )}

      {/* Permanence Notice - only show when prerequisites are selected */}
      {selectedCourseCount > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2.5">
          <InfoIcon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <AndamioText variant="small" className="text-muted-foreground">
            Prerequisites are permanent and become part of the on-chain record.
          </AndamioText>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CoursePrereqCard
// =============================================================================

interface CoursePrereqCardProps {
  course: TeacherCourseWithModules;
  selectedModules: string[];
  selectedCount: number;
  totalModules: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleCourse: () => void;
  onToggleModule: (moduleHash: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  disabled?: boolean;
}

function CoursePrereqCard({
  course,
  selectedModules,
  selectedCount,
  totalModules,
  isExpanded,
  onToggleExpand,
  onToggleCourse,
  onToggleModule,
  onSelectAll,
  onClear,
  disabled = false,
}: CoursePrereqCardProps) {
  const selectedSet = useMemo(
    () => new Set(selectedModules),
    [selectedModules],
  );
  const allSelected = selectedCount === totalModules && totalModules > 0;
  const someSelected = selectedCount > 0 && !allSelected;

  // Visual state classes
  const borderClass = allSelected
    ? "border-primary/40 bg-primary/5"
    : someSelected
      ? "border-l-primary border-l-2"
      : "";

  return (
    <div className={`rounded-sm border ${borderClass}`}>
      {/* Course Header — clickable to expand */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <AndamioCheckbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={() => onToggleCourse()}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select all modules from ${course.title ?? course.courseId}`}
        />

        <CourseIcon className="h-4 w-4 text-primary shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {course.title ?? `Course ${course.courseId.slice(0, 8)}...`}
            </span>
            {allSelected && (
              <SuccessIcon className="h-4 w-4 text-primary shrink-0" />
            )}
          </div>
          <AndamioText variant="small" className="text-muted-foreground">
            {selectedCount === 0
              ? `${totalModules} module${totalModules !== 1 ? "s" : ""} available`
              : allSelected
                ? `All ${totalModules} module${totalModules !== 1 ? "s" : ""} required`
                : `${selectedCount} of ${totalModules} module${totalModules !== 1 ? "s" : ""} selected`}
          </AndamioText>
        </div>

        <div className="shrink-0 text-muted-foreground">
          {isExpanded ? (
            <CollapseIcon className="h-4 w-4" />
          ) : (
            <ExpandIcon className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Expanded Module List */}
      {isExpanded && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2">
          {course.modules.map((courseModule) => (
            <ModuleCheckboxRow
              key={courseModule.assignmentId}
              moduleCode={courseModule.moduleCode}
              title={courseModule.title}
              sltCount={courseModule.slts.length}
              checked={selectedSet.has(courseModule.assignmentId)}
              onToggle={() => onToggleModule(courseModule.assignmentId)}
              disabled={disabled}
            />
          ))}

          {/* Select All / Clear buttons */}
          <div className="flex items-center gap-2 pt-1">
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              disabled={disabled || allSelected}
              className="h-7 text-xs"
            >
              Select All
            </AndamioButton>
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={disabled || selectedCount === 0}
              className="h-7 text-xs"
            >
              Clear
            </AndamioButton>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ModuleCheckboxRow
// =============================================================================

interface ModuleCheckboxRowProps {
  moduleCode?: string;
  title?: string;
  sltCount: number;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function ModuleCheckboxRow({
  moduleCode,
  title,
  sltCount,
  checked,
  onToggle,
  disabled = false,
}: ModuleCheckboxRowProps) {
  return (
    <div
      className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
      onClick={disabled ? undefined : onToggle}
    >
      <AndamioCheckbox
        checked={checked}
        onCheckedChange={onToggle}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
      />
      {moduleCode && (
        <AndamioBadge variant="outline" className="font-mono text-xs shrink-0">
          {moduleCode}
        </AndamioBadge>
      )}
      <ModuleIcon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-sm truncate flex-1">
        {title ?? "Untitled Module"}
      </span>
      <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
        <SLTIcon className="h-3 w-3" />
        <span className="text-xs">{sltCount}</span>
      </div>
    </div>
  );
}
