"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SuccessIcon,
  PendingIcon,
  UserIcon,
  CredentialIcon,
  WalletIcon,
  TaskIcon,
} from "~/components/icons";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardFooter,
} from "~/components/andamio/andamio-card";
import {
  AndamioTooltip,
  AndamioTooltipContent,
  AndamioTooltipTrigger,
} from "~/components/andamio/andamio-tooltip";
import type { Project } from "~/hooks/api";
import type { EligibilityResult } from "~/lib/project-eligibility";

interface ProjectCardProps {
  project: Project;
  /** Eligibility result for authenticated users */
  eligibility?: EligibilityResult;
  /** Whether the user is authenticated */
  isAuthenticated?: boolean;
}

/**
 * Eligibility badge with tooltip
 */
function EligibilityBadge({
  eligibility,
  isAuthenticated,
}: {
  eligibility?: EligibilityResult;
  isAuthenticated?: boolean;
}) {
  if (!isAuthenticated || !eligibility) return null;

  if (eligibility.eligible) {
    if (eligibility.totalRequired === 0) {
      return (
        <AndamioTooltip>
          <AndamioTooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <AndamioBadge variant="outline" className="text-secondary border-secondary/30">
                <SuccessIcon className="h-3 w-3 mr-1" />
                Open
              </AndamioBadge>
            </div>
          </AndamioTooltipTrigger>
          <AndamioTooltipContent>
            No prerequisites required — anyone can contribute
          </AndamioTooltipContent>
        </AndamioTooltip>
      );
    }
    return (
      <AndamioTooltip>
        <AndamioTooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <AndamioBadge variant="outline" className="text-secondary border-secondary/30">
              <CredentialIcon className="h-3 w-3 mr-1" />
              Qualified
            </AndamioBadge>
          </div>
        </AndamioTooltipTrigger>
        <AndamioTooltipContent>
          You meet all {eligibility.totalRequired} prerequisite
          requirement{eligibility.totalRequired !== 1 ? "s" : ""}
        </AndamioTooltipContent>
      </AndamioTooltip>
    );
  }

  const progress =
    eligibility.totalRequired > 0
      ? Math.round((eligibility.totalCompleted / eligibility.totalRequired) * 100)
      : 0;

  return (
    <AndamioTooltip>
      <AndamioTooltipTrigger asChild>
        <div className="flex items-center gap-1.5">
          <AndamioBadge variant="outline" className="text-muted-foreground border-muted-foreground/30">
            <PendingIcon className="h-3 w-3 mr-1" />
            {eligibility.totalCompleted}/{eligibility.totalRequired}
          </AndamioBadge>
        </div>
      </AndamioTooltipTrigger>
      <AndamioTooltipContent>
        <div className="space-y-1">
          <div>
            Prerequisites: {eligibility.totalCompleted} of{" "}
            {eligibility.totalRequired} completed ({progress}%)
          </div>
          {eligibility.missingPrerequisites.length > 0 && (
            <div className="text-xs">
              Complete {eligibility.missingPrerequisites.length} more course
              {eligibility.missingPrerequisites.length !== 1 ? "s" : ""} to qualify
            </div>
          )}
        </div>
      </AndamioTooltipContent>
    </AndamioTooltip>
  );
}

/**
 * ProjectCard - Card with taller image header and title overlaid on gradient.
 * Description, badges, and footer sit on the solid card body below.
 */
export function ProjectCard({
  project,
  eligibility,
  isAuthenticated,
}: ProjectCardProps) {
  const [imageError, setImageError] = useState(false);
  const {
    projectId,
    title,
    description,
    imageUrl,
    ownerAlias,
    prerequisites,
    totalRewardLovelace,
    availableTaskCount,
  } = project;

  const displayTitle = title || projectId?.slice(0, 24) || "Untitled Project";
  const prereqCount = prerequisites?.length ?? 0;
  const showImage = imageUrl && !imageError;
  const rewardAda = totalRewardLovelace != null && totalRewardLovelace > 0
    ? totalRewardLovelace / 1_000_000
    : null;

  return (
    <Link
      href={`/project/${projectId}`}
      className="block group"
      data-testid="project-card"
    >
      <AndamioCard className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 group-hover:bg-accent/5">
        {/* Image header — taller, with title overlaid */}
        <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-xl -mt-6 -mx-0">
          {showImage ? (
            <Image
              src={imageUrl}
              alt={displayTitle}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-secondary/10" />
          )}
          {/* Gradient overlay for title readability */}
          <div className={showImage
            ? "absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
            : "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
          } />
          {/* Title overlay — pinned to bottom */}
          <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
            {/* White text for WCAG AA contrast against image/gradient overlays */}
            <h3
              className="text-base sm:text-lg font-semibold line-clamp-2 !m-0"
              style={{ color: "white" }}
            >
              {displayTitle}
            </h3>
          </div>
        </div>

        {/* Card body — solid background */}
        <AndamioCardContent>
          {description ? (
            <AndamioCardDescription className="line-clamp-2">
              {description}
            </AndamioCardDescription>
          ) : (
            <AndamioText variant="small" className="text-muted-foreground italic">
              No description available
            </AndamioText>
          )}
        </AndamioCardContent>

        <AndamioCardFooter className="border-t pt-3 mt-auto">
          <div className="flex items-center justify-between w-full gap-2 text-sm text-muted-foreground">
            <div className="flex flex-wrap justify-start items-center gap-2">
              {ownerAlias && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <UserIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-mono text-xs">{ownerAlias}</span>
                </div>
              )}
              {prereqCount > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <CredentialIcon className="h-3.5 w-3.5" />
                  <span className="text-xs">{prereqCount} {prereqCount === 1 ? "prereq" : "prereqs"}</span>
                </div>
              )}
              {rewardAda != null && (
                <div className="flex items-center gap-1.5 shrink-0 text-secondary">
                  <WalletIcon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{rewardAda} ADA</span>
                </div>
              )}
              {availableTaskCount != null && availableTaskCount > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <TaskIcon className="h-3.5 w-3.5" />
                  <span className="text-xs">{availableTaskCount} {availableTaskCount === 1 ? "task" : "tasks"}</span>
                </div>
              )}
            </div>
            <EligibilityBadge eligibility={eligibility} isAuthenticated={isAuthenticated} />
          </div>
        </AndamioCardFooter>
      </AndamioCard>
    </Link>
  );
}
