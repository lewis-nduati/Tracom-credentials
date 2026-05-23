"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AddIcon, CompletedIcon, LessonIcon, SparkleIcon, CollapseIcon, EditIcon, TipIcon } from "~/components/icons";
import { useWizard } from "../module-wizard";
import { WizardStep } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioCard, AndamioCardContent, AndamioCardHeader } from "~/components/andamio/andamio-card";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioErrorAlert } from "~/components/andamio";
import { ContentEditor } from "~/components/editor";
import type { WizardStepConfig } from "../types";
import type { JSONContent } from "@tiptap/core";
import type { LessonDraft } from "~/stores/module-draft-store";

interface StepLessonsProps {
  config: WizardStepConfig;
  direction: number;
}

/**
 * StepLessons - Create lessons for each SLT
 *
 * Uses the draft store for optimistic updates.
 * Changes are saved automatically when navigating to the next step.
 */
export function StepLessons({ config, direction }: StepLessonsProps) {
  const {
    data,
    goNext,
    goPrevious,
    canGoPrevious,
    // Draft store state and actions
    draftLessons,
    draftSlts,
    draftAssignment,
    setLesson,
    isDirty,
    isSaving,
    lastError,
  } = useWizard();

  const [creatingForSlt, setCreatingForSlt] = useState<number | null>(null);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");

  // Use draft SLTs if available, otherwise fall back to data.slts
  const slts = draftSlts ?? data.slts;

  // Use draft lessons if available, otherwise fall back to data.lessons
  const lessons = draftLessons ?? new Map();
  const serverLessons = data.lessons;

  // Map server lessons to their SLT's sltIndex for fallback
  const serverLessonBySltIndex = serverLessons.reduce((acc, lesson) => {
    const sltIndex = lesson.sltIndex ?? 0;
    acc[sltIndex] = lesson;
    return acc;
  }, {} as Record<number, typeof serverLessons[number]>);

  /**
   * Create a new lesson in the draft store
   * No API call - saved when navigating to next step
   */
  const handleCreateLesson = (sltIndex: number) => {
    if (!newLessonTitle.trim() || !setLesson) return;

    // Add to draft store
    setLesson(sltIndex, {
      title: newLessonTitle.trim(),
      description: undefined,
      contentJson: null,
    });

    setNewLessonTitle("");
    setCreatingForSlt(null);
    // Auto-expand for editing
    setEditingLessonIndex(sltIndex);
  };

  // Count lessons (from draft or server)
  const lessonsCreated = lessons.size > 0
    ? lessons.size
    : serverLessons.length;
  const totalSLTs = slts.length;

  // Check for assignment in draft first, then server data
  const hasAssignment = !!(
    (draftAssignment?.title?.trim()) ||
    (data.assignment && typeof data.assignment.title === "string" && data.assignment.title.trim().length > 0)
  );

  return (
    <WizardStep config={config} direction={direction}>
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AndamioText variant="small">
            {lessonsCreated} of {totalSLTs} lessons created
          </AndamioText>
          {isDirty && (
            <span className="text-xs text-muted-foreground">
              {isSaving ? "Saving..." : "Unsaved changes"}
            </span>
          )}
        </div>
        <AndamioBadge variant="outline">Optional Step</AndamioBadge>
      </div>

      {/* SLT-Lesson mapping */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {slts.map((slt, index) => {
            // API v2.0.0+: moduleIndex is 1-based
            const sltIndex = slt.moduleIndex ?? (index + 1);
            // Get lesson from draft store first, then fall back to server data
            const draftLesson = lessons.get(sltIndex);
            const serverLesson = serverLessonBySltIndex[sltIndex];
            const lesson = draftLesson ?? serverLesson;
            const isCreatingThis = creatingForSlt === sltIndex;
            const isEditingThis = editingLessonIndex === sltIndex;

            return (
              <motion.div
                key={sltIndex}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AndamioCard className={lesson ? "border-primary/30 bg-primary/5" : ""}>
                  <AndamioCardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* SLT indicator */}
                      <div className="shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            lesson
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {lesson ? <CompletedIcon className="h-4 w-4" /> : index + 1}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* SLT text */}
                        <AndamioText variant="small" className="mb-2">
                          {slt.sltText ?? ""}
                        </AndamioText>

                        {/* Lesson info or create */}
                        {lesson ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <LessonIcon className="h-4 w-4 text-primary" />
                                <span className="font-medium">{typeof lesson.title === "string" ? lesson.title : "Untitled Lesson"}</span>
                                {draftLesson && (draftLesson._isNew || draftLesson._isModified) && (
                                  <span className="text-xs text-muted-foreground">(unsaved)</span>
                                )}
                              </div>
                              <AndamioButton
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingLessonIndex(isEditingThis ? null : sltIndex)}
                                disabled={isSaving}
                              >
                                {isEditingThis ? (
                                  <>
                                    <CollapseIcon className="h-3 w-3 mr-1" />
                                    Collapse
                                  </>
                                ) : (
                                  <>
                                    <EditIcon className="h-3 w-3 mr-1" />
                                    Edit
                                  </>
                                )}
                              </AndamioButton>
                            </div>

                            {/* Inline Editor */}
                            <AnimatePresence>
                              {isEditingThis && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <LessonEditor
                                    lesson={lesson}
                                    sltIndex={sltIndex}
                                    setLesson={setLesson}
                                    isSaving={isSaving}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : isCreatingThis ? (
                          <div className="flex gap-2">
                            <AndamioInput
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              placeholder="Lesson title..."
                              className="flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && newLessonTitle.trim()) {
                                  void handleCreateLesson(sltIndex);
                                }
                                if (e.key === "Escape") {
                                  setCreatingForSlt(null);
                                  setNewLessonTitle("");
                                }
                              }}
                            />
                            <AndamioButton
                              size="sm"
                              onClick={() => handleCreateLesson(sltIndex)}
                              disabled={!newLessonTitle.trim() || isSaving}
                              isLoading={isSaving}
                            >
                              Create
                            </AndamioButton>
                            <AndamioButton
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setCreatingForSlt(null);
                                setNewLessonTitle("");
                              }}
                            >
                              Cancel
                            </AndamioButton>
                          </div>
                        ) : (
                          <AndamioButton
                            size="sm"
                            variant="outline"
                            onClick={() => setCreatingForSlt(sltIndex)}
                          >
                            <AddIcon className="h-3 w-3 mr-1" />
                            Add Lesson
                          </AndamioButton>
                        )}
                      </div>
                    </div>
                  </AndamioCardContent>
                </AndamioCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {lessonsCreated === 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardIconHeader
              icon={TipIcon}
              title="Lessons are optional!"
              description='Some modules work great with just an assignment. You can always add lessons later — click "Skip to Introduction" to move on.'
            />
          </AndamioCardHeader>
        </AndamioCard>
      )}

      {lessonsCreated > 0 && lessonsCreated < totalSLTs && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg"
        >
          <SparkleIcon className="h-4 w-4" />
          <span>
            You&apos;ve added {lessonsCreated} lesson{lessonsCreated !== 1 ? "s" : ""}.
            Feel free to add more or continue — you can always come back.
          </span>
        </motion.div>
      )}

      {/* Warning if no assignment */}
      {!hasAssignment && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/10 p-3 rounded-sm border border-muted-foreground/20"
        >
          <span>
            Complete the <strong>Assignment</strong> step before writing the introduction.
          </span>
        </motion.div>
      )}

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
        canGoNext={hasAssignment}
        nextLabel="Write Introduction"
        canSkip={hasAssignment}
        skipLabel="Skip to Introduction"
        onSkip={goNext}
        isLoading={isSaving}
      />
    </WizardStep>
  );
}

