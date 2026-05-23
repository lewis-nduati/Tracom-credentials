"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useCourse } from "~/hooks/api";
import { useDashboardData } from "~/contexts/dashboard-context";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioEmptyState } from "~/components/andamio/andamio-empty-state";
import { AndamioProgress } from "~/components/andamio/andamio-progress";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ProjectIcon, SuccessIcon, NextIcon, CredentialIcon } from "~/components/icons";

const MAX_IN_PROGRESS_SHOWN = 3;

interface ProjectProgressItem {
  projectId: string;
  title: string;
  totalRequired: number;
  completed: number;
  approvedUnclaimed: number;
  isReady: boolean;
  nextMissingCourseId?: string;
  nextMissingCount?: number;
}

function MissingPrereqLabel({
  courseId,
  missingCount,
}: {
  courseId: string;
  missingCount: number;
}) {
  const { data: course } = useCourse(courseId);
  const courseLabel = course?.title || `Course ${courseId.slice(0, 8)}...`;

  return (
    <AndamioText variant="small" className="text-xs text-muted-foreground">
      Need: {missingCount} module{missingCount === 1 ? "" : "s"} from {courseLabel}
    </AndamioText>
  );
}

export function ProjectUnlockProgress() {
  const { isAuthenticated, user } = useAndamioAuth();
  const { projects, student, isLoading } = useDashboardData();

  // Get completed credential hashes from dashboard data
  const completedModuleHashes = useMemo(() => {
    const completed = new Set<string>();
    const credentialsByCourse = student?.credentialsByCourse ?? [];
    for (const courseCreds of credentialsByCourse) {
      for (const hash of courseCreds.credentials) {
        completed.add(hash);
      }
    }
    return completed;
  }, [student?.credentialsByCourse]);

  // Get approved-but-unclaimed SLT hashes from commitments
  const approvedUnclaimedHashes = useMemo(() => {
    const approved = new Set<string>();
    const commitments = student?.commitments ?? [];
    for (const c of commitments) {
      if (c.status === "ASSIGNMENT_ACCEPTED" && !completedModuleHashes.has(c.sltHash)) {
        approved.add(c.sltHash);
      }
    }
    return approved;
  }, [student?.commitments, completedModuleHashes]);

  // Transform projects with prerequisites into progress items
  const progressItems = useMemo<ProjectProgressItem[]>(() => {
    const items: ProjectProgressItem[] = [];
    const projectsWithPrereqs = projects?.withPrerequisites ?? [];

    for (const project of projectsWithPrereqs) {
      const prerequisites = project.prerequisites ?? [];
      if (prerequisites.length === 0) continue;

      let totalRequired = 0;
      let completed = 0;
      let approvedUnclaimed = 0;
      let nextMissingCourseId: string | undefined;
      let nextMissingCount: number | undefined;

      for (const prereq of prerequisites) {
        const hashes = prereq.sltHashes ?? [];
        totalRequired += hashes.length;

        const missing = hashes.filter((hash) => !completedModuleHashes.has(hash));
        const completedInCourse = hashes.length - missing.length;
        completed += completedInCourse;

        // Count how many of the "missing" are actually approved but not yet claimed
        for (const hash of missing) {
          if (approvedUnclaimedHashes.has(hash)) {
            approvedUnclaimed++;
          }
        }

        if (missing.length > 0 && !nextMissingCourseId) {
          nextMissingCourseId = prereq.courseId;
          nextMissingCount = missing.length;
        }
      }

      // Show projects where user has some progress OR has approved-but-unclaimed credentials
      if (totalRequired === 0 || (completed === 0 && approvedUnclaimed === 0)) continue;

      items.push({
        projectId: project.projectId,
        title: project.title || "Untitled Project",
        totalRequired,
        completed,
        approvedUnclaimed,
        isReady: project.qualified,
        nextMissingCourseId,
        nextMissingCount,
      });
    }

    return items;
  }, [projects?.withPrerequisites, completedModuleHashes, approvedUnclaimedHashes]);

  // In-progress projects (have some prerequisites completed but not all)
  const inProgress = useMemo(
    () => progressItems.filter((item) => !item.isReady),
    [progressItems]
  );

  // Count ALL qualified projects from withPrerequisites (not just ones with user progress)
  const qualifiedCount = useMemo(() => {
    const projectsWithPrereqs = projects?.withPrerequisites ?? [];
    return projectsWithPrereqs.filter((p) => p.qualified).length;
  }, [projects?.withPrerequisites]);

  if (!isAuthenticated || !user?.accessTokenAlias) {
    return null;
  }

  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <ProjectIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <AndamioCardTitle>Project Progress</AndamioCardTitle>
              <AndamioCardDescription>Loading unlocks...</AndamioCardDescription>
            </div>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioText variant="small" className="text-muted-foreground">
            Checking your project prerequisites.
          </AndamioText>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  if (progressItems.length === 0 && qualifiedCount === 0) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <ProjectIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <AndamioCardTitle>Project Opportunities</AndamioCardTitle>
              <AndamioCardDescription>
                Unlock real projects as you complete modules
              </AndamioCardDescription>
            </div>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioEmptyState
            icon={ProjectIcon}
            iconSize="md"
            title="Project Opportunities"
            description="As you complete course modules, you will unlock real project opportunities here."
            action={
              <Link href="/project">
                <AndamioButton size="sm"><ProjectIcon className="mr-2 h-3 w-3" />Browse Projects</AndamioButton>
              </Link>
            }
          />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  const shownInProgress = inProgress.slice(0, MAX_IN_PROGRESS_SHOWN);
  const hiddenInProgressCount = inProgress.length - shownInProgress.length;

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center gap-2">
          <ProjectIcon className="h-5 w-5 text-primary" />
          <div>
            <AndamioCardTitle>Project Progress</AndamioCardTitle>
            <AndamioCardDescription>
              {inProgress.length > 0
                ? "Keep completing modules to unlock more projects"
                : "You've met all prerequisites — start contributing"}
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Qualified projects — compact summary with count */}
        {qualifiedCount > 0 && (
          <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-2">
              <SuccessIcon className="h-4 w-4 text-primary shrink-0" />
              <AndamioText variant="small" className="text-sm font-medium">
                You qualify for {qualifiedCount} {qualifiedCount === 1 ? "project" : "projects"}
              </AndamioText>
            </div>
            <Link href="/project?filter=qualified">
              <AndamioButton size="sm" variant="outline" className="h-7 text-xs">
                View Qualified Projects
                <NextIcon className="ml-1 h-3 w-3" />
              </AndamioButton>
            </Link>
          </div>
        )}

        {/* In-progress projects — individual cards with progress bars */}
        {shownInProgress.map((item) => {
          const progressPercent = Math.round((item.completed / item.totalRequired) * 100);
          const allRemainingApproved = item.approvedUnclaimed > 0 && item.approvedUnclaimed >= (item.totalRequired - item.completed);
          return (
            <Link
              key={item.projectId}
              href={`/project/${item.projectId}`}
              className="block rounded-md border p-4 bg-muted/30 hover:border-primary/30 hover:bg-accent/5 transition-colors group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <AndamioText className="font-medium truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </AndamioText>
                  <AndamioText variant="small" className="text-xs text-muted-foreground">
                    {item.completed}/{item.totalRequired} prerequisites complete
                  </AndamioText>
                </div>
                <AndamioBadge variant="outline" className="text-xs shrink-0">
                  {progressPercent}%
                </AndamioBadge>
              </div>

              <div className="mt-3">
                <AndamioProgress value={progressPercent} />
              </div>

              {/* Approved-but-unclaimed banner — all remaining prereqs are approved */}
              {allRemainingApproved ? (
                <div className="mt-2 flex items-center gap-1.5 text-primary">
                  <CredentialIcon className="h-3.5 w-3.5 shrink-0" />
                  <AndamioText variant="small" className="text-xs font-medium text-primary">
                    Approved! Claim {item.approvedUnclaimed === 1 ? "your credential" : `${item.approvedUnclaimed} credentials`} to unlock
                  </AndamioText>
                </div>
              ) : item.approvedUnclaimed > 0 ? (
                <div className="mt-2 flex items-center gap-1.5 text-primary">
                  <CredentialIcon className="h-3.5 w-3.5 shrink-0" />
                  <AndamioText variant="small" className="text-xs text-primary">
                    {item.approvedUnclaimed} {item.approvedUnclaimed === 1 ? "credential" : "credentials"} ready to claim
                  </AndamioText>
                </div>
              ) : item.nextMissingCourseId && item.nextMissingCount ? (
                <div className="mt-2">
                  <MissingPrereqLabel
                    courseId={item.nextMissingCourseId}
                    missingCount={item.nextMissingCount}
                  />
                </div>
              ) : null}
            </Link>
          );
        })}

        {/* Overflow link when more than MAX_IN_PROGRESS_SHOWN in-progress */}
        {hiddenInProgressCount > 0 && (
          <Link href="/project" className="flex items-center justify-center gap-1 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            View {hiddenInProgressCount} more {hiddenInProgressCount === 1 ? "project" : "projects"}
            <NextIcon className="h-3.5 w-3.5" />
          </Link>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
