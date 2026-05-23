"use client";

import React from "react";
import { useProject } from "~/hooks/api";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ManagerIcon, OnChainIcon } from "~/components/icons";
import { cn } from "~/lib/utils";

export interface ProjectManagersCardProps {
  projectId: string;
  className?: string;
}

/**
 * Card showing project admin and managers from merged API data
 *
 * Note: Chain sync now happens automatically on the backend.
 * This component displays the combined on-chain + database team data.
 */
export function ProjectManagersCard({
  projectId,
  className,
}: ProjectManagersCardProps) {
  // Get merged project data (includes on-chain managers)
  const { data: project, isLoading } = useProject(projectId);

  // Get team from merged project data
  const projectOwner = project?.owner ?? null;
  const managers = project?.managers ?? [];

  return (
    <AndamioCard className={cn("", className)}>
      <AndamioCardHeader className="pb-3">
        <AndamioCardTitle className="text-base flex items-center gap-2">
          <ManagerIcon className="h-4 w-4" />
          Project Team
        </AndamioCardTitle>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Admin (Owner) */}
        {projectOwner && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <OnChainIcon className="h-3.5 w-3.5 text-primary" />
              <AndamioText variant="small" className="font-medium">
                Admin (Owner)
              </AndamioText>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <AndamioBadge variant="default" className="font-mono text-xs">
                {projectOwner}
              </AndamioBadge>
            </div>
          </div>
        )}

        {/* Managers */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <OnChainIcon className="h-3.5 w-3.5 text-primary" />
            <AndamioText variant="small" className="font-medium">
              Managers
            </AndamioText>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {isLoading ? (
              <>
                <AndamioSkeleton className="h-6 w-20" />
                <AndamioSkeleton className="h-6 w-16" />
              </>
            ) : !project ? (
              <AndamioText variant="small" className="text-muted-foreground">
                Project data loading...
              </AndamioText>
            ) : managers.length === 0 ? (
              <AndamioText variant="small" className="text-muted-foreground">
                No managers assigned
              </AndamioText>
            ) : (
              managers.map((manager: string) => (
                <AndamioBadge
                  key={manager}
                  variant="secondary"
                  className="font-mono text-xs"
                >
                  {manager}
                </AndamioBadge>
              ))
            )}
          </div>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
