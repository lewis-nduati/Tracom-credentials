/**
 * CreateProject Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for creating a new Andamio Project on-chain.
 * Uses INSTANCE_PROJECT_CREATE transaction with gateway auto-confirmation.
 *
 * ## TX Lifecycle
 *
 * 1. User enters title, managers, and prerequisites
 * 2. `useTransaction` builds, signs, submits, and registers TX
 * 3. `useTxStream` polls gateway for confirmation status
 * 4. When status is "updated", gateway has completed DB updates
 * 5. UI shows success and calls onSuccess callback
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-stream.ts
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { projectManagerKeys } from "~/hooks/api/project/use-project-manager";
import { ownerProjectKeys } from "~/hooks/api/project/use-project-owner";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { parseTxErrorMessage } from "~/lib/tx-error-messages";
import { CoursePrereqsSelector, type CoursePrereq } from "./course-prereqs-selector";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioTxSummary,
  AndamioInput,
  AndamioAlert,
  AndamioAlertDescription,
  AndamioText,
  AndamioButton,
  AndamioBadge,
} from "~/components/andamio";
import { AlertIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";
import { getWalletAddressBech32 } from "~/lib/wallet-address";

// =============================================================================
// ChecklistStep — vertical stepper item with numbered circle / checkmark
// =============================================================================

interface ChecklistStepProps {
  step: number;
  title: string;
  status: string | null; // null = incomplete, string = completion summary
  isLast?: boolean;
  children: React.ReactNode;
}

function ChecklistStep({ step, title, status, isLast = false, children }: ChecklistStepProps) {
  const isComplete = status !== null;

  return (
    <div className="flex gap-4">
      {/* Left rail: indicator + connector line */}
      <div className="flex flex-col items-center">
        {isComplete ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <SuccessIcon className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-muted-foreground">
            <span className="text-sm font-semibold">{step}</span>
          </div>
        )}
        {/* Connector line */}
        {!isLast && (
          <div className={`w-px flex-1 mt-1 ${isComplete ? "bg-success/40" : "bg-border"}`} />
        )}
      </div>

      {/* Right: content */}
      <div className="flex-1 pb-8 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-sm font-semibold ${isComplete ? "text-success" : "text-foreground"}`}>
            {title}
          </span>
          {status && (
            <AndamioBadge className="text-xs bg-success/10 text-success border-success/20">
              {status}
            </AndamioBadge>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export interface CreateProjectProps {
  /**
   * Callback fired when project is successfully created
   * @param projectNftPolicyId - The project NFT policy ID returned by the API
   */
  onSuccess?: (projectNftPolicyId: string) => void | Promise<void>;
  /**
   * Callback fired when TX is confirmed (before onSuccess).
   * Parent can use this to hide Cancel button and update header.
   */
  onConfirmed?: () => void;
  /** Pre-fill the project title (used when returning from course creation detour) */
  initialTitle?: string;
  /** Called when user needs to create a course; saves title and redirects to course creation */
  onCreateCourseForProject?: (title: string) => void;
}

/**
 * CreateProject - Full UI for creating a project on-chain (V2)
 *
 * Uses useTransaction with gateway auto-confirmation.
 *
 * @example
 * ```tsx
 * <CreateProject onSuccess={(policyId) => router.push(`/studio/project/${policyId}`)} />
 * ```
 */
export function CreateProject({ onSuccess, onConfirmed, initialTitle, onCreateCourseForProject }: CreateProjectProps) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAndamioAuth();
  const { wallet, connected } = useWallet();
  const { state, result, error, execute, reset } = useTransaction();

  const [initiatorData, setInitiatorData] = useState<{ used_addresses: string[]; change_address: string } | null>(null);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [coursePrereqs, setCoursePrereqs] = useState<CoursePrereq[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [titleTouched, setTitleTouched] = useState(false);

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        // "updated" means Gateway has confirmed TX AND updated DB
        if (status.state === "updated") {
          console.log("[CreateProject] TX confirmed and DB updated by gateway");

          // Invalidate project lists so both owner and manager lists show the new project
          void queryClient.invalidateQueries({ queryKey: projectManagerKeys.all });
          void queryClient.invalidateQueries({ queryKey: ownerProjectKeys.all });

          toast.success("Project Created!", {
            description: `"${title.trim()}" is now live on-chain`,
          });

          // Notify parent that TX is confirmed (hide Cancel, update header)
          onConfirmed?.();

          // Call parent callback with the project ID
          if (projectId) {
            void onSuccess?.(projectId);
          }
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Project Creation Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  // Fetch wallet addresses when wallet is connected
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!wallet || !connected) {
        setInitiatorData(null);
        return;
      }

      try {
        // MeshSDK v2: use Bech32 variants (raw methods return hex now)
        const changeAddress = await getWalletAddressBech32(wallet);
        let usedAddresses: string[];
        try {
          usedAddresses = await wallet.getUsedAddressesBech32();
        } catch {
          usedAddresses = [changeAddress];
        }
        setInitiatorData({
          used_addresses: usedAddresses,
          change_address: changeAddress,
        });
      } catch (err) {
        console.error("Failed to fetch wallet data:", err);
        setInitiatorData(null);
      }
    };

    void fetchWalletData();
  }, [wallet, connected]);

  const ui = TRANSACTION_UI.INSTANCE_PROJECT_CREATE;

  const handleCreateProject = async () => {
    if (!user?.accessTokenAlias || !initiatorData || !title.trim()) {
      return;
    }

    // Gateway enforces single manager (owner) at creation time.
    // Use /v2/tx/project/owner/managers/manage to add more managers after creation.
    await execute({
      txType: "INSTANCE_PROJECT_CREATE",
      params: {
        alias: user.accessTokenAlias,
        managers: [user.accessTokenAlias],
        course_prereqs: coursePrereqs,
        initiator_data: initiatorData,
      },
      metadata: {
        title: title.trim(),
      },
      onSuccess: async (txResult) => {
        console.log("[CreateProject] TX submitted successfully!", txResult);

        // Invalidate project lists so both owner and manager lists pick up the new chain_only project
        void queryClient.invalidateQueries({ queryKey: projectManagerKeys.all });
        void queryClient.invalidateQueries({ queryKey: ownerProjectKeys.all });

        // Extract project_id from the API response (snake_case key from gateway)
        const extractedProjectId = (txResult.apiResponse?.project_id ?? txResult.apiResponse?.projectId) as string | undefined;
        if (extractedProjectId) {
          setProjectId(extractedProjectId);
        }
      },
      onError: (txError) => {
        console.error("[CreateProject] Error:", txError);
      },
    });
  };

  // Check requirements
  const hasAccessToken = !!user?.accessTokenAlias;
  const hasInitiatorData = !!initiatorData;
  const hasTitle = title.trim().length > 0;
  const hasPrereqs = coursePrereqs.length > 0;
  const canCreate = hasAccessToken && hasInitiatorData && hasTitle && hasPrereqs;
  const isFormActive = state === "idle" || state === "error";

  // Checklist step statuses
  const prereqModuleCount = coursePrereqs.reduce((sum, [, modules]) => sum + modules.length, 0);
  const prereqCourseCount = coursePrereqs.length;

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <AndamioCard>
      <AndamioCardContent className="py-8">
        {/* Post-Success Certificate View */}
        {txConfirmed ? (
          <div className="rounded-sm border border-primary/30 bg-primary/5 p-4 space-y-4">
            <div className="flex items-center gap-3">
              <SuccessIcon className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <AndamioText className="font-medium text-primary">
                  Project Created
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  Your project is live on-chain
                </AndamioText>
              </div>
            </div>

            <div className="border-t border-primary/20" />

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="text-sm text-muted-foreground w-32 shrink-0">Project Name</span>
                <span className="text-sm font-medium text-foreground">{title.trim()}</span>
              </div>

              {projectId && (
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <span className="text-sm text-muted-foreground w-32 shrink-0">Project ID</span>
                  <span className="text-sm font-mono text-foreground truncate">{projectId}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="text-sm text-muted-foreground w-32 shrink-0">Owner</span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
                  {user.accessTokenAlias}
                </code>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="text-sm text-muted-foreground w-32 shrink-0">Prerequisites</span>
                <span className="text-sm text-foreground">
                  {prereqCourseCount > 0
                    ? `${prereqModuleCount} module${prereqModuleCount !== 1 ? "s" : ""} from ${prereqCourseCount} course${prereqCourseCount !== 1 ? "s" : ""}`
                    : "None"}
                </span>
              </div>
            </div>

            {/* Next Steps */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {projectId ? (
                <>
                  <Link href={`/studio/project/${projectId}/draft-tasks/new`} className="flex-1">
                    <AndamioButton className="w-full">Create Your First Task</AndamioButton>
                  </Link>
                  <Link href={`/studio/project/${projectId}`} className="flex-1">
                    <AndamioButton variant="outline" className="w-full">Go to Project Dashboard</AndamioButton>
                  </Link>
                </>
              ) : (
                <Link href="/studio">
                  <AndamioButton variant="outline">Go to Studio</AndamioButton>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Requirements Check */}
            {!hasAccessToken && (
              <AndamioAlert variant="destructive" className="mb-4">
                <AlertIcon className="h-4 w-4" />
                <AndamioAlertDescription>
                  You need an Access Token to create a project. Mint one first!
                </AndamioAlertDescription>
              </AndamioAlert>
            )}

            {hasAccessToken && !hasInitiatorData && (
              <AndamioAlert className="mb-4">
                <AlertIcon className="h-4 w-4" />
                <AndamioAlertDescription>
                  Loading wallet data... Please ensure your wallet is connected.
                </AndamioAlertDescription>
              </AndamioAlert>
            )}

            {/* Checklist Steps */}
            {hasAccessToken && hasInitiatorData && (
              <div>
                {/* Step 1: Owner (locked) */}
                <ChecklistStep
                  step={1}
                  title="Owner"
                  status={user.accessTokenAlias}
                >
                  <code className="rounded bg-muted px-2 py-1 font-mono text-sm text-foreground">
                    {user.accessTokenAlias}
                  </code>
                  <AndamioText variant="small" className="text-xs mt-1.5">
                    The owner cannot be changed. You can add project managers after creating the project.
                  </AndamioText>
                </ChecklistStep>

                {/* Step 2: Project Title */}
                <ChecklistStep
                  step={2}
                  title="Name your project"
                  status={hasTitle ? title.trim() : null}
                >
                  <AndamioInput
                    id="title"
                    type="text"
                    placeholder="Cardano Developer Bounty Program"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setTitleTouched(true)}
                    disabled={!isFormActive}
                    maxLength={200}
                    className={titleTouched && !hasTitle ? "border-destructive" : ""}
                  />
                  {titleTouched && !hasTitle ? (
                    <AndamioText variant="small" className="text-xs mt-1.5 text-destructive">
                      Project title is required
                    </AndamioText>
                  ) : (
                    <AndamioText variant="small" className="text-xs mt-1.5">
                      Give your project a public title. You can update this later.
                    </AndamioText>
                  )}
                </ChecklistStep>

                {/* Step 3: Course Prerequisites */}
                <ChecklistStep
                  step={3}
                  title="Set contributor requirements"
                  status={
                    prereqCourseCount > 0
                      ? `${prereqModuleCount} module${prereqModuleCount !== 1 ? "s" : ""} from ${prereqCourseCount} course${prereqCourseCount !== 1 ? "s" : ""}`
                      : null
                  }
                  isLast
                >
                  <CoursePrereqsSelector
                    value={coursePrereqs}
                    onChange={setCoursePrereqs}
                    disabled={!isFormActive}
                    onCreateCourse={
                      onCreateCourseForProject
                        ? () => onCreateCourseForProject(title)
                        : undefined
                    }
                  />
                </ChecklistStep>
              </div>
            )}

            {/* Transaction Status - Only show during processing, not for final success */}
            {state !== "idle" && (
              <TransactionStatus
                state={state}
                result={result}
                error={parseTxErrorMessage(error?.message)}
                onRetry={() => reset()}
                messages={{
                  success: "Transaction submitted! Waiting for confirmation...",
                }}
              />
            )}

            {/* Pre-signing Summary */}
            {state === "idle" && canCreate && (
              <div className="animate-in-fade mb-6">
                <AndamioTxSummary
                  txType="INSTANCE_PROJECT_CREATE"
                  params={{
                    alias: user.accessTokenAlias!,
                    managers: [user.accessTokenAlias!],
                    course_prereqs: coursePrereqs,
                    initiator_data: initiatorData,
                  }}
                  metadata={{ title }}
                />
              </div>
            )}

            {/* Gateway Confirmation Status */}
            {state === "success" && result?.requiresDBUpdate && !txFailed && (
              <div className="rounded-sm border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
                  <div className="flex-1">
                    <AndamioText className="font-medium">Confirming on blockchain...</AndamioText>
                    <AndamioText variant="small" className="text-xs">
                      {txStatus?.state === "pending" && "Waiting for block confirmation"}
                      {txStatus?.state === "confirmed" && "Processing database updates"}
                      {!txStatus && "Registering transaction..."}
                    </AndamioText>
                    <AndamioText variant="small" className="text-xs text-muted-foreground">
                      This usually takes 20–60 seconds.
                    </AndamioText>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Button - Always visible (disabled when requirements unmet) */}
        {state !== "success" && !txConfirmed && hasAccessToken && hasInitiatorData && (
          <div className="space-y-2">
            <TransactionButton
              txState={state}
              onClick={() => {
                if (!hasTitle) {
                  setTitleTouched(true);
                  return;
                }
                void handleCreateProject();
              }}
              disabled={!canCreate}
              stateText={{
                idle: ui.buttonText,
                fetching: "Preparing Transaction...",
                signing: "Sign in Wallet",
                submitting: "Creating on Blockchain...",
              }}
              className="w-full"
            />
            {!canCreate && (hasTitle || titleTouched) && !hasPrereqs && (
              <AndamioText variant="small" className="text-xs text-center text-muted-foreground">
                Select at least one course prerequisite to continue
              </AndamioText>
            )}
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
