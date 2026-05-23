"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  CredentialIcon,
  SLTIcon,
  AssessIcon,
  LessonIcon,
  IntroductionIcon,
  VerifiedIcon,
  SuccessIcon,
} from "~/components/icons";
import { AndamioScrollArea } from "~/components/andamio/andamio-scroll-area";
import { cn } from "~/lib/utils";
import type { IconComponent } from "~/types/ui";

export interface OutlineStep {
  /** Unique identifier for the step (used in URL) */
  id: string;
  /** Display label */
  label: string;
  /** Icon to display */
  icon: IconComponent;
  /** Whether step is completed */
  isComplete?: boolean;
  /** Number of items (e.g., "3 SLTs") */
  count?: number;
  /** Whether step is currently active */
  isActive?: boolean;
  /** Whether step is locked (can't be clicked) */
  isLocked?: boolean;
}

interface StudioOutlinePanelProps {
  /** Steps to display in the outline */
  steps: OutlineStep[];
  /** Callback when step is clicked */
  onStepClick?: (stepId: string) => void;
  /** Whether panel is collapsed to icons only */
  isCollapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** URL parameter name for step (defaults to "step") */
  stepParam?: string;
  /** Title for the outline panel */
  title?: string;
}

/**
 * Default wizard steps for module editing
 */
export const MODULE_WIZARD_STEPS: Omit<OutlineStep, "isComplete" | "count" | "isActive">[] = [
  { id: "credential", label: "Credential Title", icon: CredentialIcon },
  { id: "slts", label: "Learning Targets", icon: SLTIcon },
  { id: "assignment", label: "Assignment", icon: AssessIcon },
  { id: "lessons", label: "Lessons", icon: LessonIcon },
  { id: "introduction", label: "Introduction", icon: IntroductionIcon },
  { id: "review", label: "Review", icon: VerifiedIcon },
];

/**
 * Collapsible outline panel for studio pages
 * Shows wizard steps/sections with completion status
 * Click to navigate (URL-based)
 */
export function StudioOutlinePanel({
  steps,
  onStepClick,
  isCollapsed: _isCollapsed = false,
  onCollapsedChange: _onCollapsedChange,
  stepParam = "step",
  title: _title = "Outline",
}: StudioOutlinePanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStep = searchParams.get(stepParam);

  const handleStepClick = (stepId: string) => {
    if (onStepClick) {
      onStepClick(stepId);
    } else {
      // Default: update URL param
      const params = new URLSearchParams(searchParams.toString());
      params.set(stepParam, stepId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Steps list */}
      <AndamioScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-3">
          {steps.map((step) => {
            const isActive = step.isActive ?? currentStep === step.id;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                onClick={() => !step.isLocked && handleStepClick(step.id)}
                disabled={step.isLocked}
                className={cn(
                  "group flex w-full items-center gap-3 px-3 py-3 text-left rounded-sm border transition-all duration-150",
                  isActive
                    ? "bg-primary/10 border-primary/30 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border active:bg-muted/70",
                  step.isLocked && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Status icon */}
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md flex-shrink-0",
                  step.isComplete ? "bg-primary/10" : isActive ? "bg-primary/10" : "bg-muted"
                )}>
                  {step.isComplete ? (
                    <SuccessIcon className="h-4 w-4 text-primary" />
                  ) : (
                    <Icon className={cn(
                      "h-4 w-4",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium truncate transition-colors",
                      isActive ? "text-primary" : "group-hover:text-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {step.count !== undefined && (
                    <span className="text-[10px] text-muted-foreground">
                      {step.count} item{step.count !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Completion indicator on right */}
                {step.isComplete && (
                  <SuccessIcon className={cn(
                    "h-4 w-4 flex-shrink-0 text-primary"
                  )} />
                )}
              </button>
            );
          })}
        </div>
      </AndamioScrollArea>

      {/* Footer with progress summary */}
      <div className="border-t border-border px-3 py-2 bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>
            {steps.filter((s) => s.isComplete).length}/{steps.length}
          </span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${(steps.filter((s) => s.isComplete).length / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
