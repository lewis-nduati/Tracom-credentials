/**
 * Module Draft Hook (Refactored)
 *
 * Clean integration between module-scoped Zustand store and React Query.
 *
 * Key improvements over previous version:
 * - No _saveFn injection - save function passed as argument
 * - No useMemo hacks for stable action references
 * - No stale closure workarounds
 * - Store is module-scoped (supports multiple modules)
 *
 * @example
 * ```tsx
 * function ModuleWizard({ courseId, moduleCode }: Props) {
 *   const {
 *     draft,
 *     isDirty,
 *     isSaving,
 *     addSlt,
 *     saveAndSync,
 *   } = useModuleDraft(courseId, moduleCode, false);
 *
 *   const handleSave = async () => {
 *     await saveAndSync();
 *   };
 * }
 * ```
 */

import { useEffect, useCallback, useMemo, useRef } from "react";
import {
  useModuleDraftStore,
  useStore,
  selectDraft,
  selectIsDirty,
  selectIsSaving,
  selectLastError,
  selectSlts,
  selectAssignment,
  selectIntroduction,
  selectLessons,
  selectInitialize,
  selectSetMetadata,
  selectAddSlt,
  selectUpdateSlt,
  selectDeleteSlt,
  selectReorderSlts,
  selectSetAssignment,
  selectSetIntroduction,
  selectSetLesson,
  selectSave,
  selectMarkClean,
  selectDiscard,
  selectUpdateLockState,
  clearModuleDraftStore,
} from "~/stores/module-draft-store";
import { useTeacherCourseModules } from "~/hooks/api/course/use-course-module";
import { useSaveModuleDraft } from "~/hooks/api/course/use-save-module-draft";
import type { SaveModuleDraftResult } from "~/stores/module-draft-store";

interface UseModuleDraftOptions {
  /** Called when save succeeds */
  onSaveSuccess?: (result: SaveModuleDraftResult) => void;
  /** Called when save fails */
  onSaveError?: (error: string) => void;
}

export function useModuleDraft(
  courseId: string,
  moduleCode: string,
  isNewModule: boolean,
  options: UseModuleDraftOptions = {}
) {
  // Get module-scoped store (creates if doesn't exist)
  const store = useModuleDraftStore(courseId, moduleCode);

  // Subscribe to store state with selectors
  const draft = useStore(store, selectDraft);
  const isDirty = useStore(store, selectIsDirty);
  const isSaving = useStore(store, selectIsSaving);
  const lastError = useStore(store, selectLastError);
  const slts = useStore(store, selectSlts);
  const assignment = useStore(store, selectAssignment);
  const introduction = useStore(store, selectIntroduction);
  const lessons = useStore(store, selectLessons);

  // Get actions (these are stable - no memoization needed)
  const initialize = useStore(store, selectInitialize);
  const setMetadata = useStore(store, selectSetMetadata);
  const addSlt = useStore(store, selectAddSlt);
  const updateSlt = useStore(store, selectUpdateSlt);
  const deleteSlt = useStore(store, selectDeleteSlt);
  const reorderSlts = useStore(store, selectReorderSlts);
  const setAssignment = useStore(store, selectSetAssignment);
  const setIntroduction = useStore(store, selectSetIntroduction);
  const setLesson = useStore(store, selectSetLesson);
  const save = useStore(store, selectSave);
  const markClean = useStore(store, selectMarkClean);
  const discard = useStore(store, selectDiscard);
  const updateLockState = useStore(store, selectUpdateLockState);

  // React Query data (for initial load only - saves don't refetch)
  const { data: modules } = useTeacherCourseModules(courseId);

  // Save mutation (provides the actual API call)
  const saveModuleDraft = useSaveModuleDraft();

  // Track initialization
  const isInitializedRef = useRef(false);

  // Find the specific module from the list — memoized to produce a stable
  // reference so downstream useEffects don't re-fire on every render.
  const courseModule = useMemo(
    () => modules?.find((m) => m.moduleCode === moduleCode) ?? null,
    [modules, moduleCode],
  );

  // Initialize store when data is available
  useEffect(() => {
    // Skip if already initialized for this module
    if (isInitializedRef.current) {
      return;
    }

    // For new modules, initialize immediately with empty state
    if (isNewModule) {
      initialize(null, true);
      isInitializedRef.current = true;
      return;
    }

    // For existing modules, wait for data to load
    if (modules && courseModule) {
      initialize(courseModule, false);
      isInitializedRef.current = true;
    }
  }, [isNewModule, modules, courseModule, initialize]);

  // Reset initialization when module changes
  useEffect(() => {
    return () => {
      isInitializedRef.current = false;
    };
  }, [courseId, moduleCode]);

  // Update lock state when server status changes (e.g., after approval or return to draft)
  // This ensures _sltsLocked is updated without re-initializing the entire draft
  useEffect(() => {
    if (courseModule?.status) {
      console.log("[useModuleDraft] Server status changed:", courseModule.status);
      updateLockState(courseModule.status);
    }
  }, [courseModule?.status, updateLockState]);

  // Store options in ref to avoid stale closures in saveAndSync
  const optionsRef = useRef(options);
  optionsRef.current = options;

  /**
   * Save and sync with React Query
   *
   * This is the primary save function for components. It:
   * 1. Calls the store's save action with the mutation function
   * 2. On success, marks the draft as clean (no refetch needed - local state is correct)
   * 3. The mutation's onSuccess will invalidate React Query cache for background refresh
   */
  const saveAndSync = useCallback(async (): Promise<boolean> => {
    // Guard: cannot save a module that hasn't been created yet
    if (isNewModule) {
      console.warn("[saveAndSync] Cannot save draft for uncreated module");
      return false;
    }

    // Check current state directly from store (avoids stale closures)
    const currentState = store.getState();
    if (!currentState.isDirty) {
      return true; // Nothing to save
    }

    // Pass the mutation function to save - store doesn't hold it
    const success = await save(saveModuleDraft.mutateAsync);

    if (success) {
      // Mark the draft as clean - no need to refetch since local state is correct
      markClean();

      // Get result from store for callback
      const result = store.getState().lastSaveResult;
      if (result) {
        optionsRef.current.onSaveSuccess?.(result);
      }
    } else {
      const error = store.getState().lastError ?? "Save failed";
      optionsRef.current.onSaveError?.(error);
    }

    return success;
  }, [
    store,
    save,
    saveModuleDraft.mutateAsync,
    markClean,
    isNewModule,
  ]);

  /**
   * Discard changes and reset to server state
   */
  const discardChanges = useCallback(() => {
    discard();
  }, [discard]);

  /**
   * Clean up store when done (call on unmount if desired)
   */
  const cleanup = useCallback(() => {
    clearModuleDraftStore(courseId, moduleCode);
  }, [courseId, moduleCode]);

  return {
    // State
    draft,
    isDirty,
    isSaving,
    lastError,

    // Derived state
    slts,
    assignment,
    introduction,
    lessons,

    // Module context
    courseId,
    moduleCode,
    isNewModule,
    courseModule,

    // Actions (stable references from store)
    setMetadata,
    addSlt,
    updateSlt,
    deleteSlt,
    reorderSlts,
    setAssignment,
    setIntroduction,
    setLesson,

    // Persistence
    saveAndSync,
    discardChanges,
    cleanup,

    // Direct store access (for advanced use cases)
    store,
  };
}
