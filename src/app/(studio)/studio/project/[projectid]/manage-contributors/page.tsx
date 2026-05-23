"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useProject } from "~/hooks/api";
import { useManagerCommitments } from "~/hooks/api/project/use-project-manager";
import {
  AndamioBadge,
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
  AndamioTableContainer,
  AndamioBackButton,
  AndamioErrorAlert,
  AndamioText,
  AndamioDashboardStat,
  AndamioScrollArea,
} from "~/components/andamio";
import { ContributorIcon, AssignmentIcon, SuccessIcon } from "~/components/icons";
import { RequireProjectAccess } from "~/components/auth/require-project-access";

/**
 * Manage Contributors Page
 *
 * View on-chain contributors for a project with task commitment stats.
 * Contributors from the merged project endpoint, enriched with commitment data.
 *
 * Wrapped in RequireProjectAccess to ensure only project owners
 * and managers can view contributor data.
 */
export default function ManageContributorsPage() {
  const params = useParams();
  const projectId = params.projectid as string;

  return (
    <RequireProjectAccess
      projectId={projectId}
      title="Manage Contributors"
      description="Connect your wallet to view contributors"
    >
      <ManageContributorsContent projectId={projectId} />
    </RequireProjectAccess>
  );
}

function ManageContributorsContent({ projectId }: { projectId: string }) {
  const { data: project, isLoading, error: projectError } = useProject(projectId);
  const { data: commitments, isLoading: commitmentsLoading } = useManagerCommitments(projectId);

  // Build per-contributor stats from commitments.
  // Join key: commitment.submittedBy === contributor.alias (both are the on-chain alias)
  const contributorStats = useMemo(() => {
    const stats = new Map<string, { committed: number; accepted: number; pending: number }>();
    for (const c of commitments ?? []) {
      const entry = stats.get(c.submittedBy) ?? { committed: 0, accepted: 0, pending: 0 };
      entry.committed++;
      if (c.commitmentStatus === "ACCEPTED") entry.accepted++;
      if (c.commitmentStatus === "SUBMITTED") entry.pending++;
      stats.set(c.submittedBy, entry);
    }
    return stats;
  }, [commitments]);

  // Aggregate stats for dashboard
  const totalAccepted = useMemo(
    () => Array.from(contributorStats.values()).reduce((sum, s) => sum + s.accepted, 0),
    [contributorStats]
  );

  if (isLoading || commitmentsLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  if (projectError || !project) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />
        <AndamioPageHeader title="Contributors" />
        <AndamioErrorAlert error={projectError?.message ?? "Project not found"} />
      </div>
    );
  }

  const contributors = project.contributors ?? [];

  return (
    <AndamioScrollArea className="h-full">
    <div className="min-h-full">
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />

      <AndamioPageHeader
        title="Contributors"
        description={`On-chain contributors for ${project.title ?? "this project"}`}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <AndamioDashboardStat
          icon={ContributorIcon}
          label="Total Contributors"
          value={contributors.length}
          valueColor={contributors.length > 0 ? "success" : undefined}
          iconColor={contributors.length > 0 ? "success" : undefined}
        />
        <AndamioDashboardStat
          icon={AssignmentIcon}
          label="Tasks Completed"
          value={totalAccepted}
          valueColor={totalAccepted > 0 ? "success" : undefined}
          iconColor={totalAccepted > 0 ? "success" : undefined}
        />
      </div>

      {/* Contributors Card */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle className="flex items-center gap-2">
            <ContributorIcon className="h-5 w-5" />
            Contributors
          </AndamioCardTitle>
          <AndamioCardDescription>
            Contributors registered on-chain with their task activity
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          {contributors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
                <ContributorIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <AndamioText className="font-medium">No contributors yet</AndamioText>
              <AndamioText variant="muted" className="mt-1 max-w-[320px]">
                Share your project link with potential contributors. They can join by connecting their wallet and committing to tasks.
              </AndamioText>
            </div>
          )}

          {contributors.length > 0 && (
            <AndamioTableContainer>
              <AndamioTable>
                <AndamioTableHeader>
                  <AndamioTableRow>
                    <AndamioTableHead className="w-[50px]">#</AndamioTableHead>
                    <AndamioTableHead>Contributor</AndamioTableHead>
                    <AndamioTableHead className="w-[100px] text-center">Committed</AndamioTableHead>
                    <AndamioTableHead className="w-[100px] text-center">Completed</AndamioTableHead>
                    <AndamioTableHead className="w-[100px] text-center">Pending</AndamioTableHead>
                  </AndamioTableRow>
                </AndamioTableHeader>
                <AndamioTableBody>
                  {contributors.map((contributor, index) => {
                    const stats = contributorStats.get(contributor.alias);
                    return (
                      <AndamioTableRow key={contributor.alias}>
                        <AndamioTableCell className="text-muted-foreground">
                          {index + 1}
                        </AndamioTableCell>
                        <AndamioTableCell className="font-mono">
                          {contributor.alias}
                        </AndamioTableCell>
                        <AndamioTableCell className="text-center">
                          {stats?.committed ?? 0}
                        </AndamioTableCell>
                        <AndamioTableCell className="text-center">
                          {stats?.accepted ? (
                            <AndamioBadge variant="default" className="gap-1">
                              <SuccessIcon className="h-3 w-3" />
                              {stats.accepted}
                            </AndamioBadge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </AndamioTableCell>
                        <AndamioTableCell className="text-center">
                          {stats?.pending ? (
                            <AndamioBadge variant="secondary">{stats.pending}</AndamioBadge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </AndamioTableCell>
                      </AndamioTableRow>
                    );
                  })}
                </AndamioTableBody>
              </AndamioTable>
            </AndamioTableContainer>
          )}
        </AndamioCardContent>
      </AndamioCard>
    </div>
    </div>
    </AndamioScrollArea>
  );
}
