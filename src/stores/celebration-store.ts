import type React from "react";
import { create } from "zustand";

/**
 * Celebration configuration
 */
export interface CelebrationConfig {
  /** Title shown in the celebration (e.g., "Credential Earned!") */
  title: string;
  /** Description shown below the title */
  description?: string;
  /** Primary icon for the celebration (defaults to CelebrateIcon) */
  icon?: React.ReactNode;
  /** Optional action to take after celebration (e.g., "View Course") */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Duration in ms (default: 5000) */
  duration?: number;
}

interface CelebrationState {
  /** Current celebration config if active, null otherwise */
  active: CelebrationConfig | null;
  /** Trigger a new celebration */
  trigger: (config: CelebrationConfig) => void;
  /** Dismiss the current celebration */
  dismiss: () => void;
}

let timerId: ReturnType<typeof setTimeout> | null = null;

/**
 * Global store for managing UI celebrations.
 * Used for high-impact success feedback on "Moments of Commitment."
 */
export const useCelebrationStore = create<CelebrationState>((set) => ({
  active: null,
  trigger: (config) => {
    if (timerId) clearTimeout(timerId);
    set({ active: config });

    const duration = config.duration ?? 5000;
    if (duration !== Infinity) {
      timerId = setTimeout(() => {
        timerId = null;
        set({ active: null });
      }, duration);
    }
  },
  dismiss: () => {
    if (timerId) clearTimeout(timerId);
    timerId = null;
    set({ active: null });
  },
}));
