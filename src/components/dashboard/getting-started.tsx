"use client";

import React from "react";
import Link from "next/link";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { VerifiedIcon, NeutralIcon, ForwardIcon, WalletIcon, AccessTokenIcon, CourseIcon, LearnerIcon } from "~/components/icons";
import { cn } from "~/lib/utils";
import type { StepItem } from "~/types/ui";

interface GettingStartedProps {
  isAuthenticated: boolean;
  hasAccessToken: boolean;
}

export function GettingStarted({ isAuthenticated, hasAccessToken }: GettingStartedProps) {
  // Only show the essential onboarding steps
  const steps: StepItem[] = [
    {
      id: "connect",
      title: "Connect Wallet",
      completed: isAuthenticated,
      icon: WalletIcon,
    },
    {
      id: "token",
      title: "Choose Your Alias",
      completed: hasAccessToken,
      icon: AccessTokenIcon,
    },
    {
      id: "explore",
      title: "Explore Courses",
      completed: false,
      icon: CourseIcon,
      link: "/course",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  // Don't show if user has completed onboarding (has access token)
  if (hasAccessToken) {
    return null;
  }

  return (
    <AndamioCard className="border-muted-foreground/30 bg-warning/5">
      <AndamioCardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/10">
              <LearnerIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <AndamioText variant="small" className="font-semibold text-foreground">Getting Started</AndamioText>
              <AndamioText variant="small" className="text-xs">
                {completedCount} of {steps.length} steps complete
              </AndamioText>
            </div>
          </div>

          {/* Steps - horizontal on desktop */}
          <div className="flex-1 flex items-center gap-2 sm:justify-end">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;

              return (
                <React.Fragment key={step.id}>
                  {step.link && !step.completed ? (
                    <Link
                      href={step.link}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
                        step.completed
                          ? "bg-primary/10 text-primary"
                          : "bg-muted hover:bg-accent"
                      )}
                    >
                      {step.completed ? (
                        <VerifiedIcon className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline font-medium">{step.title}</span>
                      {!step.completed && <ForwardIcon className="h-3 w-3" />}
                    </Link>
                  ) : (
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
                        step.completed
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {step.completed ? (
                        <VerifiedIcon className="h-4 w-4" />
                      ) : (
                        <NeutralIcon className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline font-medium">{step.title}</span>
                    </div>
                  )}
                  {!isLast && (
                    <div className="hidden sm:block h-px w-4 bg-border" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
