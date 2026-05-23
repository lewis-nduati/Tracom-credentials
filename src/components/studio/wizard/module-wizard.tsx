"use client";

import React, { useContext, useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { WizardStepper, WIZARD_STEPS } from "./wizard-stepper";
import { WizardHeader } from "./wizard-navigation";
import { AndamioStudioLoading } from "~/components/andamio/andamio-loading";
import {
  WizardContext,
  type WizardStepId,
  type StepStatus,
  type StepCompletion,
  type WizardData,
  type WizardContextValue,
} from "./types";
import {
  type Course,
  type CourseModule,
  type SLT,
  type Assignment,
  type Introduction,
  type Lesson,
  transformCourseModule,
  transformSLT,
  transformLesson,
  transformAssignment,
} from "~/hooks/api";
// Note: Raw generated types no longer needed - using transformed types from hooks

// Step components (will be created next)
import { StepCredential } from "./steps/step-credential";
import { StepSLTs } from "./steps/step-slts";
import { StepAssignment } from "./steps/step-assignment";
import { StepLessons } from "./steps/step-lessons";
import { StepIntroduction } from "./steps/step-introduction";
import { StepReview } from "./steps/step-review";
import { GATEWAY_API_BASE } from "~/lib/api-utils";

/**
 * Hook to access wizard context
 */
export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within ModuleWizard or WizardContext.Provider");
  }
  return context;
}

/**
 * Step order for navigation
 */
const STEP_ORDER: WizardStepId[] = [
  "credential",
  "slts",
  "assignment",
  "lessons",
  "introduction",
  "review",
];

interface ModuleWizardProps {
  courseId: string;
  moduleCode: string;
  course: Course | null;
  courseModule: CourseModule | null;
  onExitWizard: () => void;
  isNewModule?: boolean;
}

/**
 * ModuleWizard - Main wizard container
 *
 * Orchestrates the backwards design flow:
 * Credential → SLTs → Assignment → Lessons → Introduction → Review
 */
