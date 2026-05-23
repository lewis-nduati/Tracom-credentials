"use client";

import React from "react";
import Link from "next/link";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import {
  ManagerIcon,
  RefreshIcon,
  ProjectIcon,
  ExternalLinkIcon,
} from "~/components/icons";
import { useDashboardData } from "~/contexts/dashboard-context";

interface ManagingProjectsSummaryProps {
  accessTokenAlias: string | null | undefined;
}

/**
 * Managing Projects Summary Card
 *
 * Displays a summary of projects the user is managing.
 * Shows on the dashboard for authenticated users who are project managers.
 *
 * Now powered by the consolidated dashboard endpoint.
 *
 * UX States:
 * - Loading: Skeleton cards
 * - Empty: Don't show card (most users won't be managers)
 * - Error: Silent fail (log only)
 */
export function ManagingProjectsSummary({ accessTokenAlias }: ManagingProjectsSummaryProps) {
  const { projects, isLoading, error, refetch } = useDashboardData();

  // No access token - don't show this component
  if (!accessTokenAlias) {
    return null;
  }

  // Loading state - skeleton cards
  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardIconHeader icon={ManagerIcon} title="Managing" />
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-muted/30">
              <AndamioSkeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <AndamioSkeleton className="h-4 w-32" />
                <AndamioSkeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  const managingProjects = projects?.managing ?? [];

  // Empty state or error (silent fail shows empty) - don't show card if empty
  // (Most users won't be managers, so showing an empty card is not helpful)
  if (managingProjects.length === 0 || error) {
    return null;
  }

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <AndamioCardIconHeader icon={ManagerIcon} title="Managing" />
          <div className="flex items-center gap-2">
            <AndamioBadge variant="secondary" className="text-xs">
              {managingProjects.length} active
            </AndamioBadge>
            <AndamioButton variant="ghost" size="icon-sm" onClick={refetch}>
              <RefreshIcon className="h-4 w-4" />
            </AndamioButton>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-3">
        {/* Summary stat */}
        <div className="flex items-center gap-2 bg-secondary/10 rounded-lg px-3 py-2">
          <ManagerIcon className="h-4 w-4 text-secondary" />
          <div>
            <AndamioText className="text-lg font-semibold">{managingProjects.length}</AndamioText>
            <AndamioText variant="small" className="text-xs">
              {managingProjects.length === 1 ? "Project" : "Projects"} managing
            </AndamioText>
          </div>
        </div>

        {/* Project list */}
        <div className="space-y-1.5">
          {managingProjects.slice(0, 3).map((project) => (
            <Link
              key={project.projectId}
              href={`/studio/project/${project.projectId}`}
              className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ProjectIcon className="h-3.5 w-3.5 text-secondary shrink-0" />
                <span className="text-xs truncate">
                  {project.title || "Unregistered Project"}
                </span>
              </div>
              <ExternalLinkIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
          {managingProjects.length > 3 && (
            <AndamioText variant="small" className="text-xs text-center pt-1">
              +{managingProjects.length - 3} more projects
            </AndamioText>
          )}
        </div>

        {/* Browse projects link */}
        <div className="pt-2">
          <Link href="/project" className="block">
            <AndamioButton variant="outline" size="sm" className="w-full">
              <ManagerIcon className="mr-2 h-3 w-3" />
              View All Projects
            </AndamioButton>
          </Link>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
