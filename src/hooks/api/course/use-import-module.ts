/**
 * Hook for importing course modules from parsed markdown content
 *
 * Handles the full import flow:
 * 1. Check if module code exists (upsert logic)
 * 2. Create module if new
 * 3. Convert markdown to TipTap JSON
 * 4. Build ModuleDraft payload
 * 5. Save via aggregate-update endpoint
 *
 * @see docs/plans/2026-02-25-feat-course-content-import-plan.md
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreateCourseModule, useTeacherCourseModules, courseModuleKeys } from "./use-course-module";
import { useSaveModuleDraft } from "./use-save-module-draft";
import { markdownToTipTap } from "~/lib/markdown-to-tiptap";
import { parseErrorMessage } from "~/lib/error-messages";
import type { ParsedModule } from "~/lib/import-parser";
import type { ModuleDraft, SLTDraft, LessonDraft, AssignmentDraft, IntroDraft } from "~/stores/module-draft-store";
import { generateLocalId } from "~/stores/module-draft-store";

// =============================================================================
// Types
// =============================================================================

export interface ImportModuleInput {
  /** Course ID (policy ID) to import into */
  courseId: string;
  /** Parsed module from folder upload */
  parsed: ParsedModule;
  /** Map of local image paths to uploaded URLs (for URL substitution in markdown) */
  imageUrlMap?: Map<string, string>;
}

