"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useCourse, type Course } from "./use-course";
import {
  useTeacherCourseModules,
  type CourseModule,
  type SLT,
  type Lesson,
} from "./use-course-module";
import type { WizardData, StepCompletion } from "~/components/studio/wizard/types";

interface UseModuleWizardDataProps {
  courseId: string;
  moduleCode: string;
  isNewModule: boolean;
  onDataLoaded?: (course: Course | null, courseModule: CourseModule | null) => void;
}

interface UseModuleWizardDataReturn {
  data: WizardData;
  completion: StepCompletion;
  refetchData: (moduleCodeOverride?: string) => Promise<void>;
  updateSlts: (slts: SLT[]) => void;
}

/**
 * Hook for fetching and managing module wizard data
 *
 * Uses the teacher course-modules/list endpoint which returns module data
 * with ALL embedded content: SLTs, assignments, introductions, and lessons.
 *
 * The teacher endpoint embeds lesson data directly in each SLT object,
 * so no separate lesson fetching is required.
 *
 * Note: The /course/user/* endpoints only work for on-chain (published) modules.
 * For the teacher studio, we use /course/teacher/* endpoints instead.
 */
export function useModuleWizardData({
  courseId,
  moduleCode,
  isNewModule,
  onDataLoaded,
}: UseModuleWizardDataProps): UseModuleWizardDataReturn {
  // Track effective module code (supports override after creation)
  const [effectiveModuleCode, setEffectiveModuleCode] = useState(moduleCode);
  const effectiveIsNewModule = isNewModule && effectiveModuleCode === moduleCode;

  // Use ref for callback to prevent dependency loop
  const onDataLoadedRef = useRef(onDataLoaded);
  onDataLoadedRef.current = onDataLoaded;

  // Track if we've notified onDataLoaded to avoid duplicate calls
  const hasNotifiedRef = useRef(false);

  // Local SLT state for optimistic updates (synced from courseModule.slts)
  const [optimisticSlts, setOptimisticSlts] = useState<SLT[] | null>(null);

  // ==========================================================================
  // Compose existing hooks
  // ==========================================================================

  // Course data (always fetch)
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useCourse(courseId);

  // Teacher modules - returns ALL data including SLTs, assignments, introductions
  // This endpoint works for both draft and published modules
  const {
    data: teacherModules,
    isLoading: modulesLoading,
    error: modulesError,
    refetch: refetchModules,
  } = useTeacherCourseModules(courseId);

  // ==========================================================================
  // Derived data
  // ==========================================================================

  // Find specific module from teacher modules list
  const courseModule = useMemo(() => {
    if (effectiveIsNewModule || !teacherModules) return null;
    return teacherModules.find((m) => m.moduleCode === effectiveModuleCode) ?? null;
  }, [teacherModules, effectiveModuleCode, effectiveIsNewModule]);

  // Get SLTs from the course module (embedded in teacher endpoint response)
  // Wrapped in useMemo to ensure stable reference for dependent hooks
  const sltsFromModule = useMemo(() => {
    return courseModule?.slts ?? [];
  }, [courseModule?.slts]);

  // Use optimistic SLTs if set, otherwise use module data
  const slts = useMemo(() => {
    return optimisticSlts ?? sltsFromModule;
  }, [optimisticSlts, sltsFromModule]);

  // Clear optimistic SLTs when module data updates (sync complete)
  useEffect(() => {
    if (sltsFromModule.length > 0 && optimisticSlts) {
      setOptimisticSlts(null);
    }
  }, [sltsFromModule, optimisticSlts]);

  // ==========================================================================
  // Extract lessons from embedded SLT data
  // ==========================================================================

  // Lessons are embedded in the SLT objects from the teacher endpoint
  const lessons = useMemo(() => {
    const lessonMap = new Map<number, Lesson>();

    // Extract embedded lessons from SLTs
    // The teacher endpoint embeds lesson data directly in each SLT object
    slts.forEach((slt, idx) => {
      if (slt.lesson) {
        const normalizedIndex = idx + 1;
        lessonMap.set(normalizedIndex, { ...slt.lesson, sltIndex: normalizedIndex });
      }
    });

    return Array.from(lessonMap.values());
  }, [slts]);

  // Assignment is embedded in the course module
  const assignment = courseModule?.assignment ?? null;

  // Introduction is embedded in the course module
  const introduction = courseModule?.introduction ?? null;

  // ==========================================================================
  // Loading and error states
  // ==========================================================================

  const isLoading = effectiveIsNewModule
    ? courseLoading
    : courseLoading || modulesLoading;

  const error = courseError?.message ?? modulesError?.message ?? null;

  // ==========================================================================
  // Build WizardData
  // ==========================================================================

  const data: WizardData = useMemo(
    () => ({
      course: course ?? null,
      courseModule,
      slts,
      assignment,
      introduction,
      lessons,
      isLoading,
      error,
    }),
    [course, courseModule, slts, assignment, introduction, lessons, isLoading, error]
  );

  // ==========================================================================
  // Notify onDataLoaded when data is ready
  // ==========================================================================

  useEffect(() => {
    if (!isLoading && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onDataLoadedRef.current?.(course ?? null, courseModule);
    }
  }, [isLoading, course, courseModule]);

  // Reset notification flag when module code changes
  useEffect(() => {
    hasNotifiedRef.current = false;
  }, [effectiveModuleCode]);

  // ==========================================================================
  // Calculate step completion
  // ==========================================================================

  const completion = useMemo<StepCompletion>(() => {
    const hasTitle = !!courseModule?.title?.trim();
    const hasSLTs = slts.length > 0;
    // Assignment must have a saved title to be considered complete
    const hasAssignment = !!(
      assignment &&
      (
        typeof assignment.id === "number" ||
        (typeof assignment.title === "string" && assignment.title.trim().length > 0)
      )
    );
    const hasIntroduction = !!introduction;

    return {
      credential: hasTitle,
      slts: hasSLTs,
      assignment: hasAssignment,
      lessons: true, // Optional step
      introduction: hasIntroduction,
      review: hasTitle && hasSLTs && hasAssignment && hasIntroduction,
    };
  }, [courseModule, slts, assignment, introduction]);

  // ==========================================================================
  // Refetch function (supports module code override for creation flow)
  // ==========================================================================

  const refetchData = useCallback(
    async (moduleCodeOverride?: string) => {
      if (moduleCodeOverride) {
        // Update effective module code - hooks will automatically refetch
        setEffectiveModuleCode(moduleCodeOverride);
        hasNotifiedRef.current = false;
      }

      // Trigger refetch of teacher modules (contains all embedded data including lessons)
      await refetchModules();
    },
    [refetchModules]
  );

  // ==========================================================================
  // Optimistic SLT update (for immediate UI feedback)
  // ==========================================================================

  const updateSlts = useCallback((newSlts: SLT[]) => {
    setOptimisticSlts(newSlts);
  }, []);

  return {
    data,
    completion,
    refetchData,
    updateSlts,
  };
}
