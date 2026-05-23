"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { AndamioText, AndamioHeading } from "~/components/andamio";
import { stepVariants, stepTransition } from "./types";
import type { WizardStepConfig } from "./types";

interface WizardStepProps {
  config: WizardStepConfig;
  direction: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * WizardStep - Animated wrapper for step content
 *
 * Provides consistent layout and entrance/exit animations
 */
export function WizardStep({
  config,
  direction,
  children,
  className,
}: WizardStepProps) {
  const Icon = config.icon;

  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={stepTransition}
      className={cn("space-y-6 w-full min-w-0 overflow-hidden", className)}
    >
      {/* Step header - minimal */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <AndamioHeading level={2} size="2xl">
          {config.subtitle}
        </AndamioHeading>
      </div>

      {/* Step content - constrained width to prevent overflow */}
      <div className="min-h-[400px] w-full min-w-0 overflow-hidden space-y-6">
        {children}
      </div>
    </motion.div>
  );
}

/**
 * WizardStepContent - Container for step-specific content
 */
export function WizardStepContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

/**
 * WizardStepTip - Helpful tip displayed in step content
 */
export function WizardStepTip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg bg-muted/50 border",
        className
      )}
    >
      <span className="text-base">💡</span>
      <AndamioText variant="small" className="leading-relaxed">{children}</AndamioText>
    </div>
  );
}

/**
 * WizardStepHighlight - Emphasized content block
 */
export function WizardStepHighlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "p-6 rounded-sm bg-primary/5 border border-primary/10",
        className
      )}
    >
      {children}
    </div>
  );
}
