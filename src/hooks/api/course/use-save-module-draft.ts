/**
 * API Hook for saving module draft state
 *
 * Uses the aggregate-update endpoint to save entire module state in one request:
 * POST /api/v2/course/teacher/course-module/update
 *
 * This replaces 16 individual endpoints for granular updates.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { courseModuleKeys } from "./use-course-module";
import type { ModuleDraft, SaveModuleDraftResult, SLTDraft } from "~/stores/module-draft-store";
import { GATEWAY_API_BASE } from "~/lib/api-utils";

// =============================================================================
// Request/Response Types
// =============================================================================

/**
 * SLT input for aggregate update.
 * SLTs are keyed by (course_id, module_code, slt_index).
 *
 * API behavior:
 * - If slt_index included: UPDATE existing SLT with that index
 * - If slt_index omitted: CREATE new SLT (server assigns index)
 */
interface SltInput {
  /** 1-based index. Include for updates, omit for creates. */
  slt_index?: number;
  /** SLT text content */
  slt_text: string;
}

/**
 * Lesson input for aggregate update
 */
interface LessonInput {
  /** Links to SLT (1-based) */
  slt_index: number;
  title: string;
  description?: string;
  content_json?: unknown;
  image_url?: string;
  video_url?: string;
}

/**
 * Assignment input for aggregate update
 */
interface AssignmentInput {
  title: string;
  description?: string;
  content_json?: unknown;
  image_url?: string;
  video_url?: string;
}

/**
 * Introduction input for aggregate update
 */
interface IntroductionInput {
  title: string;
  description?: string;
  content_json?: unknown;
  image_url?: string;
  video_url?: string;
}

/**
 * Request body for aggregate-update endpoint
 *
 * POST /api/v2/course/teacher/course-module/update
 *
 * Key behaviors:
 * - Omitted fields = unchanged (allows partial updates)
 * - Use `delete_assignment: true` to remove assignment
 * - Use `delete_introduction: true` to remove introduction
 * - SLTs: send full array with slt_index, server diffs/reorders
 * - Lessons: send full array keyed by slt_index, server diffs
 */
interface SaveModuleDraftRequest {
  course_id: string;
  course_module_code: string;

  // Module metadata (optional - only send if changed)
  title?: string;
  description?: string;
  image_url?: string;
  video_url?: string;

  // SLTs - full ordered list with explicit indices (server diffs against current state)
  // If omitted, SLTs unchanged. If empty array, all SLTs deleted.
  // IMPORTANT: Can ONLY be modified when module status is DRAFT
  slts?: SltInput[];

  // Assignment - full object to create/update
  // If key omitted, assignment unchanged
  assignment?: AssignmentInput;
  // Set true to delete existing assignment
  delete_assignment?: boolean;

  // Introduction - full object to create/update
  // If key omitted, introduction unchanged
  introduction?: IntroductionInput;
  // Set true to delete existing introduction
  delete_introduction?: boolean;

  // Lessons - full list keyed by slt_index
  // Server diffs: creates new, updates existing, deletes missing
  lessons?: LessonInput[];

  // Status transition (optional)
  // Only "APPROVED" is valid via this endpoint (DRAFT → APPROVED)
  status?: "APPROVED";
  // Required when status = "APPROVED"
  slt_hash?: string;
}

/**
 * Response from aggregate-update endpoint
 */