export interface ImportModuleResult {
  /** Whether import was successful */
  success: boolean;
  /** Module code of the imported module */
  moduleCode: string;
  /** Whether this was an update to an existing module */
  wasUpdate: boolean;
  /** Error message if failed */
  error?: string;
  /** Summary of changes made */
  changes?: {
    sltsCreated: number;
    lessonsCreated: number;
    hasIntroduction: boolean;
    hasAssignment: boolean;
  };
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Build a ModuleDraft from ParsedModule
 *
 * Converts markdown content to TipTap JSON and structures data
 * for the aggregate-update endpoint.
 *
 * @param courseId - The course ID to import into
 * @param parsed - The parsed module from folder upload
 * @param isUpdate - Whether this is an update to an existing module
 * @param imageUrlMap - Optional map of local image paths to uploaded URLs
 */
function buildDraftFromParsed(
  courseId: string,
  parsed: ParsedModule,
  isUpdate: boolean,
  imageUrlMap?: Map<string, string>
): ModuleDraft {
  // Build SLTs
  const slts: SLTDraft[] = parsed.outline.slts.map((sltText, index) => ({
    _localId: generateLocalId("slt"),
    sltText,
    moduleIndex: index + 1, // 1-indexed
    _isNew: !isUpdate,
    _isModified: isUpdate,
  }));

  // Build lessons map
  const lessons = new Map<number, LessonDraft>();
  for (const lesson of parsed.lessons) {
    const contentJson = lesson.contentMarkdown
      ? markdownToTipTap(lesson.contentMarkdown, imageUrlMap)
      : null;

    lessons.set(lesson.sltIndex, {
      title: lesson.title,
      description: undefined,
      contentJson,
      sltIndex: lesson.sltIndex,
      imageUrl: undefined,
      videoUrl: undefined,
      _isNew: true,
      _isModified: false,
    });
  }

  // Build introduction
  let introduction: IntroDraft | null = null;
  if (parsed.introduction) {
    const contentJson = parsed.introduction.contentMarkdown
      ? markdownToTipTap(parsed.introduction.contentMarkdown, imageUrlMap)
      : null;

    introduction = {
      title: parsed.introduction.title,
      description: undefined,
      contentJson,
      imageUrl: undefined,
      videoUrl: undefined,
      _isNew: true,
      _isModified: false,
    };
  }

  // Build assignment
  let assignment: AssignmentDraft | null = null;
  if (parsed.assignment) {
    const contentJson = parsed.assignment.contentMarkdown
      ? markdownToTipTap(parsed.assignment.contentMarkdown, imageUrlMap)
      : null;

    assignment = {
      title: parsed.assignment.title,
      description: undefined,
      contentJson,
      imageUrl: undefined,
      videoUrl: undefined,
      _isNew: true,
      _isModified: false,
    };
  }

  return {
    courseId,
    moduleCode: parsed.outline.code,
    title: parsed.outline.title,
    description: undefined,
    imageUrl: undefined,
    videoUrl: undefined,
    slts,
    _sltsLocked: false, // New/draft modules have unlocked SLTs
    assignment,
    _deleteAssignment: false,
    introduction,
    _deleteIntroduction: false,
    lessons,
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for importing a course module from parsed markdown content
 *
 * @example
 * ```tsx
 * const importModule = useImportModule();
 *
 * const handleImport = async () => {
 *   const result = await importModule.mutateAsync({
 *     courseId: selectedCourse,
 *     parsed: parsedModule,
 *   });
 *
 *   if (result.success) {
 *     router.push(`/studio/courses/${courseId}/modules/${result.moduleCode}`);
 *   }
 * };
 * ```
 */
export function useImportModule() {
  const queryClient = useQueryClient();
  const createModule = useCreateCourseModule();
  const saveModuleDraft = useSaveModuleDraft();

  return useMutation({
    mutationFn: async ({
      courseId,
      parsed,
      imageUrlMap,
    }: ImportModuleInput): Promise<ImportModuleResult> => {
      try {
        // 1. Check if module code already exists
        // We need to fetch the current modules to check for existing code
        const existingModulesData = queryClient.getQueryData<
          { moduleCode?: string }[]
        >(courseModuleKeys.teacherList(courseId));

        const existingModule = existingModulesData?.find(
          (m) => m.moduleCode === parsed.outline.code
        );
        const isUpdate = !!existingModule;

        // 2. If new module, create it first
        if (!isUpdate) {
          await createModule.mutateAsync({
            courseId,
            moduleCode: parsed.outline.code,
            title: parsed.outline.title,
            description: undefined,
          });
        }

        // 3. Build draft payload with converted markdown
        const draft = buildDraftFromParsed(courseId, parsed, isUpdate, imageUrlMap);

        // 4. Save via aggregate-update endpoint
        const saveResult = await saveModuleDraft.mutateAsync(draft);

        if (!saveResult.success) {
          return {
            success: false,
            moduleCode: parsed.outline.code,
            wasUpdate: isUpdate,
            error: saveResult.error ?? "Failed to save module content",
          };
        }

        // 5. Return success result
        return {
          success: true,
          moduleCode: parsed.outline.code,
          wasUpdate: isUpdate,
          changes: {
            sltsCreated: parsed.outline.slts.length,
            lessonsCreated: parsed.lessons.length,
            hasIntroduction: !!parsed.introduction,
            hasAssignment: !!parsed.assignment,
          },
        };
      } catch (error) {
        // Parse error for user-friendly message
        const parsedError = parseErrorMessage(error);
        const errorMessage = parsedError?.message ?? (error instanceof Error ? error.message : "Import failed");

        return {
          success: false,
          moduleCode: parsed.outline.code,
          wasUpdate: false,
          error: errorMessage,
        };
      }
    },

    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate module caches to show updated data
        void queryClient.invalidateQueries({
          queryKey: courseModuleKeys.list(variables.courseId),
        });
        void queryClient.invalidateQueries({
          queryKey: courseModuleKeys.teacherList(variables.courseId),
        });
        void queryClient.invalidateQueries({
          queryKey: courseModuleKeys.detail(variables.courseId, result.moduleCode),
        });
      }
    },
  });
}

/**
 * Hook to prefetch module list before import
 *
 * Call this when the user selects a course to ensure
 * the module list is cached for upsert checking.
 */
export function usePrefetchModulesForImport(courseId: string | undefined) {
  // This just uses the existing hook which will cache the data
  return useTeacherCourseModules(courseId);
}
