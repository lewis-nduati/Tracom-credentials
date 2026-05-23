"use client";

import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useStudioHeader } from "~/components/layout/studio-header";
import { useModuleWizardData } from "~/hooks/api/course/use-module-wizard-data";
import { useModuleDraft } from "~/hooks/use-module-draft";
import { useWizardNavigation } from "~/hooks/ui/use-wizard-navigation";
import { useWizardUIStore } from "~/stores/wizard-ui-store";
import { RequireCourseAccess } from "~/components/auth/require-course-access";
import {
  StudioOutlinePanel,
  MODULE_WIZARD_STEPS,
  type OutlineStep,
} from "~/components/studio/studio-outline-panel";
import { StudioEditorPane } from "~/components/studio/studio-editor-pane";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "~/components/andamio/andamio-resizable";
import {
  AndamioButton,
  AndamioAlert,
  AndamioAlertDescription,
  AndamioScrollArea,
  AndamioStudioLoading,
} from "~/components/andamio";
import {
  AlertIcon,
  SaveIcon,
  LoadingIcon,
} from "~/components/icons";
import type { Course, CourseModule } from "~/hooks/api";

// Import wizard step components
import { StepCredential } from "~/components/studio/wizard/steps/step-credential";
import { StepSLTs } from "~/components/studio/wizard/steps/step-slts";
import { StepAssignment } from "~/components/studio/wizard/steps/step-assignment";
import { StepLessons } from "~/components/studio/wizard/steps/step-lessons";
import { StepIntroduction } from "~/components/studio/wizard/steps/step-introduction";
import { StepReview } from "~/components/studio/wizard/steps/step-review";
import { WIZARD_STEPS } from "~/components/studio/wizard/wizard-stepper";
import { WizardSaveBar } from "~/components/studio/wizard/wizard-save-bar";
import {
  WizardContext,
  type WizardStepId,
  type WizardContextValue,
} from "~/components/studio/wizard/types";
import { useState } from "react";

/**
 * Module Wizard Content - The main wizard UI
 *
 * This component is rendered only after RequireCourseAccess
 * verifies the user has owner or teacher access to the course.
 */
