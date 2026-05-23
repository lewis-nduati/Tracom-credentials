"use client";

import React from "react";
import { motion } from "framer-motion";
import { BackIcon, ForwardIcon, SkipIcon, SettingsIcon } from "~/components/icons";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { cn } from "~/lib/utils";

interface WizardNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  onSkip?: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  canSkip?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  skipLabel?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * WizardNavigation - Back/Next buttons with optional skip
 */
export function WizardNavigation({
  onPrevious,
  onNext,
  onSkip,
  canGoPrevious,
  canGoNext,
  canSkip = false,
  nextLabel = "Continue",
  previousLabel = "Back",
  skipLabel = "Skip this step",
  isLoading = false,
  className,
}: WizardNavigationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t",
        className
      )}
    >
      {/* Previous button */}
      <AndamioButton
        variant="ghost"
        onClick={onPrevious}
        disabled={!canGoPrevious || isLoading}
        className="w-full sm:w-auto"
      >
        <BackIcon className="h-4 w-4 mr-2" />
        {previousLabel}
      </AndamioButton>

      {/* Right side: Skip + Next */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {canSkip && onSkip && (
          <AndamioButton
            variant="ghost"
            onClick={onSkip}
            disabled={isLoading}
            className="text-muted-foreground"
          >
            <SkipIcon className="h-4 w-4 mr-2" />
            {skipLabel}
          </AndamioButton>
        )}

        <AndamioButton
          onClick={onNext}
          disabled={!canGoNext || isLoading}
          isLoading={isLoading}
          className="w-full sm:w-auto"
        >
          {nextLabel}
          {!isLoading && <ForwardIcon className="h-4 w-4 ml-2" />}
        </AndamioButton>
      </div>
    </motion.div>
  );
}

interface WizardHeaderProps {
  moduleTitle?: string;
  onExitWizard: () => void;
  className?: string;
}

/**
 * WizardHeader - Top bar with exit option
 */
export function WizardHeader({
  moduleTitle,
  onExitWizard,
  className,
}: WizardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between pb-4 border-b",
        className
      )}
    >
      <div>
        <AndamioHeading level={1} size="lg">Module Design Wizard</AndamioHeading>
        {moduleTitle && (
          <AndamioText variant="small">{moduleTitle}</AndamioText>
        )}
      </div>

      <AndamioButton
        variant="ghost"
        size="sm"
        onClick={onExitWizard}
        className="text-muted-foreground"
      >
        <SettingsIcon className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Advanced Mode</span>
        <span className="sm:hidden">Advanced</span>
      </AndamioButton>
    </div>
  );
}
