"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/ui/use-success-notification";
import {
  AndamioAlert,
  AndamioAlertTitle,
  AndamioAlertDescription,
  AndamioBadge,
  AndamioButton,
  AndamioInput,
  AndamioLabel,
  AndamioTextarea,
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioPageLoading,
  AndamioSaveButton,
  AndamioTabs,
  AndamioTabsContent,
  AndamioTabsList,
  AndamioTabsTrigger,
  AndamioText,
  AndamioErrorAlert,
  AndamioHeading,
  AndamioAddButton,
  AndamioScrollArea,
} from "~/components/andamio";
// Note: BlockIcon hidden for v2 release (used by Blacklist tab)
import { TaskIcon, AssignmentIcon, ContributorIcon, TreasuryIcon, ChartIcon, SettingsIcon, AlertIcon, OnChainIcon, CourseIcon, ManagerIcon, OwnerIcon, PendingIcon, CompletedIcon, CloseIcon, NeutralIcon, NextIcon, PreviewIcon } from "~/components/icons";
import { CopyId } from "~/components/andamio/copy-id";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";
// Note: BlacklistManage hidden for v2 release - will enable after user research
import { ManagersManage } from "~/components/tx";
import { StudioFormSection } from "~/components/studio/studio-editor-pane";
import { RegisterProject } from "~/components/studio/register-project";
import { PrerequisiteList } from "~/components/project/prerequisite-list";
import { formatLovelace } from "~/lib/cardano-utils";
import { RESOLVED_COMMITMENT_STATUSES } from "~/config/ui-constants";
import { useProject, projectKeys } from "~/hooks/api/project/use-project";
import { useManagerTasks, useManagerCommitments, projectManagerKeys } from "~/hooks/api/project/use-project-manager";
import { useUpdateProject } from "~/hooks/api/project/use-project-owner";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Project Dashboard - Edit project details and access management areas
 *
 * Uses React Query hooks:
 * - useProject(projectId) - Project detail with on-chain data
 * - useManagerTasks(projectId) - Manager task list (includes DRAFT)
 * - useUpdateProject() - Update project metadata mutation
 */