interface SaveModuleDraftResponse {
  data?: {
    course_module_code: string;
    course_id: string;
    title: string;
    description?: string;
    image_url?: string;
    video_url?: string;
    status: "DRAFT" | "APPROVED" | "PENDING_TX" | "ON_CHAIN";
    slt_hash?: string;
    slts?: Array<{
      slt_index: number;
      slt_text: string;
      created_by_alias?: string;
    }>;
    assignment?: {
      title: string;
      description?: string;
      content_json?: unknown;
      image_url?: string;
      video_url?: string;
    };
    introduction?: {
      title?: string;
      description?: string;
      content_json?: unknown;
      image_url?: string;
      video_url?: string;
    };
    lessons?: Array<{
      slt_index: number;
      title: string;
      description?: string;
      content_json?: unknown;
      image_url?: string;
      video_url?: string;
    }>;
  };
  changes?: {
    module_updated?: boolean;
    status_changed?: boolean;
    slts_created?: number;
    slts_updated?: number;
    slts_deleted?: number;
    slts_reordered?: boolean;
    assignment_created?: boolean;
    assignment_updated?: boolean;
    assignment_deleted?: boolean;
    introduction_created?: boolean;
    introduction_updated?: boolean;
    introduction_deleted?: boolean;
    lessons_created?: number;
    lessons_updated?: number;
    lessons_deleted?: number;
  };
  error?: string;
  code?: "SLT_LOCKED" | "MODULE_NOT_FOUND" | "UNAUTHORIZED" | "BAD_REQUEST";
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform draft SLTs to API format.
 *
 * API behavior for slt_index:
 * - If slt_index included: UPDATE existing SLT with that index
 * - If slt_index omitted: CREATE new SLT (server assigns index)
 *
 * We use the _isNew flag to determine whether to include slt_index:
 * - New SLTs (_isNew: true): omit slt_index → server creates
 * - Existing SLTs: include slt_index → server updates
 *
 * Deleted SLTs are filtered out.
 */
function transformSltsForApi(slts: SLTDraft[]): SltInput[] {
  return slts
    .filter((slt) => !slt._isDeleted)
    .map((slt) => {
      const input: SltInput = {
        slt_text: slt.sltText,
      };
      // Only include slt_index for existing SLTs (updates)
      // Omit for new SLTs so server creates them
      if (!slt._isNew) {
        input.slt_index = slt.moduleIndex;
      }
      return input;
    });
}

/**
 * Transform draft to API request body.
 *
 * Handles the aggregate-update endpoint semantics:
 * - Omitted fields = unchanged
 * - delete_assignment: true = delete existing assignment
 * - delete_introduction: true = delete existing introduction
 * - slts array = full ordered list with indices (server diffs)
 * - lessons array = full list keyed by slt_index (server diffs)
 *
 * When _sltsLocked is true (module is approved/active), SLTs are excluded
 * from the request to prevent SLT_LOCKED errors.
 */
function transformDraftToRequest(draft: ModuleDraft): SaveModuleDraftRequest {
  const request: SaveModuleDraftRequest = {
    course_id: draft.courseId,
    course_module_code: draft.moduleCode,
  };

  // Always include metadata (API will diff)
  request.title = draft.title;
  request.description = draft.description;
  request.image_url = draft.imageUrl;
  request.video_url = draft.videoUrl;

  // Only include SLTs if not locked (module is in DRAFT status)
  // After approval, SLTs cannot be modified
  if (!draft._sltsLocked) {
    request.slts = transformSltsForApi(draft.slts);
  }

  // Handle assignment: create/update or delete
  if (draft._deleteAssignment) {
    request.delete_assignment = true;
  } else if (draft.assignment !== null && (draft.assignment._isNew || draft.assignment._isModified)) {
    request.assignment = {
      title: draft.assignment.title,
      description: draft.assignment.description,
      content_json: draft.assignment.contentJson,
      image_url: draft.assignment.imageUrl,
      video_url: draft.assignment.videoUrl,
    };
  }

  // Handle introduction: create/update or delete
  if (draft._deleteIntroduction) {
    request.delete_introduction = true;
  } else if (draft.introduction !== null && (draft.introduction._isNew || draft.introduction._isModified)) {
    request.introduction = {
      title: draft.introduction.title,
      description: draft.introduction.description,
      content_json: draft.introduction.contentJson,
      image_url: draft.introduction.imageUrl,
      video_url: draft.introduction.videoUrl,
    };
  }

  // Include lessons if any exist
  if (draft.lessons.size > 0) {
    request.lessons = Array.from(draft.lessons.entries()).map(
      ([sltIndex, lesson]) => ({
        slt_index: sltIndex,
        title: lesson.title,
        description: lesson.description,
        content_json: lesson.contentJson,
        image_url: lesson.imageUrl,
        video_url: lesson.videoUrl,
      })
    );
  }

  return request;
}

/**
 * Transform API response to SaveModuleDraftResult
 */
function transformResponse(response: SaveModuleDraftResponse): SaveModuleDraftResult {
  return {
    success: !response.error,
    error: response.error,
    changes: response.changes
      ? {
          moduleUpdated: response.changes.module_updated ?? false,
          sltsCreated: response.changes.slts_created ?? 0,
          sltsUpdated: response.changes.slts_updated ?? 0,
          sltsDeleted: response.changes.slts_deleted ?? 0,
          sltsReordered: response.changes.slts_reordered ?? false,
          assignmentCreated: response.changes.assignment_created ?? false,
          assignmentUpdated: response.changes.assignment_updated ?? false,
          assignmentDeleted: response.changes.assignment_deleted ?? false,
          introductionCreated: response.changes.introduction_created ?? false,
          introductionUpdated: response.changes.introduction_updated ?? false,
          introductionDeleted: response.changes.introduction_deleted ?? false,
          lessonsCreated: response.changes.lessons_created ?? 0,
          lessonsUpdated: response.changes.lessons_updated ?? 0,
          lessonsDeleted: response.changes.lessons_deleted ?? 0,
        }
      : undefined,
  };
}

// =============================================================================
// Mutation Hook
// =============================================================================

/**
 * Hook for saving module draft via aggregate-update endpoint.
 *
 * On success, invalidates React Query cache to trigger refetch of fresh data.
 *
 * @example
 * ```tsx
 * const saveModuleDraft = useSaveModuleDraft();
 *
 * const handleSave = async (draft: ModuleDraft) => {
 *   const result = await saveModuleDraft.mutateAsync(draft);
 *   if (result.success) {
 *     toast.success("Module saved");
 *   } else {
 *     toast.error(result.error);
 *   }
 * };
 * ```
 */
export function useSaveModuleDraft() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (draft: ModuleDraft): Promise<SaveModuleDraftResult> => {
      const request = transformDraftToRequest(draft);

      // Debug: log what we're sending
      console.log("[useSaveModuleDraft] Saving draft:", {
        courseId: draft.courseId,
        moduleCode: draft.moduleCode,
        sltsLocked: draft._sltsLocked,
        sltCount: draft.slts.length,
        slts: draft._sltsLocked ? "(locked - not sending)" : draft.slts.map(s => ({ index: s.moduleIndex, text: s.sltText?.slice(0, 30), isNew: s._isNew, isDeleted: s._isDeleted })),
        hasAssignment: !!draft.assignment,
        assignmentIsNew: draft.assignment?._isNew,
        assignmentIsModified: draft.assignment?._isModified,
      });
      console.log("[useSaveModuleDraft] Request body:", JSON.stringify(request, null, 2));

      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/course-module/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to save module: ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorText) as { message?: string; error?: string };
          errorMessage = errorJson.message ?? errorJson.error ?? errorMessage;
        } catch {
          // Use default error message
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      const responseData = (await response.json()) as SaveModuleDraftResponse;
      console.log("[useSaveModuleDraft] Response:", responseData);
      return transformResponse(responseData);
    },

    onSuccess: (result, draft) => {
      if (result.success) {
        // Invalidate cache to trigger refetch with fresh server data
        void queryClient.invalidateQueries({
          queryKey: courseModuleKeys.list(draft.courseId),
        });
        void queryClient.invalidateQueries({
          queryKey: courseModuleKeys.teacherList(draft.courseId),
        });
        void queryClient.invalidateQueries({
          queryKey: courseModuleKeys.detail(draft.courseId, draft.moduleCode),
        });
      }
    },
  });
}
