import { createContext } from "react";
import type { IconComponent } from "~/types/ui";
import type {
  Course,
  CourseModule,
  SLT,
  Assignment,
  Introduction,
  Lesson,
} from "~/hooks/api";
import type {
  ModuleDraft,
  SLTDraft,
  AssignmentDraft,
  IntroDraft,
  LessonDraft,
} from "~/stores/module-draft-store";

/**
 * Wizard step identifiers
 */
export type WizardStepId =
  | "credential"
  | "slts"
  | "assignment"
  | "lessons"
  | "introduction"
  | "review";

/**
 * Step status for visual display
 */
export type StepStatus = "locked" | "available" | "current" | "completed";

/**
 * Configuration for each wizard step
 */
export interface WizardStepConfig {
  id: WizardStepId;
  title: string;
  subtitle: string;
  description: string;
  icon: IconComponent;
  optional?: boolean;
}

/**
 * Step completion state
 */
export interface StepCompletion {
  credential: boolean;
  slts: boolean;
  assignment: boolean;
  lessons: boolean;
  introduction: boolean;
  review: boolean;
}

/**
 * Data loaded for the wizard
 *
 * All types use camelCase fields from the hooks layer.
 */
export interface WizardData {
  course: Course | null;
  courseModule: CourseModule | null;
  slts: SLT[];
  assignment: Assignment | null;
  introduction: Introduction | null;
  lessons: Lesson[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Wizard context value
 */
export interface WizardContextValue {
  // Navigation
  currentStep: WizardStepId;
  goToStep: (step: WizardStepId) => void;
  goNext: () => void;
  goPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;

  // Step status
  getStepStatus: (step: WizardStepId) => StepStatus;
  isStepUnlocked: (step: WizardStepId) => boolean;
  completion: StepCompletion;

  // Data (legacy - from useModuleWizardData)
  data: WizardData;
  refetchData: (moduleCodeOverride?: string) => Promise<void>;
  updateSlts: (slts: WizardData["slts"]) => void;

  // Course identifiers
  courseId: string;
  moduleCode: string;

  // Creation mode
  isNewModule: boolean;

  // Module creation - allows smooth transition after creating a new module
  // without triggering a full page refresh from URL change
  createdModuleCode: string | null;
  onModuleCreated: (newModuleCode: string) => Promise<void>;

  // ==========================================================================
  // Draft Store (new architecture - optional during transition)
  // ==========================================================================

  // Draft state
  draft?: ModuleDraft | null;
  isDirty?: boolean;
  isSaving?: boolean;
  lastError?: string | null;

  // Draft selectors
  draftSlts?: SLTDraft[];
  draftAssignment?: AssignmentDraft | null;
  draftIntroduction?: IntroDraft | null;
  draftLessons?: Map<number, LessonDraft>;

  // Metadata actions
  setMetadata?: (title: string, description?: string) => void;

  // SLT actions
  addSlt?: (text: string) => void;
  updateSlt?: (moduleIndex: number, text: string) => void;
  deleteSlt?: (moduleIndex: number) => void;
  reorderSlts?: (newOrder: number[]) => void;

  // Content actions
  setAssignment?: (data: Omit<AssignmentDraft, "_isModified" | "_isNew"> | null) => void;
  setIntroduction?: (data: Omit<IntroDraft, "_isModified" | "_isNew"> | null) => void;
  setLesson?: (sltIndex: number, data: Omit<LessonDraft, "_isModified" | "_isNew" | "sltIndex"> | null) => void;

  // Persistence
  saveAndSync?: () => Promise<boolean>;
  discardChanges?: () => void;
}

/**
 * Wizard Context - shared between ModuleWizard and StudioModuleEditPage
 */
export const WizardContext = createContext<WizardContextValue | null>(null);

/**
 * Props for step components
 */
export interface WizardStepProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * Animation variants for Framer Motion
 *
 * Uses simple, fast transitions for high performance.
 * Avoid spring animations that feel sluggish.
 */
export const stepVariants = {
  enter: {
    opacity: 0,
  },
  center: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

export const stepTransition = {
  duration: 0.15,
  ease: "easeOut" as const,
};

/**
 * Completion animation for checkmarks
 */
export const checkmarkVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.15,
      ease: "easeOut" as const,
    },
  },
};

/**
 * Progress bar animation
 */
export const progressVariants = {
  initial: { width: "0%" },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
    },
  }),
};