export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = params.projectid as string;
  const { isAuthenticated, user } = useAndamioAuth();
  const queryClient = useQueryClient();

  // URL-based tab persistence
  const urlTab = searchParams.get("tab");
  // Note: "blacklist" tab hidden for v2 release - will enable after user research
  const validTabs = ["overview", "tasks", "managers", "settings"];
  const activeTab = urlTab && validTabs.includes(urlTab) ? urlTab : "overview";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // React Query hooks replace manual useState + useEffect + fetch
  const { data: projectDetail, isLoading: isProjectLoading, error: projectError } = useProject(projectId);
  const contributorStateId = projectDetail?.contributorStateId;
  const { data: tasks = [], isLoading: isTasksLoading } = useManagerTasks(projectId);
  const { data: allCommitments = [], isLoading: isCommitmentsLoading } = useManagerCommitments(projectId);
  const updateProject = useUpdateProject();

  // Commitment categorization (mirrors course studio pattern)
  const pendingCommitments = useMemo(
    () => allCommitments.filter((c) => c.commitmentStatus === "SUBMITTED"),
    [allCommitments]
  );
  const inProgressCommitments = useMemo(
    () => allCommitments.filter((c) =>
      c.commitmentStatus === "AWAITING_SUBMISSION" ||
      c.commitmentStatus === "PENDING_TX_COMMIT" ||
      c.commitmentStatus === "PENDING_TX_ASSESS"
    ),
    [allCommitments]
  );
  const resolvedCommitments = useMemo(
    () => allCommitments.filter((c) => (RESOLVED_COMMITMENT_STATUSES as readonly string[]).includes(c.commitmentStatus ?? "")),
    [allCommitments]
  );
  const pendingCommitmentCount = pendingCommitments.length;

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [saveError, setSaveError] = useState<string | null>(null);
  const { isSuccess: saveSuccess, showSuccess } = useSuccessNotification();

  // Initialize form state when project data loads
  useEffect(() => {
    if (!projectDetail) return;
    setTitle(projectDetail.title);
    setDescription(projectDetail.description ?? "");
    setImageUrl(projectDetail.imageUrl ?? "");
    // videoUrl not in merged API response
  }, [projectDetail]);

  // Derive user role from hook data
  const userRole = (() => {
    if (!projectDetail || !user?.accessTokenAlias) return null;
    const alias = user.accessTokenAlias;
    if (projectDetail.ownerAlias === alias || projectDetail.owner === alias) return "owner" as const;
    if (projectDetail.managers?.includes(alias)) return "manager" as const;
    return null;
  })();

  // On-chain counts from hook data
  const onChainTaskCount = projectDetail?.tasks?.filter(t => t.taskStatus === "ON_CHAIN").length ?? 0;
  const onChainContributorCount = projectDetail?.contributors?.length ?? 0;

  // Cache invalidation for onSuccess callbacks
  // Uses refetchQueries to force immediate refetch (not just mark stale)
  const refreshData = useCallback(async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: projectKeys.detail(projectId) }),
      ...(contributorStateId
        ? [queryClient.invalidateQueries({ queryKey: projectManagerKeys.tasks(contributorStateId) })]
        : []),
    ]);
  }, [queryClient, projectId, contributorStateId]);

  const handleSave = async () => {
    if (!isAuthenticated || !projectDetail) {
      setSaveError("You must be authenticated to edit projects");
      return;
    }

    setSaveError(null);

    try {
      await updateProject.mutateAsync({
        projectId,
        data: {
          title: title || undefined,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
        },
      });
      showSuccess();
    } catch (err) {
      console.error("Error saving project:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <ConnectWalletGate
        title="Connect your wallet"
        description="Sign in to access the project dashboard"
      />
    );
  }

  // Loading state
  if (isProjectLoading || isTasksLoading || isCommitmentsLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Unregistered state - project exists on-chain but not in DB
  // Show registration form instead of normal dashboard
  if (projectDetail?.status === "unregistered") {
    return (
      <RegisterProject
        projectId={projectId}
        owner={projectDetail.owner ?? projectDetail.ownerAlias}
        managers={projectDetail.managers}
      />
    );
  }

  // Error state
  const errorMessage = projectError instanceof Error ? projectError.message : projectError ? "Failed to load project" : null;
  if (errorMessage || !projectDetail) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6">
        <AndamioErrorAlert error={errorMessage ?? "Project not found"} />
      </div>
    );
  }

  // Count tasks by status
  const draftTasks = tasks.filter((t) => t.taskStatus === "DRAFT").length;
  const liveTasks = tasks.filter((t) => t.taskStatus === "ON_CHAIN").length;

  const hasChanges =
    title !== projectDetail.title ||
    description !== (projectDetail.description ?? "") ||
    imageUrl !== (projectDetail.imageUrl ?? "");

  return (
    <AndamioScrollArea className="h-full">
    <div className="min-h-full">
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      {/* Project Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <AndamioHeading level={1} size="2xl">{projectDetail.title || "Untitled Project"}</AndamioHeading>
          <AndamioButton
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={`/project/${projectId}`}>
              <PreviewIcon className="h-3.5 w-3.5 mr-1" />
              Preview
            </Link>
          </AndamioButton>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <AndamioBadge variant="default" className="text-[10px]">
            <OnChainIcon className="h-2.5 w-2.5 mr-1" />
            Published
          </AndamioBadge>
          <span className="text-sm text-muted-foreground">
            {draftTasks} draft · {liveTasks} active
          </span>
        </div>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <AndamioAlert>
          <AndamioAlertTitle>Success</AndamioAlertTitle>
          <AndamioAlertDescription>Project updated successfully</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {saveError && (
        <AndamioAlert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{saveError}</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {/* Tabbed Interface */}
      <AndamioTabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Note: Blacklist tab hidden for v2 release - will enable after user research */}
        <AndamioTabsList className="w-auto inline-flex h-9 mb-6">
          <AndamioTabsTrigger value="overview" className="text-sm gap-1.5 px-4">
            <ChartIcon className="h-4 w-4" />
            Overview
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="tasks" className="text-sm gap-1.5 px-4">
            <TaskIcon className="h-4 w-4" />
            Tasks
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="managers" className="text-sm gap-1.5 px-4">
            <ManagerIcon className="h-4 w-4" />
            Managers
            {pendingCommitmentCount > 0 && (
              <AndamioBadge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                {pendingCommitmentCount}
              </AndamioBadge>
            )}
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="settings" className="text-sm gap-1.5 px-4">
            <SettingsIcon className="h-4 w-4" />
            Settings
          </AndamioTabsTrigger>
        </AndamioTabsList>

        {/* Overview Tab */}
        <AndamioTabsContent value="overview" className="mt-6 space-y-4">
          {/* Prerequisites + Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prerequisites Card */}
            <AndamioCard>
              <AndamioCardHeader>
                <AndamioCardTitle className="flex items-center gap-2">
                  <CourseIcon className="h-5 w-5" />
                  Prerequisites
                </AndamioCardTitle>
                <AndamioCardDescription>
                  Courses contributors must complete before joining
                </AndamioCardDescription>
              </AndamioCardHeader>
              <AndamioCardContent>
                <PrerequisiteList prerequisites={projectDetail.prerequisites ?? []} />
              </AndamioCardContent>
            </AndamioCard>

            {/* Project Stats Column */}
            <AndamioCard>
              <AndamioCardHeader>
                <AndamioCardTitle className="flex items-center gap-2">
                  <ChartIcon className="h-5 w-5" />
                  Project Stats
                </AndamioCardTitle>
              </AndamioCardHeader>
              <AndamioCardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Draft Tasks</span>
                  <span className="text-sm font-bold">{draftTasks}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <OnChainIcon className="h-3.5 w-3.5" />
                    Published Tasks
                  </span>
                  <span className="text-sm font-bold text-primary">{onChainTaskCount}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <OnChainIcon className="h-3.5 w-3.5" />
                    Contributors
                  </span>
                  <span className="text-sm font-bold">{onChainContributorCount}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <TreasuryIcon className="h-3.5 w-3.5" />
                    Treasury Balance
                  </span>
                  <span className="text-sm font-bold">
                    {formatLovelace(
                      (projectDetail.treasuryFundings ?? []).reduce(
                        (sum, f) => sum + (f.lovelaceAmount ?? 0),
                        0,
                      )
                    )}
                  </span>
                </div>
                <Link href={`/studio/project/${projectId}/manage-treasury`}>
                  <AndamioButton variant="outline" size="sm" className="w-full mt-1">
                    <TreasuryIcon className="h-4 w-4 mr-2" />
                    Manage Treasury
                  </AndamioButton>
                </Link>
              </AndamioCardContent>
            </AndamioCard>
          </div>
        </AndamioTabsContent>

        {/* Tasks Tab */}
        <AndamioTabsContent value="tasks" className="mt-6 space-y-4">
          {/* Draft Tasks Card */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="flex items-center gap-2">
                <TaskIcon className="h-5 w-5" />
                Draft Tasks
              </AndamioCardTitle>
              <AndamioCardDescription>Create tasks and publish them on-chain</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{draftTasks}</div>
                  <div className="text-sm text-muted-foreground">Draft Tasks</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{liveTasks}</div>
                  <div className="text-sm text-muted-foreground">Live Tasks</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <OnChainIcon className="h-5 w-5" />
                    {onChainTaskCount}
                  </div>
                  <div className="text-sm text-muted-foreground">On-Chain Tasks</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {draftTasks === 0 && liveTasks === 0 ? (
                  <Link href={`/studio/project/${projectId}/draft-tasks/new`}>
                    <AndamioButton className="w-full sm:w-auto">
                      <TaskIcon className="h-4 w-4 mr-2" />
                      Create Your First Task
                    </AndamioButton>
                  </Link>
                ) : (
                  <>
                    <Link href={`/studio/project/${projectId}/draft-tasks/new`}>
                      <AndamioAddButton label="Create Task" />
                    </Link>
                    <Link href={`/studio/project/${projectId}/draft-tasks`}>
                      <AndamioButton variant="outline" className="w-full sm:w-auto">
                        <TaskIcon className="h-4 w-4 mr-2" />
                        Manage Tasks
                      </AndamioButton>
                    </Link>
                  </>
                )}
                {draftTasks > 0 && (
                  <Link href={`/studio/project/${projectId}/manage-treasury`}>
                    <AndamioButton variant="outline" className="w-full sm:w-auto">
                      <OnChainIcon className="h-4 w-4 mr-2" />
                      Manage Treasury
                    </AndamioButton>
                  </Link>
                )}
              </div>
            </AndamioCardContent>
          </AndamioCard>

        </AndamioTabsContent>

        {/* Managers Tab */}
        <AndamioTabsContent value="managers" className="mt-0 space-y-6">
          {/* Team Overview */}
          <StudioFormSection title="Team" description="Project owner, managers, and contributors">
            <div className="space-y-3">
              {projectDetail.ownerAlias && (
                <div className="flex items-center justify-between">
                  <AndamioLabel className="flex items-center gap-1.5">
                    <OwnerIcon className="h-3.5 w-3.5 text-primary" />
                    Owner
                  </AndamioLabel>
                  <AndamioBadge variant="default" className="font-mono text-xs">
                    {projectDetail.ownerAlias}
                  </AndamioBadge>
                </div>
              )}
              {(projectDetail.managers ?? []).length > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <AndamioLabel className="flex items-center gap-1.5 flex-shrink-0">
                    <ManagerIcon className="h-3.5 w-3.5" />
                    Managers
                  </AndamioLabel>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {(projectDetail.managers ?? []).map((manager: string) => (
                      <AndamioBadge key={manager} variant="secondary" className="font-mono text-xs">
                        {manager}
                      </AndamioBadge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <AndamioLabel className="flex items-center gap-1.5">
                  <ContributorIcon className="h-3.5 w-3.5" />
                  Contributors
                </AndamioLabel>
                <Link href={`/studio/project/${projectId}/manage-contributors`}>
                  <AndamioButton variant="outline" size="sm">
                    <ContributorIcon className="h-3.5 w-3.5 mr-1.5" />
                    View Contributors ({onChainContributorCount})
                  </AndamioButton>
                </Link>
              </div>
            </div>
          </StudioFormSection>

          {/* Manage Managers */}
          {userRole === "owner" && (
            <ManagersManage
              projectNftPolicyId={projectId}
              currentManagers={projectDetail.managers ?? []}
              projectOwner={projectDetail.owner ?? null}
              onSuccess={refreshData}
            />
          )}

          {/* Pending Review */}
          {pendingCommitments.length > 0 ? (
            <StudioFormSection title={`Pending Review (${pendingCommitments.length})`}>
              <div className="space-y-3">
                {pendingCommitments.map((commitment, i) => (
                  <Link
                    key={`${commitment.taskHash}-${commitment.submittedBy}-${i}`}
                    href={`/studio/project/${projectId}/commitments`}
                    className="block rounded-xl border p-4 bg-secondary/5 border-secondary/20 hover:bg-secondary/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20">
                          <PendingIcon className="h-4 w-4 text-secondary" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-sm font-medium">{commitment.submittedBy}</span>
                          <AndamioText variant="small" className="truncate">
                            Task {commitment.taskHash.slice(0, 8)}...
                          </AndamioText>
                        </div>
                      </div>
                      <NextIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </StudioFormSection>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <AssignmentIcon className="h-10 w-10 text-muted-foreground/40 mb-4" />
              <AndamioHeading level={3} size="lg" className="mb-1">No Pending Reviews</AndamioHeading>
              <AndamioText variant="muted" className="text-center max-w-sm">
                All caught up! When contributors submit task evidence, pending reviews will appear here.
              </AndamioText>
            </div>
          )}

          {/* In Progress Commitments */}
          {inProgressCommitments.length > 0 && (
            <StudioFormSection title={`In Progress (${inProgressCommitments.length})`}>
              <div className="space-y-3">
                {inProgressCommitments.map((commitment, i) => (
                  <div key={`${commitment.taskHash}-${commitment.submittedBy}-progress-${i}`} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <NeutralIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-sm font-medium">{commitment.submittedBy}</span>
                          <AndamioText variant="small" className="truncate">
                            Task {commitment.taskHash.slice(0, 8)}...
                          </AndamioText>
                        </div>
                      </div>
                      <AndamioBadge variant="outline" className="text-[10px]">
                        {commitment.commitmentStatus === "AWAITING_SUBMISSION" ? "Awaiting Submission" :
                          commitment.commitmentStatus === "PENDING_TX_COMMIT" ? "Pending TX" :
                            commitment.commitmentStatus === "PENDING_TX_ASSESS" ? "Pending Assessment" : "In Progress"}
                      </AndamioBadge>
                    </div>
                  </div>
                ))}
              </div>
            </StudioFormSection>
          )}

          {/* Resolved Commitments */}
          {resolvedCommitments.length > 0 && (
            <StudioFormSection title="Resolved">
              <div className="space-y-3">
                {resolvedCommitments.map((commitment, i) => (
                  <div key={`${commitment.taskHash}-${commitment.submittedBy}-resolved-${i}`} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          commitment.commitmentStatus === "ACCEPTED" ? "bg-primary/20" : "bg-destructive/20"
                        }`}>
                          {commitment.commitmentStatus === "ACCEPTED" ? (
                            <CompletedIcon className="h-4 w-4 text-primary" />
                          ) : (
                            <CloseIcon className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-sm font-medium">{commitment.submittedBy}</span>
                          <AndamioText variant="small" className="truncate">
                            Task {commitment.taskHash.slice(0, 8)}...
                          </AndamioText>
                        </div>
                      </div>
                      <AndamioBadge
                        variant={commitment.commitmentStatus === "ACCEPTED" ? "default" : "destructive"}
                        className="text-[10px]"
                      >
                        {commitment.commitmentStatus === "ACCEPTED" ? "Accepted" :
                          commitment.commitmentStatus === "REFUSED" ? "Refused" : "Denied"}
                      </AndamioBadge>
                    </div>
                  </div>
                ))}
              </div>
            </StudioFormSection>
          )}

          {/* Full Review Page Link */}
          {allCommitments.length > 0 && (
            <div className="flex justify-center pt-2">
              <Link href={`/studio/project/${projectId}/commitments`}>
                <AndamioButton variant="outline">
                  <AssignmentIcon className="h-4 w-4 mr-2" />
                  Open Full Review Page
                </AndamioButton>
              </Link>
            </div>
          )}
        </AndamioTabsContent>

        {/* Blacklist Tab - Hidden for v2 release, will enable after user research
        <AndamioTabsContent value="blacklist" className="mt-6 space-y-4">
          <BlacklistManage
            projectNftPolicyId={projectId}
            onSuccess={() => {
              // Refresh project data
              void refreshData();
            }}
          />
        </AndamioTabsContent>
        */}

        {/* Settings Tab */}
        <AndamioTabsContent value="settings" className="mt-0 space-y-8">
          {/* General */}
          <StudioFormSection title="General" description="Project title, description, and media">
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <AndamioLabel htmlFor="title">Title *</AndamioLabel>
                <AndamioInput
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Project title"
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <AndamioLabel htmlFor="description">Description</AndamioLabel>
                <AndamioTextarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Project description"
                  rows={4}
                />
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <AndamioLabel htmlFor="imageUrl">Image URL</AndamioLabel>
                <AndamioInput
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {/* Video URL */}
              <div className="space-y-2">
                <AndamioLabel htmlFor="videoUrl">Video URL</AndamioLabel>
                <AndamioInput
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-2">
                <AndamioText variant="small" className="text-muted-foreground">
                  {hasChanges ? "You have unsaved changes" : "All changes saved"}
                </AndamioText>
                <AndamioSaveButton
                  onClick={handleSave}
                  isSaving={updateProject.isPending}
                  disabled={!hasChanges}
                />
              </div>
            </div>
          </StudioFormSection>

          {/* On-Chain Info */}
          <StudioFormSection title="Project ID" description="On-chain identifier for this project">
            <CopyId id={projectId} label="Project ID" />
          </StudioFormSection>
        </AndamioTabsContent>
      </AndamioTabs>
    </div>
    </div>
    </AndamioScrollArea>
  );
}
