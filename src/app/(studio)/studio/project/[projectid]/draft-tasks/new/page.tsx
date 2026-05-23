"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";
import {
  AndamioBadge,
  AndamioButton,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioBackButton,
  AndamioErrorAlert,
  AndamioScrollArea,
} from "~/components/andamio";
import { toast } from "sonner";
import { useProject } from "~/hooks/api/project/use-project";
import { useCreateTask } from "~/hooks/api/project/use-project-manager";
import { TaskForm, type TaskFormValues } from "~/components/studio";

export default function NewTaskPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectid as string;
  const { isAuthenticated } = useAndamioAuth();

  const {
    data: projectDetail,
    isLoading: isProjectLoading,
    error: projectFetchError,
  } = useProject(projectId);
  const contributorStateId = projectDetail?.contributorStateId;
  const createTask = useCreateTask();

  const [error, setError] = useState<string | null>(null);

  const backHref = `/studio/project/${projectId}/draft-tasks`;

  const handleCreate = async (values: TaskFormValues) => {
    if (!isAuthenticated) {
      setError("You must be authenticated to create tasks");
      return;
    }
    if (!contributorStateId) {
      setError(
        "Project state not found. Please ensure the project is minted on-chain.",
      );
      return;
    }

    setError(null);

    try {
      await createTask.mutateAsync({
        projectId,
        contributorStateId,
        title: values.title,
        content: values.content || undefined,
        lovelaceAmount: values.lovelaceAmount,
        expirationTime: values.expirationTime,
        contentJson: values.contentJson,
      });

      toast.success("Task Created!", {
        description: `"${values.title}" saved as draft.`,
      });

      router.push(backHref);
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <ConnectWalletGate
        title="Create Task"
        description="Connect your wallet to create tasks"
      />
    );
  }

  // Loading project
  if (isProjectLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Project error
  const projectError =
    projectFetchError instanceof Error
      ? projectFetchError.message
      : projectFetchError
        ? "Failed to load project"
        : null;
  if (projectError || !contributorStateId) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <AndamioBackButton href={backHref} label="Back to Tasks" />
        <AndamioErrorAlert
          error={projectError ?? "This project needs to be published on-chain before tasks can be created."}
        />
        {!projectError && (
          <Link href={`/studio/project/${projectId}/manage-treasury`}>
            <AndamioButton>Go to Manage Treasury</AndamioButton>
          </Link>
        )}
      </div>
    );
  }

  return (
    <AndamioScrollArea className="h-full">
      <div className="min-h-full">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <AndamioBackButton href={backHref} label="Back to Tasks" />
            <AndamioBadge variant="secondary">Draft</AndamioBadge>
          </div>

          <AndamioPageHeader
            title="Create Task"
            description="Define a new task for contributors"
          />

          {error && <AndamioErrorAlert error={error} />}

          <TaskForm
            onSubmit={handleCreate}
            isSubmitting={createTask.isPending}
            submitLabel="Create Task"
            headerDescription="Task will be saved as a draft."
            cancelAction={
              <Link href={backHref}>
                <AndamioButton variant="outline" type="button">
                  Cancel
                </AndamioButton>
              </Link>
            }
          />
        </div>
      </div>
    </AndamioScrollArea>
  );
}
