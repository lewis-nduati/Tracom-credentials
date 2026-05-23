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
import { AndamioEmptyState } from "~/components/andamio/andamio-empty-state";
import {
  ContributorIcon,
  RefreshIcon,
  ProjectIcon,
  ExternalLinkIcon,
} from "~/components/icons";
import { useDashboardData } from "~/contexts/dashboard-context";

interface ContributingProjectsSummaryProps {
  accessTokenAlias: string | null | undefined;
}

/**
 * Contributing Projects Summary Card
 *
 * Displays a summary of projects the user is contributing to.
 * Shows on the dashboard for authenticated users.
 *
 * Now powered by the consolidated dashboard endpoint.
 *
 * UX States:
 * - Loading: Skeleton cards
 * - Empty: Action-oriented with Browse Projects button
 * - Error: Silent fail (log only, show empty state)
 */
export function ContributingProjectsSummary({ accessTokenAlias }: ContributingProjectsSummaryProps) {
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
          <AndamioCardIconHeader icon={ContributorIcon} title="My Contributions" />
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

  const contributingProjects = projects?.contributing ?? [];

  // Empty state or error (silent fail shows empty) - action-oriented
  if (contributingProjects.length === 0 || error) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <AndamioCardIconHeader icon={ContributorIcon} title="My Contributions" />
            {!error && (
              <AndamioButton variant="ghost" size="icon-sm" onClick={refetch}>
                <RefreshIcon className="h-4 w-4" />
              </AndamioButton>
            )}
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioEmptyState
            icon={ProjectIcon}
            title="No Contributions Yet"
            description="Join a project to start contributing and earning rewards."
            action={
              <Link href="/project">
                <AndamioButton size="sm">
                  <ProjectIcon className="mr-2 h-3 w-3" />
                  Browse Projects
                </AndamioButton>
              </Link>
            }
          />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <AndamioCardIconHeader icon={ContributorIcon} title="My Contributions" />
          <div className="flex items-center gap-2">
            <AndamioBadge variant="secondary" className="text-xs">
              {contributingProjects.length} active
            </AndamioBadge>
            <AndamioButton variant="ghost" size="icon-sm" onClick={refetch}>
              <RefreshIcon className="h-4 w-4" />
            </AndamioButton>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-3">
        {/* Summary stat */}
        <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
          <ContributorIcon className="h-4 w-4 text-primary" />
          <div>
            <AndamioText className="text-lg font-semibold">{contributingProjects.length}</AndamioText>
            <AndamioText variant="small" className="text-xs">
              {contributingProjects.length === 1 ? "Project" : "Projects"} contributing to
            </AndamioText>
          </div>
        </div>

        {/* Project list */}
        <div className="space-y-1.5">
          {contributingProjects.slice(0, 3).map((project) => (
            <Link
              key={project.projectId}
              href={`/project/${project.projectId}/contributor`}
              className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ProjectIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs truncate">
                  {project.title || `${project.projectId.slice(0, 16)}...`}
                </span>
              </div>
              <ExternalLinkIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
          {contributingProjects.length > 3 && (
            <AndamioText variant="small" className="text-xs text-center pt-1">
              +{contributingProjects.length - 3} more projects
            </AndamioText>
          )}
        </div>

        {/* Browse more link */}
        <div className="pt-2">
          <Link href="/project" className="block">
            <AndamioButton variant="outline" size="sm" className="w-full">
              <ProjectIcon className="mr-2 h-3 w-3" />
              Browse More Projects
            </AndamioButton>
          </Link>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
