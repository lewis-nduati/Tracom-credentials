"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";
import { AndamioPageLoading, AndamioAlert, AndamioAlertDescription, AndamioButton, AndamioText } from "~/components/andamio";
import { AlertIcon, BackIcon, SecurityAlertIcon } from "~/components/icons";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { useOwnerProjects, useManagerProjects } from "~/hooks/api";

interface RequireProjectAccessProps {
  /** Project ID to check access for */
  projectId: string;
  /** Title shown when not authenticated */
  title?: string;
  /** Description shown when not authenticated */
  description?: string;
  /** Content to render when user has access */
  children: React.ReactNode;
}

/**
 * Wrapper component that verifies the user has Owner or Manager access to a project.
 *
 * Authorization logic:
 * - First checks if user is authenticated
 * - Calls both /api/v2/project/owner/projects/list and /api/v2/project/manager/projects/list
 * - Grants access if the project appears in either list (owner OR manager)
 *
 * @example
 * ```tsx
 * <RequireProjectAccess
 *   projectId={projectId}
 *   title="Manage Contributors"
 *   description="You need access to this project to view contributors"
 * >
 *   <ContributorsContent />
 * </RequireProjectAccess>
 * ```
 */
export function RequireProjectAccess({
  projectId,
  title = "Project Access Required",
  description = "Connect your wallet to access this project",
  children,
}: RequireProjectAccessProps) {
  const router = useRouter();
  const { isAuthenticated } = useAndamioAuth();

  const {
    data: ownedProjects,
    isLoading: isOwnerLoading,
    error: ownerError,
  } = useOwnerProjects();

  const {
    data: managedProjects,
    isLoading: isManagerLoading,
    error: managerError,
  } = useManagerProjects();

  const isLoading = isOwnerLoading || isManagerLoading;

  const isOwner = ownedProjects?.some(
    (project) => project.projectId === projectId
  ) ?? false;
  const isManager = managedProjects?.some(
    (project) => project.projectId === projectId
  ) ?? false;
  const hasAccess = isOwner || isManager;

  const error = ownerError?.message ?? managerError?.message ?? null;

  if (!isAuthenticated) {
    return <ConnectWalletGate title={title} description={description} />;
  }

  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <AndamioAlert variant="destructive" className="max-w-md">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertDescription>
            {error}
          </AndamioAlertDescription>
        </AndamioAlert>
        <AndamioButton
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          <BackIcon className="h-4 w-4 mr-2" />
          Go Back
        </AndamioButton>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <SecurityAlertIcon className="h-12 w-12 text-destructive/70 mb-4" />
        <AndamioHeading level={1} size="2xl">Access Denied</AndamioHeading>
        <AndamioText variant="muted" className="text-center mb-6 max-w-md">
          Only project owners and managers can access this page. If you believe
          you should have access, check that you are connected with the correct wallet.
        </AndamioText>
        <div className="flex gap-3">
          <AndamioButton
            variant="outline"
            onClick={() => router.push("/studio/project")}
          >
            <BackIcon className="h-4 w-4 mr-2" />
            Back to Project Studio
          </AndamioButton>
          <AndamioButton
            variant="secondary"
            onClick={() => router.push(`/project/${projectId}`)}
          >
            View Project
          </AndamioButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
