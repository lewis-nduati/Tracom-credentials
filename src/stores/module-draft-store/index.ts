/**
 * Module Draft Store (Refactored)
 *
 * Zustand store for managing local draft state of a course module.
 * Uses a store factory pattern to support multiple modules simultaneously.
 *
 * Key design decisions:
 * - Store factory creates isolated stores per courseId:moduleCode
 * - No React dependencies in store (save function passed as argument)
 * - Actions are pure - no useEffect/useMemo workarounds needed
 * - Dirty checking compares draft vs serverState snapshot
 *
 * @example
 * ```tsx
 * // Get or create store for specific module
 * const store = getModuleDraftStore(courseId, moduleCode);
 *
 * // Use in component with selector
 * const draft = useStore(store, (s) => s.draft);
 * const addSlt = useStore(store, (s) => s.addSlt);
 *
 * // Save with external function
 * await store.getState().save(myApiSaveFn);
 * ```
 */

import { createStore } from "zustand";
import type { StoreApi } from "zustand";
import type {
  ModuleDraft,
  SLTDraft,
  AssignmentDraft,
  IntroDraft,
  LessonDraft,
  SaveModuleDraftResult,
} from "./types";
import { generateLocalId } from "./types";
import type {
  CourseModule,
  SLT,
  Assignment,
  Introduction,
  Lesson,
} from "~/hooks/api/course/use-course-module";

// =============================================================================
// Store State Interface
// =============================================================================

interface ModuleDraftState {
  // Identity
  courseId: string;
  moduleCode: string;
  isNewModule: boolean;

  // Server state (snapshot from last fetch/save)
  serverState: CourseModule | null;

  // Draft state (local edits - optimistic)
  draft: ModuleDraft | null;

  // Status
  isDirty: boolean;
  isSaving: boolean;
  lastError: string | null;
  lastSaveResult: SaveModuleDraftResult | null;
}

// =============================================================================
// Store Actions Interface
// =============================================================================

interface ModuleDraftActions {
  // Initialize/reset from server data
  initialize: (serverData: CourseModule | null, isNewModule: boolean) => void;

  // Optimistic update actions
  setMetadata: (title: string, description?: string) => void;
  addSlt: (text: string) => void;
  updateSlt: (moduleIndex: number, text: string) => void;
  deleteSlt: (moduleIndex: number) => void;
  reorderSlts: (newOrder: number[]) => void;
  setAssignment: (
    data: Omit<AssignmentDraft, "_isModified" | "_isNew"> | null
  ) => void;
  setIntroduction: (
    data: Omit<IntroDraft, "_isModified" | "_isNew"> | null
  ) => void;
  setLesson: (
    sltIndex: number,
    data: Omit<LessonDraft, "_isModified" | "_isNew" | "sltIndex"> | null
  ) => void;

  // Persistence - save function passed as argument, not stored
  save: (
    saveFn: (draft: ModuleDraft) => Promise<SaveModuleDraftResult>
  ) => Promise<boolean>;
  /**
   * Mark the draft as clean after a successful save.
   * Resets all modification flags without changing the data.
   * Also updates serverState to match current draft.
   */
  markClean: () => void;
  discard: () => void;

  /**
   * Update the SLT lock state based on module status.
   * Called when server data is refetched after status changes (e.g., approval).
   * Does NOT overwrite draft data, only updates the lock flag.
   */
  updateLockState: (status: string | null | undefined) => void;
}

export type ModuleDraftStore = ModuleDraftState & ModuleDraftActions;

// =============================================================================
// Helper Functions
// =============================================================================

function serverSltToDraft(slt: SLT): SLTDraft {
  return {
    id: slt.id,
    _localId: generateLocalId("slt"),
    sltText: slt.sltText ?? "",
    moduleIndex: slt.moduleIndex ?? 1,
    _isModified: false,
    _isNew: false,
    _isDeleted: false,
  };
}

