"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { VerifiedIcon, TipIcon } from "~/components/icons";
import { useWizard } from "../module-wizard";
import { WizardStep } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle, AndamioCardDescription } from "~/components/andamio/andamio-card";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import { AndamioErrorAlert } from "~/components/andamio";
import { ContentEditor } from "~/components/editor";
import type { WizardStepConfig } from "../types";
import type { JSONContent } from "@tiptap/core";

interface StepAssignmentProps {
  config: WizardStepConfig;
  direction: number;
}

/**
 * StepAssignment - Design the module assignment
 *
 * Uses the draft store for optimistic updates.
 * Changes are saved automatically when navigating to the next step.
 */
export function StepAssignment({ config, direction }: StepAssignmentProps) {
  const {
    data,
    goNext,
    goPrevious,
    goToStep,
    canGoPrevious,
    // Draft store state and actions
    draftAssignment,
    setAssignment,
    isDirty,
    isSaving,
    lastError,
  } = useWizard();

  const slts = data.slts;

  // Use draft assignment if available, otherwise fall back to data.assignment
  const assignment = draftAssignment ?? data.assignment;

  // Local UI state for editing
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [content, setContent] = useState<JSONContent | null>(
    assignment?.contentJson ? assignment.contentJson : null
  );

  // Track if we've synced from assignment data
  const [hasInitializedFromAssignment, setHasInitializedFromAssignment] = useState(false);

  // Sync local state when assignment data loads from API (after refetch or initial load)
  useEffect(() => {
    if (assignment?.title && !hasInitializedFromAssignment) {
      setTitle(assignment.title);
      if (assignment.contentJson) {
        setContent(assignment.contentJson);
      }
      setHasInitializedFromAssignment(true);
    }
  }, [assignment, hasInitializedFromAssignment]);

  /**
   * Update draft store when local state changes
   */
  const updateDraft = useCallback(() => {
    if (!setAssignment) return;

    setAssignment({
      id: assignment?.id,
      title: title.trim() || "Module Assignment",
      description: assignment?.description,
      contentJson: content,
      imageUrl: assignment?.imageUrl,
      videoUrl: assignment?.videoUrl,
    });
  }, [setAssignment, assignment, title, content]);

  // Debounce draft updates - update after 500ms of no changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Only update if there are actual changes
      const titleChanged = title !== (assignment?.title ?? "");
      const contentChanged = JSON.stringify(content) !== JSON.stringify(assignment?.contentJson ?? null);

      if (titleChanged || contentChanged) {
        updateDraft();
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [title, content, assignment, updateDraft]);

  // Check if assignment actually exists in the database
  const assignmentExistsInDb = !!(
    assignment &&
    (
      typeof assignment.id === "number" ||
      (typeof assignment.title === "string" && assignment.title.trim().length > 0)
    )
  );

  const canProceed = assignmentExistsInDb || (title.trim().length > 0);

  return (
    <WizardStep config={config} direction={direction}>
      {/* SLT checklist for reference */}
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardTitle className="text-base">Learning Targets to Assess</AndamioCardTitle>
          <AndamioCardDescription>
            Your assignment should test these skills
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="space-y-2">
            {slts.map((slt, index) => (
              <motion.div
                key={slt.moduleIndex ?? (index + 1)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-2 rounded-lg bg-muted/50"
              >
                <VerifiedIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm">{slt.sltText}</span>
              </motion.div>
            ))}
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Assignment editor */}
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <AndamioCardTitle className="text-base">Assignment Content</AndamioCardTitle>
              <AndamioCardDescription>
                What will learners do to demonstrate mastery?
              </AndamioCardDescription>
            </div>
            {isDirty && (
              <span className="text-xs text-muted-foreground">
                {isSaving ? "Saving..." : "Unsaved changes"}
              </span>
            )}
          </div>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="space-y-2">
            <AndamioInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assignment title"
              className="font-medium"
              disabled={isSaving}
            />
          </div>

          <div className="min-h-[300px] border rounded-lg overflow-hidden w-full min-w-0">
            <ContentEditor
              content={content}
              onContentChange={setContent}
              minHeight="300px"
            />
          </div>
        </AndamioCardContent>
      </AndamioCard>

      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardIconHeader
            icon={TipIcon}
            title="A great assignment is specific"
            description={'Instead of "Write about smart contracts", try "Deploy a smart contract that accepts a deposit and refunds it after 24 hours. Submit the transaction hash and explain your code."'}
          />
        </AndamioCardHeader>
      </AndamioCard>

      {/* Dirty indicator */}
      {isDirty && !isSaving && (
        <div className="text-xs text-muted-foreground">
          Changes will be saved when you continue to the next step.
        </div>
      )}

      {lastError && <AndamioErrorAlert error={lastError} />}

      {/* Navigation */}
      <WizardNavigation
        onPrevious={goPrevious}
        onNext={goNext}
        canGoPrevious={canGoPrevious}
        canGoNext={canProceed}
        nextLabel="Add Lessons"
        canSkip={assignmentExistsInDb}
        skipLabel="Skip to Introduction"
        onSkip={() => goToStep("introduction")}
        isLoading={isSaving}
      />
    </WizardStep>
  );
}
