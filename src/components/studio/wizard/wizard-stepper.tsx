"use client";

import React from "react";
import { motion } from "framer-motion";
import { CompletedIcon, LockedIcon, SparkleIcon, SLTIcon, CredentialIcon, LessonIcon, IntroductionIcon, VerifiedIcon } from "~/components/icons";
import { cn } from "~/lib/utils";
import { AndamioText } from "~/components/andamio";
import type { WizardStepId, StepStatus, WizardStepConfig } from "./types";
import { checkmarkVariants } from "./types";

/**
 * Step configurations with icons and copy
 */
export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: "credential",
    title: "Credential",
    subtitle: "1 Course Module = 1 Interoperable Credential",
    description: "Define your module's identity and understand the backwards design approach",
    icon: SparkleIcon,
  },
  {
    id: "slts",
    title: "Learning Targets",
    subtitle: "What Will Learners Achieve?",
    description: "Define the skills and knowledge learners will demonstrate",
    icon: SLTIcon,
  },
  {
    id: "assignment",
    title: "Assignment",
    subtitle: "How Will They Prove It?",
    description: "Create the assessment that validates mastery",
    icon: CredentialIcon,
  },
  {
    id: "lessons",
    title: "Lessons",
    subtitle: "What Do Students Need to Know?",
    description: "Add supporting content for each learning target",
    icon: LessonIcon,
    optional: true,
  },
  {
    id: "introduction",
    title: "Introduction",
    subtitle: "Introduce this Course Module",
    description: "Now write the intro that ties it all together",
    icon: IntroductionIcon,
  },
  {
    id: "review",
    title: "Review",
    subtitle: "Ready for Blockchain?",
    description: "Approve your module for on-chain minting",
    icon: VerifiedIcon,
  },
];

interface WizardStepperProps {
  currentStep: WizardStepId;
  getStepStatus: (step: WizardStepId) => StepStatus;
  onStepClick: (step: WizardStepId) => void;
  className?: string;
}

/**
 * WizardStepper - Visual progress indicator
 *
 * Desktop: Vertical stepper on the left
 * Mobile: Horizontal compact stepper at top
 */
export function WizardStepper({
  currentStep,
  getStepStatus,
  onStepClick,
  className,
}: WizardStepperProps) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((currentIndex + 1) / WIZARD_STEPS.length) * 100;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Mobile: Horizontal compact view */}
      <div className="lg:hidden">
        <MobileStepIndicator
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          getStepStatus={getStepStatus}
          onStepClick={onStepClick}
          progress={progress}
        />
      </div>

      {/* Desktop: Vertical stepper */}
      <div className="hidden lg:block">
        <DesktopStepper
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          getStepStatus={getStepStatus}
          onStepClick={onStepClick}
        />
      </div>
    </div>
  );
}

/**
 * Mobile horizontal step indicator
 */
function MobileStepIndicator({
  steps,
  currentStep,
  getStepStatus,
  onStepClick,
  progress,
}: {
  steps: WizardStepConfig[];
  currentStep: WizardStepId;
  getStepStatus: (step: WizardStepId) => StepStatus;
  onStepClick: (step: WizardStepId) => void;
  progress: number;
}) {
  const currentConfig = steps.find((s) => s.id === currentStep);
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="space-y-3 pb-4">
      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Step dots and current label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isClickable = status !== "locked";

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  status === "current" && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                  status === "completed" && "bg-primary text-primary-foreground",
                  status === "available" && "bg-muted text-muted-foreground hover:bg-accent",
                  status === "locked" && "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                {status === "completed" ? (
                  <motion.div
                    variants={checkmarkVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <CompletedIcon className="h-4 w-4" />
                  </motion.div>
                ) : status === "locked" ? (
                  <LockedIcon className="h-3 w-3" />
                ) : (
                  index + 1
                )}
              </button>
            );
          })}
        </div>

        <div className="text-right">
          <AndamioText variant="small" className="font-medium text-foreground">{currentConfig?.title}</AndamioText>
          <AndamioText variant="small" className="text-xs">
            Step {currentIndex + 1} of {steps.length}
          </AndamioText>
        </div>
      </div>
    </div>
  );
}

/**
 * Desktop vertical stepper
 */
function DesktopStepper({
  steps,
  currentStep: _currentStep,
  getStepStatus,
  onStepClick,
}: {
  steps: WizardStepConfig[];
  currentStep: WizardStepId;
  getStepStatus: (step: WizardStepId) => StepStatus;
  onStepClick: (step: WizardStepId) => void;
}) {
  return (
    <nav className="space-y-1">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        const isClickable = status !== "locked";
        const Icon = step.icon;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="relative">
            {/* Connecting line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-5 top-12 w-0.5 h-8",
                  status === "completed" ? "bg-primary" : "bg-border"
                )}
              />
            )}

            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                "w-full flex items-start gap-4 p-3 rounded-lg text-left transition-all",
                status === "current" && "bg-primary/5 ring-1 ring-primary/20",
                status === "completed" && "hover:bg-accent",
                status === "available" && "hover:bg-accent",
                status === "locked" && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Step indicator */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                  status === "current" && "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                  status === "completed" && "bg-primary text-primary-foreground",
                  status === "available" && "bg-muted text-muted-foreground",
                  status === "locked" && "bg-muted/50 text-muted-foreground/50"
                )}
              >
                {status === "completed" ? (
                  <motion.div
                    variants={checkmarkVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <CompletedIcon className="h-5 w-5" />
                  </motion.div>
                ) : status === "locked" ? (
                  <LockedIcon className="h-4 w-4" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <AndamioText
                    as="span"
                    className={cn(
                      "font-medium",
                      status === "current" && "text-primary",
                      status === "completed" && "text-foreground",
                      status === "available" && "text-muted-foreground",
                      status === "locked" && "text-muted-foreground/50"
                    )}
                  >
                    {step.title}
                  </AndamioText>
                  {step.optional && (
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                </div>
                <AndamioText
                  variant="small"
                  className={cn(
                    status === "current" && "text-muted-foreground",
                    status !== "current" && "text-muted-foreground/70"
                  )}
                >
                  {step.subtitle}
                </AndamioText>
              </div>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