function serverLessonToDraft(lesson: Lesson): LessonDraft {
  return {
    id: lesson.id,
    title: lesson.title ?? "",
    description: lesson.description,
    contentJson: lesson.contentJson,
    sltIndex: lesson.sltIndex ?? 1,
    imageUrl: lesson.imageUrl,
    videoUrl: lesson.videoUrl,
    _isModified: false,
    _isNew: false,
  };
}

function serverAssignmentToDraft(assignment: Assignment): AssignmentDraft {
  return {
    id: assignment.id,
    title: assignment.title ?? "",
    description: assignment.description,
    contentJson: assignment.contentJson,
    imageUrl: assignment.imageUrl,
    videoUrl: assignment.videoUrl,
    _isModified: false,
    _isNew: false,
  };
}

function serverIntroToDraft(intro: Introduction): IntroDraft {
  return {
    id: intro.id,
    title: intro.title ?? "",
    description: intro.description,
    contentJson: intro.contentJson,
    imageUrl: intro.imageUrl,
    videoUrl: intro.videoUrl,
    _isModified: false,
    _isNew: false,
  };
}

function createDraftFromServer(
  courseId: string,
  moduleCode: string,
  courseModule: CourseModule | null
): ModuleDraft {
  const lessons = new Map<number, LessonDraft>();

  if (courseModule?.slts) {
    courseModule.slts.forEach((slt, idx) => {
      if (slt.lesson) {
        lessons.set(idx + 1, serverLessonToDraft(slt.lesson));
      }
    });
  }

  // SLTs are locked once module is approved, pending_tx, or active (on-chain)
  const status = courseModule?.status?.toLowerCase();
  const sltsLocked = status === "approved" || status === "pending_tx" || status === "active" || status === "on_chain";

  return {
    courseId,
    moduleCode,
    title: courseModule?.title ?? "",
    description: courseModule?.description,
    imageUrl: courseModule?.imageUrl,
    videoUrl: courseModule?.videoUrl,
    // Normalize SLT indices to 1-based regardless of server values
    // This fixes off-by-one issues and prevents data loss during reorder
    slts: (courseModule?.slts ?? []).map((slt, idx) => ({
      ...serverSltToDraft(slt),
      moduleIndex: idx + 1,
    })),
    _sltsLocked: sltsLocked,
    assignment: courseModule?.assignment
      ? serverAssignmentToDraft(courseModule.assignment)
      : null,
    introduction: courseModule?.introduction
      ? serverIntroToDraft(courseModule.introduction)
      : null,
    lessons,
  };
}

function checkIsDirty(
  draft: ModuleDraft | null,
  serverState: CourseModule | null
): boolean {
  if (!draft) return false;

  if (!serverState) {
    return draft.title.trim().length > 0 || draft.slts.length > 0;
  }

  if (draft.title !== (serverState.title ?? "")) return true;
  if (draft.description !== (serverState.description ?? undefined)) return true;

  const serverSlts = serverState.slts ?? [];
  if (draft.slts.length !== serverSlts.length) return true;
  if (draft.slts.some((slt) => slt._isModified || slt._isNew || slt._isDeleted))
    return true;

  if (draft._deleteAssignment) return true;
  const hasServerAssignment = !!serverState.assignment;
  const hasDraftAssignment = !!draft.assignment;
  if (hasServerAssignment !== hasDraftAssignment) return true;
  if (draft.assignment?._isModified || draft.assignment?._isNew) return true;

  if (draft._deleteIntroduction) return true;
  const hasServerIntro = !!serverState.introduction;
  const hasDraftIntro = !!draft.introduction;
  if (hasServerIntro !== hasDraftIntro) return true;
  if (draft.introduction?._isModified || draft.introduction?._isNew)
    return true;

  if (draft.lessons.size > 0) {
    for (const lesson of draft.lessons.values()) {
      if (lesson._isModified || lesson._isNew) return true;
    }
  }

  return false;
}

// =============================================================================
// Store Factory
// =============================================================================

