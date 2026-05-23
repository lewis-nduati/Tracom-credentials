"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TipIcon } from "~/components/icons";
import { useWizard } from "../module-wizard";
import { WizardStep, WizardStepTip, WizardStepHighlight } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle, AndamioCardDescription } from "~/components/andamio/andamio-card";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import { AndamioErrorAlert } from "~/components/andamio";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { ContentEditor } from "~/components/editor";
import type { WizardStepConfig } from "../types";
import type { JSONContent } from "@tiptap/core";

interface StepIntroductionProps {
  config: WizardStepConfig;
  direction: number;
}

/**
 * StepIntroduction - Write the module introduction
 *
 * Uses the draft store for optimistic updates.
 * Changes are saved automatically when navigating to the next step.
 */
export function StepIntroduction({ config, direction }: StepIntroductionProps) {
  const {
    data,
    goNext,
    goPrevious,
    canGoPrevious,
    // Draft store state and actions
    draftIntroduction,
    setIntroduction,
    isDirty,
    isSaving,
    lastError,
  } = useWizard();

  const slts = data.slts;
  const moduleTitle = data.courseModule?.title ?? "";

  // Use draft introduction if available, otherwise fall back to data.introduction
  const introduction = draftIntroduction ?? data.introduction;

  // Local UI state for editing
  const defaultTitle = `Welcome to ${moduleTitle}`;
  const [title, setTitle] = useState(introduction?.title ?? defaultTitle);
  const [content, setContent] = useState<JSONContent | null>(
    introduction?.contentJson ? introduction.contentJson : null
  );

  // Track if we've synced from introduction data
  const [hasInitializedFromIntro, setHasInitializedFromIntro] = useState(false);

  // Sync local state when introduction data loads from API (after refetch or initial load)
  useEffect(() => {
    if (introduction?.title && !hasInitializedFromIntro) {
      setTitle(introduction.title);
      if (introduction.contentJson) {
        setContent(introduction.contentJson);
      }
      setHasInitializedFromIntro(true);
    }
  }, [introduction, hasInitializedFromIntro]);

  /**
   * Update draft store when local state changes
   */
  const updateDraft = useCallback(() => {
    if (!setIntroduction) return;

    setIntroduction({
      id: introduction?.id,
      title: title.trim() || defaultTitle,
      description: introduction?.description,
      contentJson: content,
      imageUrl: introduction?.imageUrl,
      videoUrl: introduction?.videoUrl,
    });
  }, [setIntroduction, introduction, title, content, defaultTitle]);

  // Debounce draft updates - update after 500ms of no changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Only update if there are actual changes
      const originalTitle = introduction?.title ?? defaultTitle;
      const titleChanged = title !== originalTitle;
      const contentChanged = JSON.stringify(content) !== JSON.stringify(introduction?.contentJson ?? null);

      if (titleChanged || contentChanged) {
        updateDraft();
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [title, content, introduction, defaultTitle, updateDraft]);

  // Check if introduction exists in the database or draft
  const introductionExistsInDb = !!(
    introduction &&
    (
      typeof introduction.id === "number" ||
      (typeof introduction.title === "string" && introduction.title.trim().length > 0)
    )
  );

  const canProceed = introductionExistsInDb || (title.trim().length > 0);

  // Generate introduction suggestions based on SLTs
  const generateSuggestion = () => {
    if (slts.length === 0) return null;

    const sltList = slts.map((slt) => `• ${slt.sltText ?? ""}`).join("\n");
    return `In this module, you'll learn to:\n\n${sltList}\n\nBy the end, you'll have completed an assignment that demonstrates your mastery of these skills.`;
  };

  const suggestion = generateSuggestion();

  return (
    <WizardStep config={config} direction={direction}>
      {/* Backwards design payoff */}
      <WizardStepHighlight>
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", damping: 10 }}
          >
            <TipIcon className="h-8 w-8 text-muted-foreground" />
          </motion.div>
          <div>
            <AndamioHeading level={3} size="base" className="mb-1">What do students need to hear first?</AndamioHeading>
            <AndamioText variant="small">
              Now that you know exactly what learners will achieve ({slts.length} Learning Target{slts.length !== 1 ? "s" : ""})
              and how they&apos;ll prove it (the assignment), write an introduction that sets the stage for what this course module is all about.
            </AndamioText>
          </div>
        </div>
      </WizardStepHighlight>

      {/* Introduction editor */}
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <AndamioCardTitle className="text-base">Course Module Introduction</AndamioCardTitle>
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
              placeholder="Introduction title"
              className="font-medium"
              disabled={isSaving}
            />
          </div>

          <div className="min-h-[300px] border rounded-lg overflow-hidden">
            <ContentEditor
              content={content}
              onContentChange={setContent}
              minHeight="300px"
            />
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Suggestion */}
      {suggestion && !content && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-muted/50 rounded-sm border border-dashed"
        >
          <AndamioText variant="small" className="text-xs font-medium mb-2">
            Not sure where to start? Here&apos;s a template:
          </AndamioText>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
            {suggestion}
          </pre>
        </motion.div>
      )}

      <AndamioCard>
        <AndamioCardHeader className="">
          <AndamioCardIconHeader
            icon={TipIcon}
            title="What is your hook?"
            description="Why would someone want to complete this module and earn this credential?"
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
        nextLabel="Review & Approve"
        isLoading={isSaving}
      />
    </WizardStep>
  );
}