export function ModuleWizard({
  courseId,
  moduleCode,
  course,
  courseModule,
  onExitWizard,
  isNewModule = false,
}: ModuleWizardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Current step from URL or default
  const urlStep = searchParams.get("step") as WizardStepId | null;
  const [currentStep, setCurrentStep] = useState<WizardStepId>(
    urlStep && STEP_ORDER.includes(urlStep) ? urlStep : "credential"
  );
  const [direction, setDirection] = useState(0);

  // Data state
  const [data, setData] = useState<WizardData>({
    course,
    courseModule,
    slts: [],
    assignment: null,
    introduction: null,
    lessons: [],
    isLoading: true,
    error: null,
  });

  /**
   * Fetch all wizard data
   *
   * @deprecated This legacy wizard should use useModuleWizardData hook instead.
   * The split-pane wizard at [modulecode]/page.tsx uses hooks for proper caching.
   */
  const fetchWizardData = useCallback(async () => {
    // For new modules, no data to fetch - just set loading to false
    if (isNewModule) {
      setData((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch SLTs - Go API: GET /course/user/slts/{course_id}/{course_module_code}
      const sltsResponse = await fetch(
        `${GATEWAY_API_BASE}/course/user/slts/${courseId}/${moduleCode}`
      );
      let slts: SLT[] = [];
      if (sltsResponse.ok) {
        const rawSlts = (await sltsResponse.json()) as unknown[];
        slts = Array.isArray(rawSlts)
          ? rawSlts.map((raw) => transformSLT(raw as Record<string, unknown>))
          : [];
      }

      // Fetch assignment - Go API: GET /course/user/assignment/{course_id}/{course_module_code}
      const assignmentResponse = await fetch(
        `${GATEWAY_API_BASE}/course/user/assignment/${courseId}/${moduleCode}`
      );
      let assignment: Assignment | null = null;
      if (assignmentResponse.ok) {
        const assignmentResult = (await assignmentResponse.json()) as Record<string, unknown> | { data?: Record<string, unknown> };
        // Handle both wrapped { data: {...} } and raw object formats
        if (assignmentResult && typeof assignmentResult === "object") {
          if ("data" in assignmentResult && assignmentResult.data) {
            assignment = transformAssignment(assignmentResult.data as Record<string, unknown>);
            console.log("[ModuleWizard] Assignment response was wrapped, unwrapped:", assignment);
          } else if ("title" in assignmentResult || "content_json" in assignmentResult) {
            assignment = transformAssignment(assignmentResult);
            console.log("[ModuleWizard] Assignment response (raw):", assignment);
          } else {
            console.log("[ModuleWizard] Assignment response has unexpected shape:", assignmentResult);
          }
        }
      }

      // Fetch lessons per SLT (no batch endpoint exists)
      const lessons = await Promise.all(
        slts.map(async (slt, index) => {
          const sltIndex = slt.moduleIndex ?? index + 1;
          try {
            const lessonResponse = await fetch(
              `${GATEWAY_API_BASE}/course/user/lesson/${courseId}/${moduleCode}/${sltIndex}`
            );

            if (lessonResponse.status === 404) {
              return null;
            }

            if (!lessonResponse.ok) {
              console.warn(
                "[ModuleWizard] Failed to fetch lesson:",
                lessonResponse.statusText
              );
              return null;
            }

            const lessonResult = (await lessonResponse.json()) as unknown;
            let rawLesson: Record<string, unknown> | null = null;
            if (lessonResult && typeof lessonResult === "object") {
              if ("data" in lessonResult && (lessonResult as { data?: unknown }).data) {
                rawLesson = (lessonResult as { data: Record<string, unknown> }).data;
              } else if (
                "title" in lessonResult ||
                "content_json" in lessonResult ||
                "slt_index" in lessonResult
              ) {
                rawLesson = lessonResult as Record<string, unknown>;
              }
            }

            if (rawLesson) {
              const lesson = transformLesson(rawLesson);
              // Inject sltIndex from URL since API doesn't return it
              if (lesson.sltIndex === undefined) {
                lesson.sltIndex = sltIndex;
              }
              return lesson;
            }
            return null;
          } catch (error) {
            console.warn("[ModuleWizard] Lesson fetch error:", error);
            return null;
          }
        })
      );

      const resolvedLessons = lessons.filter((lesson): lesson is Lesson => lesson !== null);

      // Refetch module for latest status via list+filter (single-module GET was removed in V2)
      const moduleResponse = await fetch(
        `${GATEWAY_API_BASE}/course/user/modules/${courseId}`
      );
      let updatedModule: CourseModule | null = courseModule;
      if (moduleResponse.ok) {
        const moduleResult = (await moduleResponse.json()) as { data?: unknown[]; warning?: string };
        const allModules = (moduleResult.data ?? []).map(
          (raw) => transformCourseModule(raw as Parameters<typeof transformCourseModule>[0])
        );
        updatedModule = allModules.find((m) => m.moduleCode === moduleCode) ?? courseModule;
      }

      // Introduction data is embedded in the module response
      const introduction: Introduction | null = updatedModule?.introduction ?? null;
      console.log("[ModuleWizard] Introduction from module:", {
        hasIntroduction: !!introduction,
        title: introduction?.title,
      });

      setData({
        course,
        courseModule: updatedModule,
        slts,
        assignment,
        introduction,
        lessons: resolvedLessons,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error fetching wizard data:", err);
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load data",
      }));
    }
  }, [courseId, moduleCode, course, courseModule, isNewModule]);

  // Initial data fetch
  useEffect(() => {
    void fetchWizardData();
  }, [fetchWizardData]);

  /**
   * Calculate step completion
   * Note: We check for actual saved content (title with value) rather than just truthy objects
   * because the API may return empty/partial objects before content is saved
   */
  const completion = useMemo<StepCompletion>(() => {
    const hasTitle = !!data.courseModule?.title?.trim();
    const hasSLTs = data.slts.length > 0;
    // Assignment must have a saved title to be considered complete
    const hasAssignment = !!(data.assignment && typeof data.assignment.title === "string" && data.assignment.title.trim().length > 0);
    const hasIntroduction = !!data.introduction;

    return {
      credential: hasTitle,
      slts: hasSLTs,
      assignment: hasAssignment,
      lessons: true, // Always optional/completable
      introduction: hasIntroduction,
      review: hasTitle && hasSLTs && hasAssignment && hasIntroduction,
    };
  }, [data]);

  /**
   * Check if step is unlocked
   */
  const isStepUnlocked = useCallback(
    (step: WizardStepId): boolean => {
      switch (step) {
        case "credential":
          return true;
        case "slts":
          return completion.credential;
        case "assignment":
          return completion.slts;
        case "lessons":
          return completion.slts; // Can create lessons once SLTs exist
        case "introduction":
          return completion.assignment;
        case "review":
          return completion.introduction;
        default:
          return false;
      }
    },
    [completion]
  );

  /**
   * Get step status for visual display
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

  /**
   * Navigate to step
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
      const prevStep = STEP_ORDER[currentIndex - 1]!;
      goToStep(prevStep);
    }
  }, [currentStep, goToStep]);

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const canGoNext = currentIndex < STEP_ORDER.length - 1 && isStepUnlocked(STEP_ORDER[currentIndex + 1]!);
  const canGoPrevious = currentIndex > 0;

  /**
   * Update SLTs without triggering loading state
   * Used for optimistic updates from StepSLTs
   */
  const updateSlts = useCallback((slts: WizardData["slts"]) => {
    setData((prev) => ({ ...prev, slts }));
  }, []);

  /**
   * Context value
   * Note: createdModuleCode and onModuleCreated are only used in the split-pane wizard.
   * This legacy wizard uses router navigation for module creation.
   */
  const contextValue = useMemo<WizardContextValue>(
    () => ({
      currentStep,
      goToStep,
      goNext,
      goPrevious,
      canGoNext,
      canGoPrevious,
      getStepStatus,
      isStepUnlocked,
      completion,
      data,
      refetchData: fetchWizardData,
      updateSlts,
      courseId,
      moduleCode,
      isNewModule,
      createdModuleCode: null,
      onModuleCreated: () => {
        // Not used in legacy wizard - module creation uses router navigation
        return Promise.resolve();
      },
    }),
    [
      currentStep,
      goToStep,
      goNext,
      goPrevious,
      canGoNext,
      canGoPrevious,
      getStepStatus,
      isStepUnlocked,
      completion,
      data,
      fetchWizardData,
      updateSlts,
      courseId,
      moduleCode,
      isNewModule,
    ]
  );

  // Loading state
  if (data.isLoading) {
    return <AndamioStudioLoading variant="split-pane" />;
  }

  const currentConfig = WIZARD_STEPS.find((s) => s.id === currentStep)!;

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="space-y-6">
        {/* Header with exit button */}
        <WizardHeader
          moduleTitle={data.courseModule?.title ?? undefined}
          onExitWizard={onExitWizard}
        />

        {/* Main wizard layout */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Stepper */}
          <WizardStepper
            currentStep={currentStep}
            getStepStatus={getStepStatus}
            onStepClick={goToStep}
          />

          {/* Step content */}
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait" custom={direction}>
              {currentStep === "credential" && (
                <StepCredential key="credential" config={currentConfig} direction={direction} />
              )}
              {currentStep === "slts" && (
                <StepSLTs key="slts" config={currentConfig} direction={direction} />
              )}
              {currentStep === "assignment" && (
                <StepAssignment key="assignment" config={currentConfig} direction={direction} />
              )}
              {currentStep === "lessons" && (
                <StepLessons key="lessons" config={currentConfig} direction={direction} />
              )}
              {currentStep === "introduction" && (
                <StepIntroduction key="introduction" config={currentConfig} direction={direction} />
              )}
              {currentStep === "review" && (
                <StepReview key="review" config={currentConfig} direction={direction} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </WizardContext.Provider>
  );
}
