"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useProject } from "~/hooks/api";
import { useProjectTasks, groupTasksByHash } from "~/hooks/api/project/use-project";
import {
  AndamioBadge,
  AndamioButton,
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioEmptyState,
  AndamioTableContainer,
  AndamioBackButton,
  AndamioErrorAlert,
} from "~/components/andamio";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioCardDescription,
} from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  TaskIcon,
  ContributorIcon,
  CredentialIcon,
  TreasuryIcon,
  SuccessIcon,
  AlertIcon,
  CourseIcon,
  LockedIcon,
} from "~/components/icons";
import { PrerequisiteList } from "~/components/project/prerequisite-list";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useContributorCommitments } from "~/hooks/api/project/use-project-contributor";
import { useStudentCompletionsForPrereqs } from "~/hooks/api/course/use-student-completions-for-prereqs";
import { checkProjectEligibility } from "~/lib/project-eligibility";
import { formatLovelace } from "~/lib/cardano-utils";
import { NextIcon, PendingIcon } from "~/components/icons";

/**
 * Project detail page — the public-facing view of a project.
 *
 * Layout:
 * 1. Header (title, policy ID, Contribute CTA)
 * 2. Stats bar (treasury, tasks, contributors, credentials)
 * 3. Prerequisites + eligibility (combined, only if project has prereqs)
 * 4. Available Tasks table
 */
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectid as string;

  const { data: project, isLoading, error } = useProject(projectId);
  const { data: mergedTasks } = useProjectTasks(projectId);
  const { isAuthenticated, user } = useAndamioAuth();

  // Prerequisite eligibility
  const prereqCourseIds = React.useMemo(() => {
    if (!project?.prerequisites) return [];
    return project.prerequisites
      .map((p) => p.courseId)
      .filter((id): id is string => !!id);
  }, [project?.prerequisites]);

  const { completions } = useStudentCompletionsForPrereqs(prereqCourseIds);

  const prerequisites = React.useMemo(() => project?.prerequisites ?? [], [project?.prerequisites]);
  const eligibility = React.useMemo(() => {
    if (!isAuthenticated || prerequisites.length === 0) return null;
    return checkProjectEligibility(prerequisites, completions);
  }, [isAuthenticated, prerequisites, completions]);

  // Authenticated contributor commitments — reliable source for status + completed tasks.
  // project.assessments has empty taskHash (GH #178), so we use this instead.
  const { data: myCommitments = [] } = useContributorCommitments(projectId);

  // Derive contributor status from commitments (reliable source of truth).
  // project.submissions persists after acceptance, so can't be used for "pending" detection.
  // After Leave & Claim, the gateway may still return "ACCEPTED" — cross-reference
  // credentialClaims to detect the post-claim state and suppress stale banners.
  const contributorStatus = React.useMemo(() => {
    const alias = user?.accessTokenAlias;
    if (!alias || !project) return null;

    const isContributor = (project.contributors ?? []).some((c) => c.alias === alias);
    if (!isContributor) return null;

    const hasCommitted = myCommitments.some(c =>
      c.commitmentStatus === "COMMITTED" ||
      c.commitmentStatus === "REFUSED" ||
      c.commitmentStatus === "PENDING_TX_COMMIT"
    );
    if (hasCommitted) return "task_pending" as const;

    const hasAccepted = myCommitments.some(c => c.commitmentStatus === "ACCEPTED");
    const hasRewarded = myCommitments.some(c => c.commitmentStatus === "REWARDED");

    if (hasAccepted) return "task_accepted" as const;

    // All work is claimed and no active commitments — suppress stale banner.
    if (hasRewarded && !hasAccepted && !hasCommitted) return null;

    return "enrolled" as const;
  }, [user?.accessTokenAlias, project, myCommitments]);

  // Check if the current user has contributed (has submissions in this project)
  // MUST be above early returns to maintain consistent hook order.
  const isReturningContributor = React.useMemo(() => {
    const alias = user?.accessTokenAlias;
    if (!alias || !project?.submissions) return false;
    return project.submissions.some(s => s.submittedBy === alias);
  }, [user?.accessTokenAlias, project?.submissions]);

  // Filter to live tasks only (keep all instances — same taskHash = same content, different UTxOs)
  const allTasks = mergedTasks ?? project?.tasks ?? [];
  const liveTasks = React.useMemo(() => {
    return allTasks.filter((t) => t.taskStatus === "ON_CHAIN");
  }, [allTasks]);

  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href="/project" label="Back to Projects" />
        <AndamioErrorAlert error={error?.message ?? "Project not found"} />
      </div>
    );
  }

  const projectTitle = project.title || "Project";

  // Split into available vs completed.
  // Available = no commitment exists (task hash not in submissions).
  // Completed = manager accepted the assessment.
  // Tasks with a commitment but not yet accepted appear in neither table.
  const submittedTaskHashes = new Set(
    (project.submissions ?? []).map(s => s.taskHash).filter(Boolean),
  );

  // Use authenticated contributor commitments for completed tasks.
  // project.assessments has empty taskHash (GH #178), making it unreliable.
  const completedTaskHashes = new Set(
    myCommitments
      .filter(c => c.commitmentStatus === "ACCEPTED" || c.commitmentStatus === "REWARDED")
      .map(c => c.taskHash)
      .filter(Boolean),
  );
  const availableTasks = liveTasks.filter(t => !submittedTaskHashes.has(t.taskHash ?? ""));
  const completedTasks = liveTasks.filter(t => completedTaskHashes.has(t.taskHash ?? ""));

  // Group tasks by taskHash for display (same content = same hash, shown with count)
  const availableTaskGroups = groupTasksByHash(availableTasks);
  const completedTaskGroups = groupTasksByHash(completedTasks);

  // Derived stats
  const contributors = project.contributors ?? [];
  const credentialClaims = project.credentialClaims ?? [];
  const treasuryFundings = project.treasuryFundings ?? [];
  const totalFunding = treasuryFundings.reduce(
    (sum, f) => sum + (f.lovelaceAmount ?? 0),
    0,
  );

  const treasuryBalance = project.treasuryBalance ?? 0;
  const budgetSpent = Math.max(0, totalFunding - treasuryBalance);

  const availableRewards = availableTasks.reduce(
    (sum, t) => sum + (parseInt(t.lovelaceAmount ?? "0", 10) || 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div>
        <AndamioBackButton href="/project" label="Back to Projects" />

        <div className="mt-4">
          <AndamioPageHeader
            title={projectTitle}
            description={project.description || undefined}
            imageUrl={project.imageUrl ?? ""}
            action={
              isReturningContributor ? (
                <Link href={`/project/${projectId}/contributor`}>
                  <AndamioButton variant="outline">
                    <ContributorIcon className="h-4 w-4 mr-2" />
                    My Contributions
                  </AndamioButton>
                </Link>
              ) : undefined
            }
          />
        </div>

        <AndamioText variant="small" className="font-mono text-muted-foreground mt-1 truncate">
          {project.projectId}
        </AndamioText>
      </div>

      {/* ── Contributor Status Bar ──────────────────────────────── */}
      {contributorStatus && (
        <div className={`rounded-sm border p-4 flex items-center justify-between gap-4 ${
          contributorStatus === "task_accepted"
            ? "border-primary/30 bg-primary/5"
            : "border-muted-foreground/20 bg-muted/30"
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            {contributorStatus === "task_accepted" ? (
              <SuccessIcon className="h-5 w-5 text-primary shrink-0" />
            ) : contributorStatus === "task_pending" ? (
              <PendingIcon className="h-5 w-5 text-secondary shrink-0" />
            ) : (
              <ContributorIcon className="h-5 w-5 text-primary shrink-0" />
            )}
            <div className="min-w-0">
              <AndamioText className="font-medium">
                {contributorStatus === "task_accepted"
                  ? "Task Accepted — Action Required"
                  : contributorStatus === "task_pending"
                    ? "Task Pending Review"
                    : "You're contributing to this project"}
              </AndamioText>
              <AndamioText variant="small" className="text-muted-foreground">
                {contributorStatus === "task_accepted"
                  ? "Your work was approved! Claim your reward or commit to a new task."
                  : contributorStatus === "task_pending"
                    ? "Your submission is waiting for manager review."
                    : "You have an active contributor role."}
              </AndamioText>
            </div>
          </div>
          <Link href={`/project/${projectId}/contributor`}>
            <AndamioButton size="sm" variant={contributorStatus === "task_accepted" ? "default" : "outline"}>
              {contributorStatus === "task_accepted" ? "Claim Reward" : "Contributor Dashboard"}
              <NextIcon className="h-3.5 w-3.5 ml-1.5" />
            </AndamioButton>
          </Link>
        </div>
      )}

      {/* ── Stats Bar ─────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <div className="rounded-sm border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TreasuryIcon className="h-4 w-4" />
            <AndamioText variant="small">Treasury Balance</AndamioText>
          </div>
          <AndamioText className="text-2xl font-bold">
            {formatLovelace(treasuryBalance)}
          </AndamioText>
        </div>

        <div className="rounded-sm border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TreasuryIcon className="h-4 w-4" />
            <AndamioText variant="small">Budget Spent</AndamioText>
          </div>
          <AndamioText className="text-2xl font-bold">
            {formatLovelace(budgetSpent)}
          </AndamioText>
          {totalFunding > 0 && (
            <AndamioText variant="small" className="text-muted-foreground">
              {Math.round((budgetSpent / totalFunding) * 100)}% of {formatLovelace(totalFunding)} deposited
            </AndamioText>
          )}
        </div>

        <div className="rounded-sm border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TaskIcon className="h-4 w-4" />
            <AndamioText variant="small">Available Rewards</AndamioText>
          </div>
          <AndamioText className="text-2xl font-bold">
            {formatLovelace(availableRewards)}
          </AndamioText>
          <AndamioText variant="small" className="text-muted-foreground">
            across {availableTasks.length} task{availableTasks.length !== 1 ? "s" : ""}
          </AndamioText>
        </div>

        <div className="rounded-sm border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ContributorIcon className="h-4 w-4" />
            <AndamioText variant="small">Contributors</AndamioText>
          </div>
          <AndamioText className="text-2xl font-bold">
            {contributors.length}
          </AndamioText>
          {contributors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {contributors.slice(0, 5).map((c, i) => (
                <AndamioBadge key={c.alias ?? i} variant="secondary" className="font-mono text-xs">
                  {c.alias ?? "?"}
                </AndamioBadge>
              ))}
              {contributors.length > 5 && (
                <AndamioBadge variant="outline" className="text-xs">
                  +{contributors.length - 5}
                </AndamioBadge>
              )}
            </div>
          )}
        </div>

        <div className="rounded-sm border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CredentialIcon className="h-4 w-4" />
            <AndamioText variant="small">Credentials Claimed</AndamioText>
          </div>
          <AndamioText className="text-2xl font-bold">
            {credentialClaims.length}
          </AndamioText>
        </div>
      </div>

      {/* ── Prerequisites + Eligibility (combined) ────────────────── */}
      {prerequisites.length > 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CourseIcon className="h-5 w-5" />
                <div>
                  <AndamioCardTitle>Prerequisites</AndamioCardTitle>
                  <AndamioCardDescription>
                    Complete these course modules to contribute
                  </AndamioCardDescription>
                </div>
              </div>
              {eligibility && (
                eligibility.eligible ? (
                  <AndamioBadge status="success" className="gap-1">
                    <SuccessIcon className="h-3.5 w-3.5" />
                    Eligible
                  </AndamioBadge>
                ) : (
                  <AndamioBadge variant="outline" className="gap-1 text-muted-foreground">
                    <AlertIcon className="h-3.5 w-3.5" />
                    {eligibility.totalCompleted}/{eligibility.totalRequired} completed
                  </AndamioBadge>
                )
              )}
            </div>
          </AndamioCardHeader>
          <AndamioCardContent>
            <PrerequisiteList prerequisites={prerequisites} completions={completions} />

          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* ── Available Tasks ───────────────────────────────────────── */}
      {availableTaskGroups.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TaskIcon className="h-5 w-5" />
              <AndamioText className="text-lg font-semibold">Available Tasks</AndamioText>
              <AndamioText variant="small" className="text-muted-foreground">
                ({availableTasks.length} total)
              </AndamioText>
            </div>
          </div>
          <AndamioTableContainer>
            <AndamioTable>
              <AndamioTableHeader>
                <AndamioTableRow>
                  <AndamioTableHead>Task</AndamioTableHead>
                  <AndamioTableHead className="hidden md:table-cell">Expiration</AndamioTableHead>
                  <AndamioTableHead className="text-right">Reward</AndamioTableHead>
                </AndamioTableRow>
              </AndamioTableHeader>
              <AndamioTableBody>
                {availableTaskGroups.map((group) => {
                  const task = group.representative;
                  return (
                    <AndamioTableRow key={group.taskHash}>
                      <AndamioTableCell>
                        {task.taskHash ? (
                          <Link href={`/project/${projectId}/${task.taskHash}`}>
                            <div className="flex items-center gap-2">
                              <AndamioText className="font-medium hover:underline">
                                {task.title || "Untitled Task"}
                              </AndamioText>
                              {group.count > 1 && (
                                <AndamioBadge variant="secondary" className="text-xs">
                                  ×{group.count}
                                </AndamioBadge>
                              )}
                            </div>
                            <AndamioText variant="small" className="font-mono text-xs text-muted-foreground">
                              {task.taskHash.slice(0, 20)}...
                            </AndamioText>
                            {task.preAssignedAlias && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <LockedIcon className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  @{task.preAssignedAlias}
                                </span>
                              </div>
                            )}
                          </Link>
                        ) : (
                          <AndamioText className="text-muted-foreground">No ID</AndamioText>
                        )}
                      </AndamioTableCell>
                      <AndamioTableCell className="hidden md:table-cell">
                        {task.expirationTime ? (
                          <AndamioText variant="small">
                            {new Date(Number(task.expirationTime)).toLocaleDateString()}
                          </AndamioText>
                        ) : (
                          <AndamioText variant="small" className="text-muted-foreground">
                            None
                          </AndamioText>
                        )}
                      </AndamioTableCell>
                      <AndamioTableCell className="text-right">
                        <AndamioBadge variant="outline">
                          {formatLovelace(task.lovelaceAmount ?? "0")}
                          {group.count > 1 && ` each`}
                        </AndamioBadge>
                      </AndamioTableCell>
                    </AndamioTableRow>
                  );
                })}
              </AndamioTableBody>
            </AndamioTable>
          </AndamioTableContainer>
        </div>
      ) : (
        <AndamioEmptyState
          icon={TaskIcon}
          title="No tasks available"
          description="This project doesn't have any active tasks yet. Check back later."
        />
      )}

      {/* ── My Completed Tasks (authenticated only, personal) ─── */}
      {isAuthenticated && completedTaskGroups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <SuccessIcon className="h-5 w-5 text-muted-foreground" />
            <AndamioText className="text-lg font-semibold text-muted-foreground">
              My Completed Tasks
            </AndamioText>
          </div>
          <AndamioTableContainer>
            <AndamioTable>
              <AndamioTableHeader>
                <AndamioTableRow>
                  <AndamioTableHead>Task</AndamioTableHead>
                  <AndamioTableHead className="text-right">Reward</AndamioTableHead>
                </AndamioTableRow>
              </AndamioTableHeader>
              <AndamioTableBody>
                {completedTaskGroups.map((group) => {
                  const task = group.representative;
                  return (
                    <AndamioTableRow key={group.taskHash} className="opacity-70">
                      <AndamioTableCell>
                        <Link href={`/project/${projectId}/${task.taskHash}`}>
                          <div className="flex items-center gap-2">
                            <AndamioText className="font-medium hover:underline">
                              {task.title || "Untitled Task"}
                            </AndamioText>
                            {group.count > 1 && (
                              <AndamioBadge variant="secondary" className="text-xs opacity-70">
                                ×{group.count}
                              </AndamioBadge>
                            )}
                          </div>
                        </Link>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-right">
                        <AndamioBadge variant="outline" className="opacity-70">
                          {formatLovelace(task.lovelaceAmount ?? "0")}
                        </AndamioBadge>
                      </AndamioTableCell>
                    </AndamioTableRow>
                  );
                })}
              </AndamioTableBody>
            </AndamioTable>
          </AndamioTableContainer>
        </div>
      )}
    </div>
  );
}
