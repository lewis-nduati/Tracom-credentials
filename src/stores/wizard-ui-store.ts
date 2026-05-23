/**
 * Wizard UI Store
 *
 * Zustand store for UI-only state in the module wizard.
 * Does NOT hold any server/domain data - that belongs in React Query.
 *
 * This follows the expert pattern: Zustand for UI state, React Query for server state.
 */

import { create } from "zustand";

interface WizardUIState {
  // Panel state
  isOutlineCollapsed: boolean;

  // Actions
  setOutlineCollapsed: (collapsed: boolean) => void;
  toggleOutline: () => void;
  reset: () => void;
}

const initialState = {
  isOutlineCollapsed: false,
};

export const useWizardUIStore = create<WizardUIState>((set) => ({
  ...initialState,

  setOutlineCollapsed: (collapsed) => set({ isOutlineCollapsed: collapsed }),

  toggleOutline: () =>
    set((state) => ({ isOutlineCollapsed: !state.isOutlineCollapsed })),

  reset: () => set(initialState),
}));