// =============================================================================
// Lesson Editor Component
// =============================================================================

type LessonLike = {
  id?: number;
  title?: string;
  description?: string;
  contentJson?: JSONContent | null;
  sltIndex?: number;
  imageUrl?: string;
  videoUrl?: string;
};

interface LessonEditorProps {
  lesson: LessonLike;
  sltIndex: number;
  setLesson?: (sltIndex: number, data: Omit<LessonDraft, "_isModified" | "_isNew" | "sltIndex"> | null) => void;
  isSaving?: boolean;
}

/**
 * LessonEditor - Inline editor for lesson content
 *
 * Uses the draft store for optimistic updates.
 * Changes are debounced and saved to draft state automatically.
 */
function LessonEditor({ lesson, sltIndex, setLesson, isSaving = false }: LessonEditorProps) {
  // Local UI state for editing
  const [title, setTitle] = useState(lesson.title ?? "");
  const [content, setContent] = useState<JSONContent | null>(
    lesson.contentJson ?? null
  );

  // Track if we've synced from lesson data
  const [hasInitializedFromLesson, setHasInitializedFromLesson] = useState(false);

  // Sync local state when lesson data loads from API (after refetch or initial load)
  useEffect(() => {
    if (lesson?.title && !hasInitializedFromLesson) {
      setTitle(lesson.title);
      if (lesson.contentJson) {
        setContent(lesson.contentJson);
      }
      setHasInitializedFromLesson(true);
    }
  }, [lesson, hasInitializedFromLesson]);

  /**
   * Update draft store when local state changes
   */
  const updateDraft = useCallback(() => {
    if (!setLesson) return;

    setLesson(sltIndex, {
      id: lesson.id,
      title: title.trim() || "Untitled Lesson",
      description: lesson.description,
      contentJson: content,
      imageUrl: lesson.imageUrl,
      videoUrl: lesson.videoUrl,
    });
  }, [setLesson, sltIndex, lesson, title, content]);

  // Debounce draft updates - update after 500ms of no changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Only update if there are actual changes
      const titleChanged = title !== (lesson.title ?? "");
      const contentChanged = JSON.stringify(content) !== JSON.stringify(lesson.contentJson ?? null);

      if (titleChanged || contentChanged) {
        updateDraft();
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [title, content, lesson, updateDraft]);

  return (
    <div className="space-y-4 pt-3 border-t border-border/50">
      <div className="flex items-center justify-between">
        <AndamioInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          className="font-medium flex-1 mr-3"
          disabled={isSaving}
        />
      </div>

      <div className="min-h-[200px] border rounded-lg overflow-hidden bg-background">
        <ContentEditor
          content={content}
          onContentChange={setContent}
          minHeight="200px"
        />
      </div>
    </div>
  );
}
