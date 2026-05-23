"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SparkleIcon, CredentialIcon, SLTIcon, TipIcon, CopyIcon } from "~/components/icons";
import { useWizard } from "../module-wizard";
import { WizardStep, WizardStepTip, WizardStepHighlight } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioCard, AndamioCardContent, AndamioCardHeader } from "~/components/andamio/andamio-card";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioErrorAlert } from "~/components/andamio";
import {
  AndamioDialog,
  AndamioDialogContent,
  AndamioDialogHeader,
  AndamioDialogTitle,
  AndamioDialogDescription,
  AndamioDialogFooter,
} from "~/components/andamio/andamio-dialog";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useCreateCourseModule, useTeacherCourseModules } from "~/hooks/api/course/use-course-module";
import { useSaveModuleDraft } from "~/hooks/api/course/use-save-module-draft";
import type { WizardStepConfig } from "../types";
import type { ModuleDraft } from "~/stores/module-draft-store";


interface StepCredentialProps {
  config: WizardStepConfig;
  direction: number;
}

export function StepCredential({ config, direction }: StepCredentialProps) {
  const { data, goNext, canGoPrevious, goPrevious, refetchData, courseId, moduleCode, isNewModule, onModuleCreated, draft, setMetadata } = useWizard();
  const { isAuthenticated } = useAndamioAuth();

  // Read title/description from draft store (enables dirty tracking and auto-save)
  // Falls back to server data for initial load or when draft is not ready
  const title = draft?.title ?? (typeof data.courseModule?.title === "string" ? data.courseModule.title : "");
  const description = draft?.description ?? (typeof data.courseModule?.description === "string" ? data.courseModule.description : "");

  const [error, setError] = useState<string | null>(null);

  // Use hooks for API calls
  const createModule = useCreateCourseModule();
  const saveModuleDraft = useSaveModuleDraft();

  // Duplicate module state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateModuleCode, setDuplicateModuleCode] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);
  const router = useRouter();

  // For new modules, fetch existing modules to generate a unique code (use teacher endpoint to see drafts)
  const { data: existingModules = [] } = useTeacherCourseModules(courseId);

  /**
   * Generate a unique module code based on existing modules
   */
  const generateModuleCode = () => {
    const numericCodes = existingModules
      .map((m) => parseInt(m.moduleCode ?? "", 10))
      .filter((n) => !isNaN(n));
    const nextNumber = numericCodes.length > 0 ? Math.max(...numericCodes) + 1 : 101;
    return String(nextNumber);
  };

  // Module code state - for new modules, generate a default; for existing, use current value
  const [editableModuleCode, setEditableModuleCode] = useState(() => {
    if (isNewModule) {
      return ""; // Will be set once existingModules loads
    }
    return moduleCode ?? "";
  });

  // Update the generated code when existingModules loads (for new modules)
  React.useEffect(() => {
    if (isNewModule && existingModules.length >= 0 && !editableModuleCode) {
      setEditableModuleCode(generateModuleCode());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewModule, existingModules]);

  // Check if module code already exists
  const moduleCodeExists = existingModules.some(
    (m) => m.moduleCode === editableModuleCode && m.moduleCode !== moduleCode
  );

  // Check if duplicate module code already exists
  const duplicateCodeExists = existingModules.some(
    (m) => m.moduleCode === duplicateModuleCode
  );

  // Check if module is locked (approved or on-chain)
  const moduleStatus = data.courseModule?.status;
  const isModuleLocked = moduleStatus === "approved" || moduleStatus === "active" || moduleStatus === "pending_tx";

  const canProceed = title.trim().length > 0 && editableModuleCode.trim().length > 0 && !moduleCodeExists;
  const isSaving = createModule.isPending;

  /**
   * Create a new module (for new module mode)
   */
  const handleCreateModule = async () => {
    if (!isAuthenticated || !canProceed) return;

    setError(null);

    try {
      await createModule.mutateAsync({
        courseId: courseId,
        moduleCode: editableModuleCode.trim(),
        title,
        description,
      });

      // Use onModuleCreated for smooth transition without full page refresh
      // This updates state, URL (silently), refetches data, and navigates to SLTs step
      await onModuleCreated(editableModuleCode.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create module");
    }
  };

  /**
   * Duplicate module with all its content
   *
   * Uses the aggregate-update endpoint to copy all content in a single request
   * after creating the new module shell.
   */
  const handleDuplicateModule = async () => {
    if (!isAuthenticated || !duplicateModuleCode.trim() || duplicateCodeExists) return;

    setIsDuplicating(true);
    setError(null);

    try {
      const newCode = duplicateModuleCode.trim();

      // 1. Create new module with DRAFT status
      await createModule.mutateAsync({
        courseId: courseId,
        moduleCode: newCode,
        title: `${title} (Copy)`,
        description,
      });

      // 2. Use aggregate-update to copy all content in a single request
      const draft: ModuleDraft = {
        courseId: courseId,
        moduleCode: newCode,
        title: `${title} (Copy)`,
        description,
        slts: data.slts.map((slt, idx) => ({
          _localId: `dup-slt-${idx}`,
          sltText: slt.sltText ?? "",
          moduleIndex: slt.moduleIndex ?? idx + 1,
          _isNew: true,
        })),
        assignment: data.assignment ? {
          title: data.assignment.title ?? "",
          description: data.assignment.description,
          contentJson: data.assignment.contentJson,
          imageUrl: data.assignment.imageUrl,
          videoUrl: data.assignment.videoUrl,
          _isNew: true,
        } : null,
        introduction: data.introduction ? {
          title: data.introduction.title ?? "",
          description: data.introduction.description,
          contentJson: data.introduction.contentJson,
          imageUrl: data.introduction.imageUrl,
          videoUrl: data.introduction.videoUrl,
          _isNew: true,
        } : null,
        lessons: new Map(
          data.lessons.map((lesson) => [
            lesson.sltIndex ?? 1,
            {
              title: lesson.title ?? "",
              description: lesson.description,
              contentJson: lesson.contentJson,
              sltIndex: lesson.sltIndex ?? 1,
              imageUrl: lesson.imageUrl,
              videoUrl: lesson.videoUrl,
              _isNew: true,
            },
          ])
        ),
      };

      const result = await saveModuleDraft.mutateAsync(draft);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to copy module content");
      }

      // Close dialog and navigate to new module
      setShowDuplicateDialog(false);
      setDuplicateModuleCode("");
      router.push(`/studio/course/${courseId}/${newCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate module");
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleContinue = async () => {
    if (isNewModule) {
      await handleCreateModule();
    } else {
      // For existing modules, navigation just navigates.
      // Changes are saved via the draft store + WizardSaveBar.
      goNext();
    }
  };

  return (
    <WizardStep config={config} direction={direction}>
      {/* Philosophy explanation */}
      <WizardStepHighlight>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Credential visualization */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="shrink-0"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-sm bg-primary/10 flex items-center justify-center">
                <CredentialIcon className="h-8 w-8 text-primary" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
              >
                <SparkleIcon className="h-4 w-4 text-primary-foreground" />
              </motion.div>
            </div>
          </motion.div>

          {/* Explanation */}
          <div className="space-y-3">
            <AndamioText variant="small" className="leading-relaxed">
              When you build a Course Module, you define an{" "}
              <span className="font-medium text-foreground">interoperable credential</span> that is anchored on the blockchain.
            </AndamioText>
          </div>
        </div>
      </WizardStepHighlight>

      {/* Module form */}
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardIconHeader
            icon={SLTIcon}
            title="Start by giving this course module a title"
            iconColor="text-primary"
          />
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <AndamioLabel htmlFor="title">
                Module Title <span className="text-destructive">*</span>
              </AndamioLabel>
              <AndamioInput
                id="title"
                value={title}
                onChange={(e) => setMetadata?.(e.target.value, description)}
                placeholder="e.g., Introduction to Smart Contracts"
                maxLength={200}
                className="text-lg"
              />
              <AndamioText variant="small" className="text-xs">
              Students will be able to see this title. You can change it any time.
              </AndamioText>
            </div>

            <div className="space-y-2">
              <AndamioLabel htmlFor="moduleCode">
                Module Code <span className="text-destructive">*</span>
              </AndamioLabel>
              <div className="flex items-center gap-2">
                <AndamioInput
                  id="moduleCode"
                  value={editableModuleCode}
                  onChange={(e) => setEditableModuleCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                  placeholder="e.g., 101"
                  maxLength={20}
                  className="font-mono w-32"
                  disabled={isModuleLocked || !isNewModule}
                />
                {!isNewModule && (
                  <AndamioButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDuplicateModuleCode(generateModuleCode());
                      setShowDuplicateDialog(true);
                    }}
                    title="Duplicate this module with a new code"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </AndamioButton>
                )}
              </div>
              {moduleCodeExists && (
                <AndamioText variant="small" className="text-destructive text-xs">
                  This code already exists
                </AndamioText>
              )}
              {!isNewModule && !isModuleLocked && (
                <AndamioText variant="small" className="text-xs">
                  Code cannot be changed — duplicate instead
                </AndamioText>
              )}
              {isModuleLocked && (
                <AndamioText variant="small" className="text-xs">
                  Module is approved — duplicate to make changes
                </AndamioText>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <AndamioLabel htmlFor="description">Description</AndamioLabel>
            <AndamioTextarea
              id="description"
              value={description}
              onChange={(e) => setMetadata?.(title, e.target.value)}
              placeholder="A brief overview of this module's learning journey..."
              rows={3}
            />
          </div>
        </AndamioCardContent>
      </AndamioCard>

      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardIconHeader
            icon={TipIcon}
            title="Next: Backwards Design"
          />
        </AndamioCardHeader>
        <AndamioCardContent>
          <ol className="list-decimal list-inside space-y-2 ml-4 text-sm text-muted-foreground">
            <li>Learning Targets — what learners will achieve</li>
            <li>Assignment — how they prove it</li>
            <li>Lessons — supporting content</li>
            <li>Introduction — set the stage</li>
          </ol>
        </AndamioCardContent>
      </AndamioCard>

      {error && <AndamioErrorAlert error={error} />}

      {/* Navigation */}
      <WizardNavigation
        onPrevious={goPrevious}
        onNext={handleContinue}
        canGoPrevious={canGoPrevious}
        canGoNext={canProceed}
        nextLabel={isNewModule ? "Create Module" : "Define Learning Targets"}
        isLoading={isSaving}
      />

      {/* Duplicate Module Dialog */}
      <AndamioDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AndamioDialogContent>
          <AndamioDialogHeader>
            <AndamioDialogTitle>Duplicate Module</AndamioDialogTitle>
            <AndamioDialogDescription>
              Create a copy of this module with all its content (Learning Targets, assignment, lessons, introduction).
              The new module will start as a Draft.
            </AndamioDialogDescription>
          </AndamioDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <AndamioLabel htmlFor="duplicateCode">New Module Code</AndamioLabel>
              <AndamioInput
                id="duplicateCode"
                value={duplicateModuleCode}
                onChange={(e) => setDuplicateModuleCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                placeholder="e.g., 102"
                maxLength={20}
                className="font-mono"
              />
              {duplicateCodeExists && (
                <AndamioText variant="small" className="text-destructive text-xs">
                  This code already exists
                </AndamioText>
              )}
            </div>

            <div className="rounded-sm border bg-muted/50 p-3 space-y-1">
              <AndamioText variant="small" className="font-medium">Will be copied:</AndamioText>
              <ul className="text-sm text-muted-foreground space-y-0.5">
                <li>• Module title: &quot;{title} (Copy)&quot;</li>
                <li>• {data.slts.length} Learning Target{data.slts.length !== 1 ? "s" : ""}</li>
                <li>• {data.assignment ? "Assignment" : "No assignment"}</li>
                <li>• {data.lessons.length} lesson{data.lessons.length !== 1 ? "s" : ""}</li>
                <li>• {data.introduction ? "Introduction" : "No introduction"}</li>
              </ul>
            </div>
          </div>

          <AndamioDialogFooter>
            <AndamioButton
              variant="outline"
              onClick={() => {
                setShowDuplicateDialog(false);
                setDuplicateModuleCode("");
              }}
              disabled={isDuplicating}
            >
              Cancel
            </AndamioButton>
            <AndamioButton
              onClick={handleDuplicateModule}
              disabled={!duplicateModuleCode.trim() || duplicateCodeExists || isDuplicating}
              isLoading={isDuplicating}
            >
              <CopyIcon className="h-4 w-4 mr-2" />
              Duplicate Module
            </AndamioButton>
          </AndamioDialogFooter>
        </AndamioDialogContent>
      </AndamioDialog>
    </WizardStep>
  );
}
