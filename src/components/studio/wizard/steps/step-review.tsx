"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  VerifiedIcon,
  NeutralIcon,
  AlertIcon,
  CredentialIcon,
  SLTIcon,
  AssignmentIcon,
  LessonIcon,
  IntroductionIcon,
  SendIcon,
  CelebrateIcon,
  NextIcon,
} from "~/components/icons";
import { useWizard } from "../module-wizard";
import { WizardStep, WizardStepHighlight } from "../wizard-step";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioErrorAlert } from "~/components/andamio";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { computeSltHashDefinite } from "@andamio/core/hashing";
import { useUpdateCourseModuleStatus } from "~/hooks/api/course/use-course-module";
import type { WizardStepConfig } from "../types";
import { CopyId } from "~/components/andamio";

interface StepReviewProps {
  config: WizardStepConfig;
  direction: number;
}

export function StepReview({ config, direction }: StepReviewProps) {
  const {
    data,
    goPrevious,
    canGoPrevious,
    completion,
    goToStep,
    refetchData,
    courseId,
    moduleCode,
    saveAndSync,
    isDirty,
    isSaving,
    draftSlts,
    draftAssignment,
    draftIntroduction,
    draftLessons,
    draft,
  } = useWizard();
  const { isAuthenticated } = useAndamioAuth();
  const updateModuleStatus = useUpdateCourseModuleStatus();

  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const moduleStatus = data.courseModule?.status;
  const [isApproved, setIsApproved] = useState(moduleStatus === "approved" || moduleStatus === "active");

  // Prefer draft store data (Zustand) over server state (React Query)
  // so the review step reflects unsaved local edits
  const slts = draftSlts?.filter(s => !s._isDeleted) ?? data.slts;
  const lessonCount = draftLessons?.size ?? data.lessons.length;
  const moduleTitle = draft?.title?.trim() || (typeof data.courseModule?.title === "string" ? data.courseModule.title : "Untitled Module");
  const assignmentTitle = draftAssignment?.title?.trim() || (typeof data.assignment?.title === "string" ? data.assignment.title : "Not created");
  const introductionTitle = draftIntroduction?.title?.trim() || (typeof data.introduction?.title === "string" ? data.introduction.title : "Not created");

  const requiredItems = [
    {
      id: "credential",
      icon: CredentialIcon,
      label: "Module Title",
      value: moduleTitle,
      completed: completion.credential,
      step: "credential" as const,
    },
    {
      id: "slts",
      icon: SLTIcon,
      label: "Learning Targets",
      value: `${slts.length} Learning Target${slts.length !== 1 ? "s" : ""} defined`,
      completed: completion.slts,
      step: "slts" as const,
    },
    {
      id: "assignment",
      icon: AssignmentIcon,
      label: "Assignment",
      value: assignmentTitle,
      completed: completion.assignment,
      step: "assignment" as const,
    },
    {
      id: "introduction",
      icon: IntroductionIcon,
      label: "Introduction",
      value: introductionTitle,
      completed: completion.introduction,
      step: "introduction" as const,
    },
  ];

  const optionalItems = [
    {
      id: "lessons",
      icon: LessonIcon,
      label: "Lessons",
      value: `${lessonCount} of ${slts.length} lessons`,
      completed: lessonCount > 0,
      step: "lessons" as const,
    },
  ];

  const requiredCompleteCount = requiredItems.filter((item) => item.completed).length;
  const allRequiredComplete = requiredCompleteCount === requiredItems.length;

  const handleApprove = async () => {
    if (!isAuthenticated || !allRequiredComplete) return;

    setIsApproving(true);
    setError(null);

    try {
      // Step 1: Save any unsaved draft changes first
      if (isDirty && saveAndSync) {
        const saveSuccess = await saveAndSync();
        if (!saveSuccess) {
          throw new Error("Failed to save draft before approving");
        }
      }

      // Step 2: Compute the SLT hash from draft SLTs (sorted by moduleIndex)
      // Use draftSlts if available (local draft), otherwise fall back to data.slts
      // API v2.0.0+: moduleIndex is 1-based
      const sltsToHash = draftSlts ?? slts;
      const sortedSltTexts = [...sltsToHash]
        .filter((slt) => !("_isDeleted" in slt && slt._isDeleted))
        .sort((a, b) => (a.moduleIndex ?? 1) - (b.moduleIndex ?? 1))
        .map((slt) => slt.sltText)
        .filter((text): text is string => typeof text === "string" && text.length > 0);
      const sltHash = computeSltHashDefinite(sortedSltTexts);

      // Step 3: Approve module via dedicated update-status endpoint
      await updateModuleStatus.mutateAsync({
        courseId: courseId,
        moduleCode,
        status: "APPROVED",
        sltHash,
      });

      setIsApproved(true);
      await refetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve module");
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Revert module from APPROVED back to DRAFT status.
   * Uses the dedicated update-status endpoint (v2.0.0-dev-20260128-a+).
   * This unlocks SLTs for editing again.
   */
  const handleUnapprove = async () => {
    if (!isAuthenticated) return;

    setError(null);

    try {
      await updateModuleStatus.mutateAsync({
        courseId: courseId,
        moduleCode,
        status: "DRAFT",
        // slt_hash not required for APPROVED → DRAFT
      });

      setIsApproved(false);
      await refetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to return to draft");
    }
  };

  return (
    <WizardStep config={config} direction={direction}>
      {isApproved ? (
        // Success state
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <WizardStepHighlight>
            <div className="flex flex-col items-center gap-8 py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <CelebrateIcon className="h-6 w-6 text-primary" />
                </div>
              </motion.div>

              <div className="flex flex-col items-center">
                <AndamioHeading level={3} size="3xl">{moduleTitle}</AndamioHeading>
              </div>
              <AndamioText variant="small" className="text-center text-muted-foreground/60 max-w-sm">
                Once approved, Learning Targets are locked. You can still edit the lessons, assignment, and introduction any time.
              </AndamioText>


              <div className="flex flex-col items-center gap-4 text-sm">
                <AndamioBadge className="bg-primary text-primary-foreground">
                  APPROVED
                </AndamioBadge>
                {data.courseModule?.sltHash && (
                  <div className="flex flex-col items-center gap-1">
                    <AndamioText className="text-muted-foreground">
                      SLT Hash
                    </AndamioText>
                    <CopyId id={data.courseModule.sltHash} label={data.courseModule.sltHash} />
                  </div>
                )}
                <Link
                  href={`/studio/course/${courseId}?tab=credentials`}
                  className="hover:opacity-80 transition-opacity"
                >
                  <AndamioBadge variant="outline" className="cursor-pointer hover:bg-accent">
                    Ready to Mint →
                  </AndamioBadge>
                </Link>
              </div>

              <AndamioButton
                variant="outline"
                size="sm"
                onClick={handleUnapprove}
                disabled={updateModuleStatus.isPending}
                isLoading={updateModuleStatus.isPending}
                className="mt-2"
              >
                Return to Draft
              </AndamioButton>
            </div>
          </WizardStepHighlight>
        </motion.div>
      ) : (
        // Review checklist
        <>
          <WizardStepHighlight>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <SendIcon className="h-7 w-7 text-primary" />
              </div>
              <div className="flex flex-col items-center">
                <AndamioHeading level={3} size="lg">Ready to Publish?</AndamioHeading>
                <AndamioText variant="small" className="mt-1 text-center max-w-md">
                  Review your module content below. When everything looks good,
                  click <strong>Approve Module</strong> to mark it as ready for
                  on-chain minting.
                </AndamioText>
              </div>
            </div>
          </WizardStepHighlight>

          {/* Required items */}
          <AndamioCard>
            <AndamioCardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <AndamioCardTitle className="text-base">Required</AndamioCardTitle>
                <AndamioBadge variant={allRequiredComplete ? "default" : "secondary"}>
                  {requiredCompleteCount} of {requiredItems.length} complete
                </AndamioBadge>
              </div>
            </AndamioCardHeader>
            <AndamioCardContent>
              <div className="space-y-3">
                {requiredItems.map((item, index) => {
                  const Icon = item.icon;
                  const StatusIcon = item.completed ? VerifiedIcon : NeutralIcon;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon
                          className={`h-5 w-5 ${item.completed ? "text-primary" : "text-muted-foreground"
                            }`}
                        />
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                        <AndamioButton
                          size="icon"
                          variant="ghost"
                          onClick={() => goToStep(item.step)}
                          className="h-8 w-8 shrink-0"
                        >
                          <NextIcon className="h-4 w-4" />
                        </AndamioButton>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AndamioCardContent>
          </AndamioCard>

          {/* Optional items */}
          <AndamioCard>
            <AndamioCardHeader className="pb-3">
              <AndamioCardTitle className="text-base text-muted-foreground">Optional</AndamioCardTitle>
            </AndamioCardHeader>
            <AndamioCardContent>
              <div className="space-y-3">
                {optionalItems.map((item, index) => {
                  const Icon = item.icon;
                  const StatusIcon = item.completed ? VerifiedIcon : NeutralIcon;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (requiredItems.length + index) * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon
                          className={`h-5 w-5 ${item.completed ? "text-primary" : "text-muted-foreground"
                            }`}
                        />
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                        <AndamioButton
                          size="icon"
                          variant="ghost"
                          onClick={() => goToStep(item.step)}
                          className="h-8 w-8 shrink-0"
                        >
                          <NextIcon className="h-4 w-4" />
                        </AndamioButton>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AndamioCardContent>
          </AndamioCard>

          {!allRequiredComplete && (
            <AndamioAlert>
              <AlertIcon className="h-4 w-4" />
              <AndamioAlertDescription>
                Complete all required items before approving. Click &quot;Fix&quot; next to any
                incomplete item.
              </AndamioAlertDescription>
            </AndamioAlert>
          )}

          {error && <AndamioErrorAlert error={error} />}
        </>
      )}

      {/* CTA and Navigation */}
      <div className="space-y-4 pt-6 border-t">
        {!isApproved && (
          <div className="flex flex-col items-center gap-3">
            <AndamioButton
              onClick={handleApprove}
              disabled={!allRequiredComplete || isApproving || isSaving}
              isLoading={isApproving || isSaving}
              size="lg"
              className="w-full sm:w-auto px-8"
            >
              <CredentialIcon className="h-5 w-5 mr-2" />
              {isSaving ? "Saving..." : isApproving ? "Approving..." : "Save & Approve Module"}
            </AndamioButton>
            <AndamioText variant="small" className="text-center">
              This marks your module as ready to mint on Cardano
            </AndamioText>
          </div>
        )}

        <div className="flex justify-center">
          <AndamioButton
            variant="ghost"
            onClick={goPrevious}
            disabled={!canGoPrevious || isApproving}
          >
            ← Back to Introduction
          </AndamioButton>
        </div>
      </div>
    </WizardStep>
  );
}
