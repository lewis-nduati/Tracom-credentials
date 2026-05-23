/**
 * Zustand Stores Index
 *
 * Central export for all Zustand stores.
 *
 * Architecture:
 * - UI stores: Global singletons for app-wide UI state
 * - Data stores: Factory pattern for scoped instances (per-entity)
 */

// UI Stores (global singletons)
export { useWizardUIStore } from "./wizard-ui-store";

// Transaction Watcher Store (vanilla Zustand — module-level singleton)
export {
  txWatcherStore,
  type TxToastConfig,
  type WatchedTransaction,
  type TxWatcherStore,
} from "./tx-watcher-store";

// Data Stores (scoped per entity)
export {
  useModuleDraftStore,
  getModuleDraftStore,
  clearModuleDraftStore,
  clearAllModuleDraftStores,
  useStore,
  // Selectors
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
  selectDiscard,
  // Types
  type ModuleDraftStore,
  type ModuleDraft,
  type SLTDraft,
  type AssignmentDraft,
  type IntroDraft,
  type LessonDraft,
  type SaveModuleDraftResult,
} from "./module-draft-store";