function createModuleDraftStore(
  courseId: string,
  moduleCode: string
): StoreApi<ModuleDraftStore> {
  return createStore<ModuleDraftStore>((set, get) => ({
    // Initial state
    courseId,
    moduleCode,
    isNewModule: false,
    serverState: null,
    draft: null,
    isDirty: false,
    isSaving: false,
    lastError: null,
    lastSaveResult: null,

    // ---------------------------------------------------------------------------
    // Initialize
    // ---------------------------------------------------------------------------

    initialize: (serverData, isNewModule) => {
      const { courseId, moduleCode } = get();
      const draft = createDraftFromServer(courseId, moduleCode, serverData);

      set({
        isNewModule,
        serverState: serverData,
        draft,
        isDirty: false,
        lastError: null,
        lastSaveResult: null,
      });
    },

    // ---------------------------------------------------------------------------
    // Metadata Updates
    // ---------------------------------------------------------------------------

    setMetadata: (title, description) => {
      const { draft, serverState } = get();
      if (!draft) return;

      const newDraft = { ...draft, title, description };
      set({
        draft: newDraft,
        isDirty: checkIsDirty(newDraft, serverState),
      });
    },

    // ---------------------------------------------------------------------------
    // SLT Updates
    // ---------------------------------------------------------------------------

    addSlt: (text) => {
      const { draft, serverState } = get();
      if (!draft) {
        console.warn("[ModuleDraftStore] addSlt called but draft is null");
        return;
      }

      const nextIndex = draft.slts.length + 1;
      const newSlt: SLTDraft = {
        _localId: generateLocalId("slt"),
        sltText: text,
        moduleIndex: nextIndex,
        _isNew: true,
        _isModified: false,
        _isDeleted: false,
      };

      const newDraft = { ...draft, slts: [...draft.slts, newSlt] };
      console.log("[ModuleDraftStore] addSlt:", { text, newSltCount: newDraft.slts.length });
      set({
        draft: newDraft,
        isDirty: checkIsDirty(newDraft, serverState),
      });
    },

    updateSlt: (moduleIndex, text) => {
      const { draft, serverState } = get();
      if (!draft) return;

      const newSlts = draft.slts.map((slt) =>
        slt.moduleIndex === moduleIndex
          ? { ...slt, sltText: text, _isModified: !slt._isNew }
          : slt
      );

      const newDraft = { ...draft, slts: newSlts };
      set({
        draft: newDraft,
        isDirty: checkIsDirty(newDraft, serverState),
      });
    },

    deleteSlt: (moduleIndex) => {
      const { draft, serverState } = get();
      if (!draft) return;

      const newSlts = draft.slts
        .map((slt) => {
          if (slt.moduleIndex !== moduleIndex) return slt;
          if (slt._isNew) return null;
          return { ...slt, _isDeleted: true };
        })
        .filter((slt): slt is SLTDraft => slt !== null)
        .reduce<SLTDraft[]>((acc, slt) => {
          if (slt._isDeleted) {
            acc.push(slt);
          } else {
            acc.push({
              ...slt,
              moduleIndex: acc.filter((s) => !s._isDeleted).length + 1,
            });
          }
          return acc;
        }, []);

      const newDraft = { ...draft, slts: newSlts };
      set({
        draft: newDraft,
        isDirty: checkIsDirty(newDraft, serverState),
      });
    },

    reorderSlts: (newOrder) => {
      const { draft, serverState } = get();
      if (!draft) return;

      const sltMap = new Map(draft.slts.map((slt) => [slt.moduleIndex, slt]));
      const reorderedSlts: SLTDraft[] = [];

      newOrder.forEach((oldIndex, newIndex) => {
        const slt = sltMap.get(oldIndex);
        if (slt) {
          reorderedSlts.push({
            ...slt,
            moduleIndex: newIndex + 1,
            _isModified: !slt._isNew,
          });
        }
      });

      const newDraft: ModuleDraft = { ...draft, slts: reorderedSlts };
      set({
        draft: newDraft,
        isDirty: checkIsDirty(newDraft, serverState),
      });
    },

    // ---------------------------------------------------------------------------
    // Assignment Updates
    // ---------------------------------------------------------------------------

    setAssignment: (data) => {
      const { draft, serverState } = get();
      if (!draft) return;

      let newAssignment: AssignmentDraft | null = null;
      let deleteAssignment = false;

      if (data !== null) {
        const existingAssignment = draft.assignment;
        const isNew = !existingAssignment?.id && !serverState?.assignment;

        newAssignment = {
          ...data,
          _isNew: isNew,
          _isModified: !isNew,
        };
      } else {
        if (serverState?.assignment) {
          deleteAssignment = true;
        }
      }

      const newDraft = {
        ...draft,
        assignment: newAssignment,
        _deleteAssignment: deleteAssignment,
      };

      set({
        draft: newDraft,
        isDirty: checkIsDirty(newDraft, serverState),
      });
    },

    // ---------------------------------------------------------------------------
    // Introduction Updates
    // ---------------------------------------------------------------------------

    setIntroduction: (data) => {
      const { draft, serverState } = get();
      if (!draft) return;

      let newIntro: IntroDraft | null = null;
      let deleteIntroduction = false;

      if (data !== null) {
        const existingIntro = draft.introduction;
        const isNew = !existingIntro?.id && !serverState?.introduction;

        newIntro = {
          ...data,
          _isNew: isNew,
          _isModified: !isNew,
        };
      } else {
        if (serverState?.introduction) {
          deleteIntroduction = true;
        }
      }

      const newDraft = {
        ...draft,
        introduction: newIntro,
        _deleteIntroduction: deleteIntroduction,
      };

      set({
        draft: newDraft,
        isDirty: checkIsDirty(newDraft, serverState),
      });
    },

    // ---------------------------------------------------------------------------
    // Lesson Updates
    // ---------------------------------------------------------------------------

    setLesson: (sltIndex, data) => {
      const { draft, serverState } = get();
      if (!draft) return;

      const newLessons = new Map(draft.lessons);

      if (data === null) {
        newLessons.delete(sltIndex);
      } else {
        const existingLesson = draft.lessons.get(sltIndex);
        const isNew = !existingLesson?.id;

        newLessons.set(sltIndex, {
          ...data,
          sltIndex,
          _isNew: isNew,
          _isModified: !isNew,
        });
      }

      const newDraft = { ...draft, lessons: newLessons };
      set({
        draft: newDraft,
        isDirty: checkIsDirty(newDraft, serverState),
      });
    },

    // ---------------------------------------------------------------------------
    // Persistence
    // ---------------------------------------------------------------------------

    save: async (saveFn) => {
      const { draft, isDirty } = get();

      if (!draft || !isDirty) {
        console.log("[ModuleDraftStore] save: nothing to save", { hasDraft: !!draft, isDirty });
        return true;
      }

      console.log("[ModuleDraftStore] save: starting save", {
        moduleCode: draft.moduleCode,
        sltCount: draft.slts.length,
        slts: draft.slts.map(s => ({ index: s.moduleIndex, text: s.sltText?.slice(0, 30), isNew: s._isNew })),
        hasAssignment: !!draft.assignment,
      });

      set({ isSaving: true, lastError: null });

      try {
        const result = await saveFn(draft);

        if (result.success) {
          set({
            isSaving: false,
            lastSaveResult: result,
          });
          return true;
        } else {
          set({
            isSaving: false,
            lastError: result.error ?? "Save failed",
            lastSaveResult: result,
          });
          return false;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Save failed";
        set({
          isSaving: false,
          lastError: errorMessage,
          lastSaveResult: { success: false, error: errorMessage },
        });
        return false;
      }
    },

    markClean: () => {
      const { draft } = get();
      if (!draft) return;

      // Reset all modification flags on SLTs
      const cleanSlts = draft.slts
        .filter((slt) => !slt._isDeleted) // Remove deleted ones
        .map((slt) => ({
          ...slt,
          _isNew: false,
          _isModified: false,
          _isDeleted: false,
        }));

      // Reset assignment flags
      const cleanAssignment = draft.assignment
        ? { ...draft.assignment, _isNew: false, _isModified: false }
        : null;

      // Reset introduction flags
      const cleanIntro = draft.introduction
        ? { ...draft.introduction, _isNew: false, _isModified: false }
        : null;

      // Reset lesson flags
      const cleanLessons = new Map<number, LessonDraft>();
      draft.lessons.forEach((lesson, key) => {
        cleanLessons.set(key, { ...lesson, _isNew: false, _isModified: false });
      });

      const cleanDraft: ModuleDraft = {
        ...draft,
        slts: cleanSlts,
        // Preserve _sltsLocked from the original draft
        _sltsLocked: draft._sltsLocked,
        assignment: cleanAssignment,
        introduction: cleanIntro,
        lessons: cleanLessons,
        _deleteAssignment: undefined,
        _deleteIntroduction: undefined,
      };

      // Update serverState to match clean draft (for future dirty checks)
      // Convert draft back to CourseModule-like shape for serverState
      // Preserve status based on _sltsLocked flag
      const { serverState } = get();
      const newServerState: CourseModule = {
        sltHash: serverState?.sltHash ?? "",
        courseId: draft.courseId,
        status: draft._sltsLocked ? (serverState?.status ?? "approved") : "draft",
        moduleCode: draft.moduleCode,
        title: draft.title,
        description: draft.description,
        imageUrl: draft.imageUrl,
        videoUrl: draft.videoUrl,
        slts: cleanSlts.map((slt) => ({
          id: slt.id,
          sltText: slt.sltText,
          moduleIndex: slt.moduleIndex,
        })),
        assignment: cleanAssignment
          ? {
              id: cleanAssignment.id,
              title: cleanAssignment.title,
              description: cleanAssignment.description,
              contentJson: cleanAssignment.contentJson,
              imageUrl: cleanAssignment.imageUrl,
              videoUrl: cleanAssignment.videoUrl,
            }
          : null,
        introduction: cleanIntro
          ? {
              id: cleanIntro.id,
              title: cleanIntro.title,
              description: cleanIntro.description,
              contentJson: cleanIntro.contentJson,
              imageUrl: cleanIntro.imageUrl,
              videoUrl: cleanIntro.videoUrl,
            }
          : null,
      };

      set({
        draft: cleanDraft,
        serverState: newServerState,
        isDirty: false,
        isNewModule: false, // After first save, it's no longer new
      });
    },

    discard: () => {
      const { courseId, moduleCode, serverState } = get();
      const draft = createDraftFromServer(courseId, moduleCode, serverState);

      set({
        draft,
        isDirty: false,
        lastError: null,
      });
    },

    updateLockState: (status) => {
      const { draft } = get();
      if (!draft) return;

      const statusLower = status?.toLowerCase();
      const sltsLocked = statusLower === "approved" || statusLower === "pending_tx" || statusLower === "active" || statusLower === "on_chain";

      // Only update if the lock state changed
      if (draft._sltsLocked !== sltsLocked) {
        console.log("[ModuleDraftStore] updateLockState:", { status, sltsLocked });
        set({
          draft: { ...draft, _sltsLocked: sltsLocked },
        });
      }
    },
  }));
}

// =============================================================================
// Store Registry (Module-Scoped Stores)
// =============================================================================

const storeRegistry = new Map<string, StoreApi<ModuleDraftStore>>();

function getStoreKey(courseId: string, moduleCode: string): string {
  return `${courseId}:${moduleCode}`;
}

/**
 * Get or create a module draft store for the given course/module.
 * Stores are cached and reused for the same courseId:moduleCode combination.
 */
export function getModuleDraftStore(
  courseId: string,
  moduleCode: string
): StoreApi<ModuleDraftStore> {
  const key = getStoreKey(courseId, moduleCode);

  if (!storeRegistry.has(key)) {
    storeRegistry.set(key, createModuleDraftStore(courseId, moduleCode));
  }

  return storeRegistry.get(key)!;
}

/**
 * Clear a specific module's store from the registry.
 * Useful when navigating away or when the module is deleted.
 */
export function clearModuleDraftStore(
  courseId: string,
  moduleCode: string
): void {
  const key = getStoreKey(courseId, moduleCode);
  storeRegistry.delete(key);
}

/**
 * Clear all module draft stores.
 * Useful for logout or full app reset.
 */
export function clearAllModuleDraftStores(): void {
  storeRegistry.clear();
}

// =============================================================================
// React Hook for Module Draft Store
// =============================================================================

/**
 * Hook to use a module-scoped draft store.
 * Creates or retrieves an existing store for the courseId:moduleCode combination.
 *
 * @example
 * ```tsx
 * function ModuleEditor({ courseId, moduleCode }: Props) {
 *   const store = useModuleDraftStore(courseId, moduleCode);
 *   const draft = useStore(store, (s) => s.draft);
 *   const addSlt = useStore(store, (s) => s.addSlt);
 *
 *   return <button onClick={() => addSlt("New SLT")}>Add SLT</button>;
 * }
 * ```
 */
export function useModuleDraftStore(
  courseId: string,
  moduleCode: string
): StoreApi<ModuleDraftStore> {
  return getModuleDraftStore(courseId, moduleCode);
}

// =============================================================================
// Selectors (for use with useStore)
// =============================================================================

// Stable empty values to prevent infinite re-renders
const EMPTY_SLTS: SLTDraft[] = [];
const EMPTY_LESSONS = new Map<number, LessonDraft>();

export const selectDraft = (state: ModuleDraftStore) => state.draft;
export const selectIsDirty = (state: ModuleDraftStore) => state.isDirty;
export const selectIsSaving = (state: ModuleDraftStore) => state.isSaving;
export const selectLastError = (state: ModuleDraftStore) => state.lastError;
export const selectSlts = (state: ModuleDraftStore) =>
  state.draft?.slts ?? EMPTY_SLTS;
export const selectAssignment = (state: ModuleDraftStore) =>
  state.draft?.assignment ?? null;
export const selectIntroduction = (state: ModuleDraftStore) =>
  state.draft?.introduction ?? null;
export const selectLessons = (state: ModuleDraftStore) =>
  state.draft?.lessons ?? EMPTY_LESSONS;

// Action selectors (these are stable - no memoization needed)
export const selectInitialize = (state: ModuleDraftStore) => state.initialize;
export const selectSetMetadata = (state: ModuleDraftStore) => state.setMetadata;
export const selectAddSlt = (state: ModuleDraftStore) => state.addSlt;
export const selectUpdateSlt = (state: ModuleDraftStore) => state.updateSlt;
export const selectDeleteSlt = (state: ModuleDraftStore) => state.deleteSlt;
export const selectReorderSlts = (state: ModuleDraftStore) => state.reorderSlts;
export const selectSetAssignment = (state: ModuleDraftStore) =>
  state.setAssignment;
export const selectSetIntroduction = (state: ModuleDraftStore) =>
  state.setIntroduction;
export const selectSetLesson = (state: ModuleDraftStore) => state.setLesson;
export const selectSave = (state: ModuleDraftStore) => state.save;
export const selectMarkClean = (state: ModuleDraftStore) => state.markClean;
export const selectDiscard = (state: ModuleDraftStore) => state.discard;
export const selectUpdateLockState = (state: ModuleDraftStore) => state.updateLockState;

// Re-export types
export type {
  ModuleDraft,
  SLTDraft,
  AssignmentDraft,
  IntroDraft,
  LessonDraft,
  SaveModuleDraftResult,
};
export { generateLocalId } from "./types";

// Re-export useStore for convenience
export { useStore } from "zustand";