function ModuleWizardContent({
  courseId,
  moduleCode,
  isNewModule,
}: {
  courseId: string;
  moduleCode: string;
  isNewModule: boolean;
}) {
  const { setBreadcrumbs, setTitle, setStatus, setActions } = useStudioHeader();

  // UI state from Zustand (UI-only store)
  const isOutlineCollapsed = useWizardUIStore((s) => s.isOutlineCollapsed);
  const setOutlineCollapsed = useWizardUIStore((s) => s.setOutlineCollapsed);

  // Track the created module code for smooth transitions after creation
  const [createdModuleCode, setCreatedModuleCode] = useState<string | null>(null);

  // The effective module code is the created one (if exists) or the URL param
  const effectiveModuleCode = createdModuleCode ?? moduleCode;
  const effectiveIsNewModule = isNewModule && !createdModuleCode;

  // Handle header updates when data loads
  const handleDataLoaded = useCallback(
    (course: Course | null, courseModule: CourseModule | null) => {
      const courseTitle = course?.title ?? "Course";
      if (isNewModule) {
        setBreadcrumbs([
          { label: "Course Studio", href: "/studio/course" },
          { label: courseTitle, href: `/studio/course/${courseId}` },
          { label: "New Module" },
        ]);
        setTitle("New Module");
      } else {
        setBreadcrumbs([
          { label: "Course Studio", href: "/studio/course" },
          { label: courseTitle, href: `/studio/course/${courseId}` },
          { label: courseModule?.title ?? moduleCode },
        ]);
        setTitle(courseModule?.title ?? "Module");
        if (courseModule?.status) {
          const displayStatus = courseModule.status === "active" ? "ON_CHAIN" : courseModule.status.toUpperCase();
          setStatus(displayStatus, courseModule.status === "active" ? "default" : "secondary");
        }
      }
    },
    [courseId, isNewModule, moduleCode, setBreadcrumbs, setTitle, setStatus]
  );

  // Data fetching hook
  const { data, completion, refetchData, updateSlts } = useModuleWizardData({
    courseId,
    moduleCode: effectiveModuleCode,
    isNewModule: effectiveIsNewModule,
    onDataLoaded: handleDataLoaded,
  });

  // Stable callbacks for draft hook
  const draftCallbacks = useMemo(
    () => ({
      onSaveSuccess: () => {
        toast.success("Module saved");
      },
      onSaveError: (error: string) => {
        toast.error("Failed to save module", { description: error });
      },
    }),
    []
  );

  // Module-scoped draft store (clean architecture)
  const moduleDraft = useModuleDraft(
    courseId,
    effectiveModuleCode,
    effectiveIsNewModule,
    draftCallbacks
  );

  // Destructure for stable references in dependency arrays
  // The store API is stable, actions from useStore are stable
  const {
    store: draftStore,
    draft,
    isDirty,
    isSaving,
    lastError,
    slts: draftSlts,
    assignment: draftAssignment,
    introduction: draftIntroduction,
    lessons: draftLessons,
    setMetadata,
    addSlt,
    updateSlt,
    deleteSlt,
    reorderSlts,
    setAssignment,
    setIntroduction,
    setLesson,
    saveAndSync,
    discardChanges,
  } = moduleDraft;

  // Compute draft-aware completion (merges server state with local draft)
  // This allows navigation to work even before saving
  const draftAwareCompletion = useMemo(() => {
    const hasTitle = !!(draft?.title?.trim());
    const hasSLTs = (draftSlts?.filter(s => !s._isDeleted)?.length ?? 0) > 0;
    const hasAssignment = !!(draftAssignment?.title?.trim());
    const hasIntroduction = !!(draftIntroduction?.title?.trim());

    return {
      credential: hasTitle || completion.credential,
      slts: hasSLTs || completion.slts,
      assignment: hasAssignment || completion.assignment,
      lessons: true, // Optional step
      introduction: hasIntroduction || completion.introduction,
      review: (hasTitle || completion.credential) &&
        (hasSLTs || completion.slts) &&
        (hasAssignment || completion.assignment) &&
        (hasIntroduction || completion.introduction),
    };
  }, [draft, draftSlts, draftAssignment, draftIntroduction, completion]);

  // Navigation hook - uses draft-aware completion for unlocking steps
  const {
    currentStep,
    direction,
    canGoNext,
    canGoPrevious,
    goToStep: goToStepRaw,
    goNext: goNextRaw,
    goPrevious: goPreviousRaw,
    getStepStatus,
    isStepUnlocked,
  } = useWizardNavigation({ completion: draftAwareCompletion });

  // Refs to always have latest navigation functions (avoids stale closures in async callbacks)
  const goToStepRawRef = useRef(goToStepRaw);
  const goNextRawRef = useRef(goNextRaw);
  const goPreviousRawRef = useRef(goPreviousRaw);
  goToStepRawRef.current = goToStepRaw;
  goNextRawRef.current = goNextRaw;
  goPreviousRawRef.current = goPreviousRaw;

  /**
   * Navigation functions - these just navigate, no auto-save.
   * Save is handled by a separate explicit "Save" button.
   */
  const goToStep = useCallback(
    (step: WizardStepId) => {
      goToStepRawRef.current(step);
    },
    []
  );

  const goNext = useCallback(() => {
    goNextRawRef.current();
  }, []);

  const goPrevious = useCallback(() => {
    goPreviousRawRef.current();
  }, []);

  /**
   * Handle module creation - updates URL silently and refetches data
   */
  const onModuleCreated = useCallback(
    async (newModuleCode: string) => {
      setCreatedModuleCode(newModuleCode);
      const newUrl = `/studio/course/${courseId}/${newModuleCode}?step=slts`;
      window.history.replaceState(null, "", newUrl);
      await refetchData(newModuleCode);
      void goToStep("slts");
    },
    [courseId, refetchData, goToStep]
  );

  // Build outline steps for the panel
  // Use draft counts for SLTs/lessons since they reflect current local state
  const draftSltCount = draftSlts?.filter(s => !s._isDeleted)?.length ?? data.slts.length;
  const draftLessonCount = draftLessons?.size ?? data.lessons.length;

  const outlineSteps: OutlineStep[] = useMemo(
    () =>
      MODULE_WIZARD_STEPS.map((step) => ({
        ...step,
        isComplete: draftAwareCompletion[step.id as WizardStepId],
        isActive: currentStep === step.id,
        isLocked: false, // All steps are unlocked - free navigation
        count: step.id === "slts" ? draftSltCount : step.id === "lessons" ? draftLessonCount : undefined,
      })),
    [draftAwareCompletion, currentStep, draftSltCount, draftLessonCount]
  );

  // Build wizard context
  const contextValue: WizardContextValue = useMemo(
    () => ({
      // Navigation
      currentStep,
      goToStep,
      goNext,
      goPrevious,
      canGoNext,
      canGoPrevious,
      getStepStatus,
      isStepUnlocked,
      completion: draftAwareCompletion,

      // Data (legacy - from React Query)
      data,
      refetchData,
      updateSlts,

      // Course identifiers
      courseId,
      moduleCode: effectiveModuleCode,
      isNewModule: effectiveIsNewModule,
      createdModuleCode,
      onModuleCreated,

      // Draft store state (from destructured moduleDraft)
      draft,
      isDirty,
      isSaving,
      lastError,

      // Draft selectors
      draftSlts,
      draftAssignment,
      draftIntroduction,
      draftLessons,

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
      draftAwareCompletion,
      data,
      refetchData,
      updateSlts,
      courseId,
      effectiveModuleCode,
      effectiveIsNewModule,
      createdModuleCode,
      onModuleCreated,
      draft,
      isDirty,
      isSaving,
      lastError,
      draftSlts,
      draftAssignment,
      draftIntroduction,
      draftLessons,
      setMetadata,
      addSlt,
      updateSlt,
      deleteSlt,
      reorderSlts,
      setAssignment,
      setIntroduction,
      setLesson,
      saveAndSync,
      discardChanges,
    ]
  );

  // Update header with save action
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3 px-2 py-1">
        {/* Unsaved changes indicator — hidden for uncreated modules */}
        {isDirty && !effectiveIsNewModule && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}

        {/* Save button - disabled for uncreated modules (use "Create Module" instead) */}
        <AndamioButton
          variant={isDirty && !effectiveIsNewModule ? "default" : "ghost"}
          size="sm"
          className="h-8 px-3"
          onClick={() => void saveAndSync()}
          disabled={!isDirty || isSaving || effectiveIsNewModule}
        >
          {isSaving ? (
            <LoadingIcon className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <SaveIcon className="h-4 w-4 mr-1" />
          )}
          {isSaving ? "Saving..." : "Save"}
        </AndamioButton>
      </div>
    );
  }, [setActions, isDirty, isSaving, saveAndSync, effectiveIsNewModule]);

  // Auto-save on unmount (navigate away from wizard)
  // Use refs to avoid stale closures - always have latest values
  const draftStoreRef = useRef(draftStore);
  draftStoreRef.current = draftStore;
  const saveAndSyncRef = useRef(saveAndSync);
  saveAndSyncRef.current = saveAndSync;
  const effectiveIsNewModuleRef = useRef(effectiveIsNewModule);
  effectiveIsNewModuleRef.current = effectiveIsNewModule;

  useEffect(() => {
    return () => {
      // Skip auto-save for uncreated modules (would 404)
      if (effectiveIsNewModuleRef.current) return;

      // Check if dirty directly from store (avoids stale closure)
      const state = draftStoreRef.current.getState();
      if (state.isDirty && state.draft) {
        console.log("[ModuleWizard] Auto-saving on unmount, draft has", state.draft.slts.length, "SLTs");
        // Fire and forget - we're unmounting so can't await
        void saveAndSyncRef.current();
      }
    };
    // Empty deps - only run cleanup on unmount
  }, []);

  // Loading state
  if (data.isLoading) {
    return <AndamioStudioLoading variant="split-pane" />;
  }

  // Error state
  if (data.error) {
    return (
      <StudioEditorPane padding="normal">
        <AndamioAlert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertDescription>{data.error}</AndamioAlertDescription>
        </AndamioAlert>
      </StudioEditorPane>
    );
  }

  const currentConfig = WIZARD_STEPS.find((s) => s.id === currentStep)!;

  return (
    <WizardContext.Provider value={contextValue}>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel: Step Outline */}
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={30}
          collapsible
          collapsedSize={0}
          onCollapse={() => setOutlineCollapsed(true)}
          onExpand={() => setOutlineCollapsed(false)}
        >
          <StudioOutlinePanel
            steps={outlineSteps}
            onStepClick={(stepId) => goToStep(stepId as WizardStepId)}
            isCollapsed={isOutlineCollapsed}
            onCollapsedChange={setOutlineCollapsed}
            title="Module Steps"
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Step Content */}
        <ResizablePanel defaultSize={80}>
          <div className="flex flex-col h-full">
            <AndamioScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-4 w-full md:w-11/12 mx-auto">
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
            </AndamioScrollArea>

            {/* Contextual Save Bar - hidden for uncreated modules (use "Create Module" instead) */}
            <div className="shrink-0 border-t px-4 py-3">
              <WizardSaveBar
                isDirty={isDirty && !effectiveIsNewModule}
                isSaving={isSaving}
                onSave={() => void saveAndSync()}
                onDiscard={discardChanges}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </WizardContext.Provider>
  );
}

/**
 * Studio Module Edit Page
 *
 * Dense split-pane layout with wizard for editing course modules.
 *
 * Authorization: Only accessible to users who are:
 * - Course owner (created the course)
 * - Course teacher (listed as contributor)
 */
export default function StudioModuleEditPage() {
  const params = useParams();
  const courseId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const isNewModule = moduleCode === "new";

  return (
    <RequireCourseAccess
      courseId={courseId}
      title="Edit Module"
      description="Connect your wallet to edit this course module"
      loadingVariant="studio-split"
    >
      <ModuleWizardContent
        courseId={courseId}
        moduleCode={moduleCode}
        isNewModule={isNewModule}
      />
    </RequireCourseAccess>
  );
}
