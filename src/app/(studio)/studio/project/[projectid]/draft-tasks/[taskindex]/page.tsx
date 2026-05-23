"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/ui/use-success-notification";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";
import {
  AndamioAlert,
  AndamioAlertTitle,
  AndamioAlertDescription,
  AndamioBadge,
  AndamioButton,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioBackButton,
  AndamioErrorAlert,
  AndamioScrollArea,
} from "~/components/andamio";
import { useProject } from "~/hooks/api/project/use-project";
import {
  useManagerTasks,
  useUpdateTask,
} from "~/hooks/api/project/use-project-manager";
import { TaskForm, type TaskFormValues } from "~/components/studio";

export default function EditTaskPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const taskIndex = parseInt(params.taskindex as string);
  const { isAuthenticated } = useAndamioAuth();

  const {
    data: projectDetail,
    isLoading: isProjectLoading,
    error: projectError,
  } = useProject(projectId);
  const contributorStateId = projectDetail?.contributorStateId;
  const { data: allTasks = [], isLoading: isTasksLoading } =
    useManagerTasks(projectId);
  const updateTask = useUpdateTask();

  const taskData = allTasks.find((t) => t.index === taskIndex);
  const loadError =
    !isProjectLoading && !isTasksLoading && allTasks.length > 0 && !taskData
      ? "Task not found"
      : taskData && taskData.taskStatus !== "DRAFT"
        ? "Only DRAFT tasks can be edited"
        : null;

  const [saveError, setSaveError] = useState<string | null>(null);
  const { isSuccess: saveSuccess, showSuccess } = useSuccessNotification();

  const backHref = `/studio/project/${projectId}/draft-tasks`;

  const handleSave = async (values: TaskFormValues) => {
    if (!isAuthenticated || !contributorStateId || !taskData) return;

    setSaveError(null);

    try {
      await updateTask.mutateAsync({
        projectId,
        contributorStateId,
        index: taskData.index ?? taskIndex,
        title: values.title,
        content: values.content || undefined,
        lovelaceAmount: values.lovelaceAmount,
        expirationTime: values.expirationTime,
        contentJson: values.contentJson,
      });
      showSuccess();
    } catch (err) {
      console.error("Error updating task:", err);
      setSaveError(
        err instanceof Error ? err.message : "Failed to update task",
      );
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <ConnectWalletGate
        title="Edit Task"
        description="Connect your wallet to edit tasks"
      />
    );
  }

  // Loading
  if (isProjectLoading || isTasksLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error
  const errorMessage =
    projectError instanceof Error
      ? projectError.message
      : projectError
        ? "Failed to load project"
        : loadError;
  if (errorMessage || !taskData) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <AndamioBackButton href={backHref} label="Back to Tasks" />
        <AndamioErrorAlert error={errorMessage ?? "Task not found"} />
      </div>
    );
  }

  return (
    <AndamioScrollArea className="h-full">
    <div className="min-h-full">
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <AndamioBackButton href={backHref} label="Back to Tasks" />
        <div className="flex items-center gap-2">
          <AndamioBadge variant="outline" className="font-mono">
            #{taskIndex}
          </AndamioBadge>
          <AndamioBadge variant="secondary">Draft</AndamioBadge>
        </div>
      </div>

      <AndamioPageHeader title="Edit Task" description="Update task details" />

      {saveSuccess && (
        <AndamioAlert>
          <AndamioAlertTitle>Success</AndamioAlertTitle>
          <AndamioAlertDescription>
            Task updated successfully
          </AndamioAlertDescription>
        </AndamioAlert>
      )}

      {saveError && <AndamioErrorAlert error={saveError} />}

      <TaskForm
        initialTask={taskData}
        onSubmit={handleSave}
        isSubmitting={updateTask.isPending}
        submitLabel="Save Changes"
        headerDescription="Edit the task information. Changes will be saved to the draft."
        cancelAction={
          <Link href={backHref}>
            <AndamioButton variant="outline">Cancel</AndamioButton>
          </Link>
        }
      />
    </div>
    </div>
    </AndamioScrollArea>
  );
}
