"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { WizardStepId, StepCompletion, StepStatus } from "~/components/studio/wizard/types";

const STEP_ORDER: WizardStepId[] = [
  "credential",
  "slts",
  "assignment",
  "lessons",
  "introduction",
  "review",
];

interface UseWizardNavigationProps {
  completion: StepCompletion;
}

interface UseWizardNavigationReturn {
  currentStep: WizardStepId;
  direction: number;
  currentIndex: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  goToStep: (step: WizardStepId) => void;
  goNext: () => void;
  goPrevious: () => void;
  getStepStatus: (step: WizardStepId) => StepStatus;
  isStepUnlocked: (step: WizardStepId) => boolean;
}

/**
 * Hook for managing wizard step navigation with URL sync
 *
 * Features:
 * - URL-based step persistence (?step=credential)
 * - Step unlock logic based on completion state
 * - Direction tracking for animations
 */
export function useWizardNavigation({
  completion,
}: UseWizardNavigationProps): UseWizardNavigationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current step from URL or default to credential
  const urlStep = searchParams.get("step") as WizardStepId | null;
  const [currentStep, setCurrentStep] = useState<WizardStepId>(
    urlStep && STEP_ORDER.includes(urlStep) ? urlStep : "credential"
  );
  const [direction, setDirection] = useState(0);

  /**
   * Check if a step is unlocked
   *
   * All steps are always unlocked - wizard navigation is free-form.
   * The completion state is used for visual indicators only, not for locking.
   */
  const isStepUnlocked = useCallback(
    (_step: WizardStepId): boolean => {
      // All steps are always unlocked - free navigation
      return true;
    },
    []
  );

  /**
   * Navigate to a specific step
   */
  const goToStep = useCallback(
    (step: WizardStepId) => {
      if (!isStepUnlocked(step)) return;

      const currentIndex = STEP_ORDER.indexOf(currentStep);
      const targetIndex = STEP_ORDER.indexOf(step);
      setDirection(targetIndex > currentIndex ? 1 : -1);
      setCurrentStep(step);

      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", step);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [currentStep, isStepUnlocked, pathname, router, searchParams]
  );

  /**
   * Navigate to next step
   */
  const goNext = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1]!;
      if (isStepUnlocked(nextStep)) {
        goToStep(nextStep);
      }
    }
  }, [currentStep, goToStep, isStepUnlocked]);

  /**
   * Navigate to previous step
   */
  const goPrevious = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      goToStep(STEP_ORDER[currentIndex - 1]!);
    }
  }, [currentStep, goToStep]);

  /**
   * Get the visual status of a step
   */
  const getStepStatus = useCallback(
    (step: WizardStepId): StepStatus => {
      if (step === currentStep) return "current";
      if (completion[step]) return "completed";
      if (isStepUnlocked(step)) return "available";
      return "locked";
    },
    [currentStep, completion, isStepUnlocked]
  );

  // Compute navigation state
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const canGoNext = useMemo(() => {
    if (currentIndex >= STEP_ORDER.length - 1) return false;
    const nextStep = STEP_ORDER[currentIndex + 1];
    return nextStep ? isStepUnlocked(nextStep) : false;
  }, [currentIndex, isStepUnlocked]);

  const canGoPrevious = currentIndex > 0;

  return {
    currentStep,
    direction,
    currentIndex,
    canGoNext,
    canGoPrevious,
    goToStep,
    goNext,
    goPrevious,
    getStepStatus,
    isStepUnlocked,
  };
}

export { STEP_ORDER };
