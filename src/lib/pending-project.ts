/**
 * Utility for managing the pending project title in sessionStorage.
 *
 * Used during the project creation flow when users detour to create
 * a course before finishing their project.
 */

const STORAGE_KEY = "pendingProjectTitle";

export const pendingProject = {
  /** Get the pending project title, or null if none */
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(STORAGE_KEY);
  },

  /** Set the pending project title */
  set: (title: string): void => {
    sessionStorage.setItem(STORAGE_KEY, title);
  },

  /** Clear the pending project title */
  clear: (): void => {
    sessionStorage.removeItem(STORAGE_KEY);
  },
};
