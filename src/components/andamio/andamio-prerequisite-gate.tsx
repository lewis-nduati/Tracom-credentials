"use client";

import React from "react";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { LockedIcon, ForwardIcon } from "~/components/icons";
import { AndamioBadge, AndamioText } from "~/components/andamio";

interface AndamioPrerequisiteGateProps {
  /**
   * Whether the user has the required credential to unlock this feature.
   */
  hasCredential: boolean;
  /**
   * Human-readable label for the required credential (e.g., "Advanced Smart Contracts")
   */
  requiredLabel: string;
  /**
   * Optional URL to the course or module that grants this credential
   */
  unlockPath?: string;
  /**
   * Content to be protected
   */
  children: React.ReactNode;
  /**
   * Optional className for the container
   */
  className?: string;
}

/**
 * soft-gate component for "Earned Progression" (Design Principle 3).
 * 
 * Instead of hiding features, it shows them in a "ghosted" state with 
 * a clear path to unlock them. This turns the UI into a roadmap.
 */
export function AndamioPrerequisiteGate({
  hasCredential,
  requiredLabel,
  unlockPath,
  children,
  className,
}: AndamioPrerequisiteGateProps) {
  if (hasCredential) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative group", className)}>
      {/* Ghosted Content — hidden from screen readers; the unlock overlay announces the locked state */}
      <div aria-hidden="true" className="grayscale opacity-40 pointer-events-none select-none blur-[1px] transition-all duration-500">
        {children}
      </div>

      {/* Unlock Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <div className="bg-card/80 backdrop-blur-md border border-primary/20 rounded-sm p-6 shadow-xl flex flex-col items-center text-center gap-3 animate-in-slide-up">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <LockedIcon className="h-6 w-6 text-primary" />
          </div>
          
          <div className="space-y-1">
            <AndamioBadge variant="secondary" className="mb-2">
              Locked Feature
            </AndamioBadge>
            <AndamioText variant="default" className="font-semibold">
              Requires {requiredLabel}
            </AndamioText>
            <AndamioText variant="small" className="max-w-[200px]">
              Complete the required module to unlock this capability.
            </AndamioText>
          </div>

          {unlockPath && (
            <Link 
              href={unlockPath}
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-standard"
            >
              Start Learning
              <ForwardIcon className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
