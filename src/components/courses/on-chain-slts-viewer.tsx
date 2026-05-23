"use client";

import React from "react";
import { useCourse, type CourseModule } from "~/hooks/api";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioBadge,
  AndamioSkeleton,
  AndamioCardLoading,
  AndamioAlert,
  AndamioAlertDescription,
  AndamioTooltip,
  AndamioTooltipContent,
  AndamioTooltipTrigger,
} from "~/components/andamio";
import {
  SuccessIcon,
  AlertIcon,
  OnChainIcon,
} from "~/components/icons";
import { AndamioText } from "~/components/andamio/andamio-text";

// =============================================================================
// Types
// =============================================================================

interface OnChainSltsViewerProps {
  courseId: string;
  moduleHash?: string;
  /** If true, shows compact inline view */
  compact?: boolean;
}

interface OnChainModuleCardProps {
  module: CourseModule;
  compact?: boolean;
}

// =============================================================================
// Components
// =============================================================================

/**
 * Card displaying a single on-chain module's SLTs
 */
function OnChainModuleCard({ module, compact = false }: OnChainModuleCardProps) {
  const assignmentId = module.sltHash ?? "";
  const slts = module.onChainSlts ?? [];
  const truncatedHash = assignmentId
    ? `${assignmentId.slice(0, 8)}...${assignmentId.slice(-8)}`
    : "Unknown";

  if (compact) {
    return (
      <div className="rounded-sm border bg-muted/30 p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              <OnChainIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Verified</span>
          </div>
          <code className="text-xs font-mono text-muted-foreground">{truncatedHash}</code>
        </div>
        <ul className="space-y-1.5">
          {slts.map((slt, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <AndamioBadge variant="outline" className="shrink-0 text-xs">
                {index + 1}
              </AndamioBadge>
              <span>{slt}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <OnChainIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <AndamioCardTitle className="text-base">On-Chain Learning Targets</AndamioCardTitle>
              <AndamioCardDescription>
                Verified on the Cardano blockchain
              </AndamioCardDescription>
            </div>
          </div>
          <AndamioTooltip>
            <AndamioTooltipTrigger asChild>
              <AndamioBadge variant="outline" className="font-mono text-xs cursor-help">
                {truncatedHash}
              </AndamioBadge>
            </AndamioTooltipTrigger>
            <AndamioTooltipContent>
              <AndamioText variant="small">Module Hash: {assignmentId}</AndamioText>
            </AndamioTooltipContent>
          </AndamioTooltip>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent>
        <div className="space-y-3">
          {slts.map((slt, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-sm border bg-background"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {index + 1}
              </div>
              <div className="flex-1 pt-1">
                <AndamioText className="text-sm">{slt}</AndamioText>
              </div>
              <SuccessIcon className="h-4 w-4 shrink-0 text-primary mt-1" />
            </div>
          ))}
        </div>

        {/* Module metadata */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
          {module.createdBy && (
            <div>
              <span className="font-medium">Created by:</span> {module.createdBy}
            </div>
          )}
          {module.prerequisites && module.prerequisites.length > 0 && (
            <div>
              <span className="font-medium">Prerequisites:</span>{" "}
              {module.prerequisites.map((p, i) => (
                <code key={i} className="bg-muted px-1 rounded ml-1">
                  {p.slice(0, 8)}...
                </code>
              ))}
            </div>
          )}
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}

/**
 * Viewer component for on-chain SLTs
 *
 * Shows SLTs that are minted on the Cardano blockchain for a course.
 * Can display all modules or a specific module by hash.
 */
export function OnChainSltsViewer({
  courseId,
  moduleHash,
  compact = false,
}: OnChainSltsViewerProps) {
  const { data: course, isLoading, error } = useCourse(courseId);

  // Loading state
  if (isLoading) {
    return compact ? (
      <AndamioSkeleton className="h-24 w-full rounded-lg" />
    ) : (
      <AndamioCardLoading title="On-Chain Learning Targets" lines={3} />
    );
  }

  // Error state
  if (error) {
    return (
      <AndamioAlert variant="destructive">
        <AlertIcon className="h-4 w-4" />
        <AndamioAlertDescription>
          Failed to load on-chain data: {error.message}
        </AndamioAlertDescription>
      </AndamioAlert>
    );
  }

  // No course data
  if (!course) {
    return (
      <AndamioAlert>
        <OnChainIcon className="h-4 w-4" />
        <AndamioAlertDescription>
          This course is not yet registered on the blockchain.
        </AndamioAlertDescription>
      </AndamioAlert>
    );
  }

  // Get on-chain modules from merged data
  const onChainModules = course.modules ?? [];

  // No modules on-chain
  if (onChainModules.length === 0) {
    return (
      <AndamioAlert>
        <OnChainIcon className="h-4 w-4" />
        <AndamioAlertDescription>
          No modules have been minted on-chain for this course yet.
        </AndamioAlertDescription>
      </AndamioAlert>
    );
  }

  // Filter to specific module if hash provided
  const modulesToShow = moduleHash
    ? onChainModules.filter((m) => m.sltHash === moduleHash)
    : onChainModules;

  if (moduleHash && modulesToShow.length === 0) {
    return (
      <AndamioAlert>
        <OnChainIcon className="h-4 w-4" />
        <AndamioAlertDescription>
          Module not found on-chain. The SLTs may not have been minted yet.
        </AndamioAlertDescription>
      </AndamioAlert>
    );
  }

  return (
    <div className="space-y-4">
      {modulesToShow.map((courseModule, index) => (
        <OnChainModuleCard
          key={courseModule.sltHash ?? index}
          module={courseModule}
          compact={compact}
        />
      ))}
    </div>
  );
}

/**
 * Summary badge showing on-chain SLT count for a course
 */
export function OnChainSltsBadge({
  courseId,
}: {
  courseId: string;
}) {
  const { data: course, isLoading } = useCourse(courseId);

  if (isLoading) {
    return <AndamioSkeleton className="h-5 w-24" />;
  }

  const onChainModules = course?.modules ?? [];
  if (onChainModules.length === 0) {
    return null;
  }

  const totalSlts = onChainModules.reduce(
    (sum: number, m) => sum + (m.onChainSlts?.length ?? 0),
    0
  );

  return (
    <AndamioTooltip>
      <AndamioTooltipTrigger asChild>
        <AndamioBadge variant="outline" className="text-success border-success/30">
          <OnChainIcon className="h-3 w-3 mr-1" />
          {totalSlts} verified
        </AndamioBadge>
      </AndamioTooltipTrigger>
      <AndamioTooltipContent>
        <AndamioText variant="small">
          {onChainModules.length} modules with {totalSlts} SLTs verified on Cardano
        </AndamioText>
      </AndamioTooltipContent>
    </AndamioTooltip>
  );
}
