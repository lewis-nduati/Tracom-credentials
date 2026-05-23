"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/ui/use-success-notification";
import { UI_TIMEOUTS } from "~/config/ui-constants";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { parseTxErrorMessage } from "~/lib/tx-error-messages";
import { useQueryClient } from "@tanstack/react-query";
import { useAssignmentCommitment, useSubmitEvidence } from "~/hooks/api/course";
import { courseStudentKeys, useStudentCourses } from "~/hooks/api/course/use-course-student";
import { useCourse } from "~/hooks/api/course/use-course";
import { isJSONContent } from "~/lib/assignment-status";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ContentDisplay } from "~/components/content-display";
import { CredentialClaim } from "~/components/tx/credential-claim";
import { hashNormalizedContent } from "~/lib/hashing";
import type { JSONContent } from "@tiptap/core";
import {
  AlertIcon,
  LoadingIcon,
  SuccessIcon,
} from "~/components/icons";
import { ConnectWalletPrompt } from "~/components/auth/connect-wallet-prompt";
import { AccessTokenOnboarding } from "~/components/auth/access-token-onboarding";
import {
  TxConfirmationProgress,
  TxConfirmationSuccess,
  EvidenceHashDisplay,
  EvidenceEditorSection,
  UpdateTxStatusSection,
  UpdateEvidenceActions,
} from "./assignment-commitment-shared";
import { getBannerConfig } from "./assignment-commitment-banner";
import type { CommitmentNetworkStatus } from "~/lib/assignment-status";

/**
 * Assignment Commitment Component
 *
 * Allows learners to:
 * - Create assignment commitments
 * - Update their evidence/work
 * - Track their progress
 * - Delete commitments
 */

interface AssignmentCommitmentProps {
  assignmentTitle?: string;
  courseId: string;
  moduleCode: string;
  sltHash: string | null;
}

export function AssignmentCommitment({
  assignmentTitle,
  courseId,
  moduleCode,
  sltHash,
}: AssignmentCommitmentProps) {
  const { isAuthenticated, user } = useAndamioAuth();
  const queryClient = useQueryClient();
  const { isSuccess: showSuccess, message: successMessage, showSuccess: triggerSuccess } = useSuccessNotification(UI_TIMEOUTS.WORKFLOW_NOTIFICATION);

  // Check enrollment status before TX to detect first-time enrollment
  const { data: studentCourses } = useStudentCourses();
  const wasEnrolledBeforeTx = studentCourses?.some(c => c.courseId === courseId) ?? false;

  // V2 Transaction hooks
  const commitTx = useTransaction();
  const updateTx = useTransaction();

  // Assignment commitment query hook
  const {
    data: commitment,
    isLoading,
    error: commitmentError,
    refetch: refetchCommitment,
  } = useAssignmentCommitment(courseId, moduleCode, sltHash);

  // Mutation for saving evidence to DB
  const submitEvidence = useSubmitEvidence();

  // TX error state
  const [txError, setTxError] = useState<string | null>(null);

  // Watch for gateway confirmation after commit TX
  const { status: commitTxStatus, isSuccess: commitTxConfirmed } = useTxStream(
    commitTx.result?.requiresDBUpdate ? commitTx.result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          // Show enrollment toast for first-time enrollment
          if (!wasEnrolledBeforeTx) {
            toast.success("You're enrolled!", {
              description: "You are now enrolled in this course.",
            });
          }
          triggerSuccess("Assignment committed to blockchain!");
          void refetchCommitment();
          // Invalidate student courses and commitments so sidebar badges refresh
          void queryClient.invalidateQueries({
            queryKey: courseStudentKeys.all,
          });
        } else if (status.state === "failed" || status.state === "expired") {
          setTxError(status.last_error ?? "Transaction failed. Please try again.");
        }
      },
    }
  );

  // Watch for gateway confirmation after update TX
  const { status: updateTxStatus, isSuccess: updateTxConfirmed } = useTxStream(
    updateTx.result?.requiresDBUpdate ? updateTx.result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          triggerSuccess("Assignment updated on blockchain!");
          void refetchCommitment();
          // Invalidate student commitments list so sidebar badges refresh
          void queryClient.invalidateQueries({
            queryKey: courseStudentKeys.commitments(),
          });
        } else if (status.state === "failed" || status.state === "expired") {
          setTxError(status.last_error ?? "Transaction failed. Please try again.");
        }
      },
    }
  );

  // Course data for completion check
  const { data: courseData, refetch: refetchCourse } = useCourse(courseId);

  const hasCompletedOnChain = !!(
    user?.accessTokenAlias &&
    sltHash &&
    courseData?.pastStudents?.includes(user.accessTokenAlias)
  );

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [evidenceContent, setEvidenceContent] = useState<JSONContent | null>(null);
  const [localEvidenceContent, setLocalEvidenceContent] = useState<JSONContent | null>(null);

  // Revision flow state (for ASSIGNMENT_DENIED)
  const [isRevisionLocked, setIsRevisionLocked] = useState(false);
  const [revisionHash, setRevisionHash] = useState<string | null>(null);

  const handleEvidenceContentChange = (content: JSONContent) => {
    setLocalEvidenceContent(content);
    setHasUnsavedChanges(true);
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !commitment) {
        e.preventDefault();
        const message = "You have unsaved work. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
      return undefined;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, commitment]);

  // Initialize evidence content from commitment
  useEffect(() => {
    if (commitment?.networkEvidence && !localEvidenceContent) {
      const evidence = commitment.networkEvidence;
      if (isJSONContent(evidence)) {
        setLocalEvidenceContent(evidence);
      }
    }
  }, [commitment?.networkEvidence, localEvidenceContent]);

  const handleLockEvidence = async () => {
    if (!localEvidenceContent || !sltHash) return;
    const hash = hashNormalizedContent(localEvidenceContent);

    // Save evidence to DB at finalize time - MUST succeed before showing TX button
    // This is a new commitment, so isUpdate=false (creates new DB record)
    try {
      await submitEvidence.mutateAsync({
        courseId,
        sltHash,
        moduleCode,
        evidence: localEvidenceContent,
        evidenceHash: hash,
        isUpdate: false,
      });
      console.log("[AssignmentCommitment] Evidence saved to DB at finalize");
    } catch (dbError) {
      // STOP - evidence must be saved before we allow TX
      console.error("[AssignmentCommitment] Failed to save evidence:", dbError);
      toast.error("Failed to save your work", {
        description: "Please try again. Your work must be saved before submitting.",
      });
      return; // Don't proceed - don't lock, don't show TX button
    }

    setEvidenceHash(hash);
    setEvidenceContent(localEvidenceContent);
    setIsLocked(true);
    setHasUnsavedChanges(false);
    triggerSuccess("Your work is saved and ready to submit. Review it below, then confirm.");
  };

  const handleUnlockEvidence = () => {
    setIsLocked(false);
    setEvidenceHash(null);
  };

  // Finalize revision - save to DB first, then show TX button
  const handleLockRevision = async () => {
    if (!localEvidenceContent || !sltHash) return;
    const hash = hashNormalizedContent(localEvidenceContent);

    // Check if there's an existing DB record
    // If networkEvidence exists or source is not "chain_only", we have a DB record
    const hasDbRecord = !!(commitment?.networkEvidence) || commitment?.source !== "chain_only";

    // Save revised evidence to DB - MUST succeed before showing TX button
    try {
      await submitEvidence.mutateAsync({
        courseId,
        sltHash,
        moduleCode,
        evidence: localEvidenceContent,
        evidenceHash: hash,
        isUpdate: hasDbRecord, // Use /update if DB record exists, /submit if not
      });
      console.log("[AssignmentCommitment] Revised evidence saved to DB (isUpdate:", hasDbRecord, ")");
    } catch (dbError) {
      // STOP - evidence must be saved before we allow TX
      console.error("[AssignmentCommitment] Failed to save revision:", dbError);
      toast.error("Failed to save your revision", {
        description: "Please try again. Your work must be saved before resubmitting.",
      });
      return;
    }

    setRevisionHash(hash);
    setIsRevisionLocked(true);
    setHasUnsavedChanges(false);
    triggerSuccess("Your revision is saved and ready to submit.");
  };

  const handleUnlockRevision = () => {
    setIsRevisionLocked(false);
    setRevisionHash(null);
  };

  // Execute update TX (DB save already done at Finalize time)
  const handleUpdateTxExecute = async (evidenceHashToSubmit: string) => {
    if (!user?.accessTokenAlias || !sltHash) return;

    await updateTx.execute({
      txType: "COURSE_STUDENT_ASSIGNMENT_UPDATE",
      params: {
        alias: user.accessTokenAlias,
        course_id: courseId,
        assignment_info: evidenceHashToSubmit,
      },
      metadata: {
        slt_hash: sltHash,
        course_module_code: moduleCode,
        evidence_hash: evidenceHashToSubmit,
      },
      onSuccess: () => {
        setHasUnsavedChanges(false);
      },
      onError: (err) => setTxError(err.message),
    });
  };

  const displayError = txError ?? (commitmentError ? commitmentError.message : null);

  // --- Early returns ---

  if (!isAuthenticated) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Assignment Progress</AndamioCardTitle>
          <AndamioCardDescription>Connect your wallet to write and submit your work for this module</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <ConnectWalletPrompt />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  if (!user?.accessTokenAlias) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Assignment Progress</AndamioCardTitle>
          <AndamioCardDescription>Create an access token to submit your work for this module</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AccessTokenOnboarding
            onActivated={() => {
              /* no-op: auth context rerender reveals the editor */
            }}
            terminalMessage="Returning to your assignment..."
          />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  if (!sltHash) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Assignment Progress</AndamioCardTitle>
          <AndamioCardDescription>This module is not yet available on-chain</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioAlert>
            <AlertIcon className="h-4 w-4" />
            <AndamioAlertDescription>
              This module is being prepared by the instructor. You will be able to submit your work once setup is complete.
            </AndamioAlertDescription>
          </AndamioAlert>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Assignment Progress</AndamioCardTitle>
          <AndamioCardDescription>Loading your progress...</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // --- Main render ---

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <AndamioCardTitle>Your Progress</AndamioCardTitle>
        <AndamioCardDescription>Track and submit your work for &quot;{assignmentTitle}&quot;</AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {displayError && (
          <AndamioAlert variant="destructive">
            <AlertIcon className="h-4 w-4" />
            <AndamioAlertDescription>{displayError}</AndamioAlertDescription>
          </AndamioAlert>
        )}

        {showSuccess && (
          <AndamioAlert>
            <SuccessIcon className="h-4 w-4" />
            <AndamioAlertDescription>{successMessage}</AndamioAlertDescription>
          </AndamioAlert>
        )}

        {/* Top-level TX success — persists after view transition to new branch */}
        {(commitTxConfirmed || updateTxConfirmed) && (
          <TxConfirmationSuccess
            message={commitTxConfirmed ? "Assignment submitted successfully!" : "Evidence updated successfully!"}
          />
        )}

        {/* Branch: Module completed on-chain */}
        {hasCompletedOnChain ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8 border rounded-lg bg-primary/10 border-primary/20">
              <SuccessIcon className="h-12 w-12 text-primary mb-4" />
              <AndamioText className="font-medium mb-2">Module Completed</AndamioText>
              <AndamioText variant="small" className="text-muted-foreground">
                You have successfully completed this module on-chain.
              </AndamioText>
            </div>
            {commitment?.networkEvidence && (
              <div className="space-y-2">
                <AndamioLabel>Your Approved Work</AndamioLabel>
                <ContentDisplay content={commitment.networkEvidence} variant="muted" />
                {commitment.networkEvidenceHash && (
                  <EvidenceHashDisplay label="Evidence Hash:" hash={commitment.networkEvidenceHash} />
                )}
              </div>
            )}
          </div>

        ) : commitment?.networkStatus === "ASSIGNMENT_ACCEPTED" ? (
          /* Branch: Assignment accepted — credential claim */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-primary/10 border-primary/20">
              <SuccessIcon className="h-8 w-8 text-primary shrink-0" />
              <div>
                <AndamioText className="font-medium">Assignment Accepted!</AndamioText>
                <AndamioText variant="small" className="text-muted-foreground">
                  Your teacher has approved your work. You can now claim your credential.
                </AndamioText>
              </div>
            </div>
            {commitment.networkEvidence && (
              <div className="space-y-2">
                <AndamioLabel>Your Approved Work</AndamioLabel>
                <ContentDisplay content={commitment.networkEvidence} variant="muted" />
              </div>
            )}
            <AndamioSeparator />
            <CredentialClaim
              courseId={courseId}
              moduleCode={moduleCode}
              moduleTitle={assignmentTitle}
              onSuccess={() => {
                void refetchCommitment();
                void refetchCourse();
              }}
            />
          </div>

        ) : commitment?.networkStatus === "ASSIGNMENT_DENIED" ? (
          /* Branch: Assignment denied — revision flow with Finalize step */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-destructive/10 border-destructive/30">
              <AlertIcon className="h-8 w-8 text-destructive shrink-0" />
              <div>
                <AndamioText className="font-medium">Needs Revision</AndamioText>
                <AndamioText variant="small" className="text-muted-foreground">
                  Your instructor reviewed your submission and requested changes. Update your work below and resubmit.
                </AndamioText>
              </div>
            </div>
            {commitment.networkEvidence && (
              <div className="space-y-2">
                <AndamioLabel>Previous Submission (Refused)</AndamioLabel>
                <ContentDisplay content={commitment.networkEvidence} variant="muted" />
                {commitment.networkEvidenceHash && (
                  <EvidenceHashDisplay label="Previous Hash:" hash={commitment.networkEvidenceHash} />
                )}
              </div>
            )}
            <AndamioSeparator />

            {!isRevisionLocked ? (
              /* Step 1: Edit and Finalize */
              <EvidenceEditorSection
                label="Revised Work"
                description="Edit your work below. When ready, click Finalize to save and prepare for resubmission."
                placeholder="Revise your assignment work..."
                content={localEvidenceContent}
                onContentChange={handleEvidenceContentChange}
                onLock={handleLockRevision}
                lockDisabled={!localEvidenceContent}
              />
            ) : (
              /* Step 2: Review and Submit TX */
              <div className="space-y-4">
                <div className="space-y-2">
                  <AndamioLabel>Finalized Revision</AndamioLabel>
                  {localEvidenceContent && (
                    <ContentDisplay content={localEvidenceContent} variant="muted" />
                  )}
                  {revisionHash && (
                    <EvidenceHashDisplay label="Revision Hash:" hash={revisionHash} truncate={false} />
                  )}
                </div>
                <AndamioSeparator />
                <UpdateTxStatusSection
                  txState={updateTx.state}
                  txResult={updateTx.result}
                  txError={parseTxErrorMessage(updateTx.error?.message)}
                  txStatus={updateTxStatus}
                  txConfirmed={updateTxConfirmed}
                  onRetry={() => updateTx.reset()}
                  successMessage="Revised work submitted successfully!"
                />
                {updateTx.state === "idle" && !updateTxConfirmed && (
                  <div className="flex justify-end gap-2">
                    <AndamioButton variant="outline" onClick={handleUnlockRevision}>
                      Edit Revision
                    </AndamioButton>
                    {user?.accessTokenAlias && sltHash && revisionHash && (
                      <UpdateEvidenceActions
                        txState={updateTx.state}
                        txConfirmed={updateTxConfirmed}
                        localEvidenceContent={localEvidenceContent}
                        accessTokenAlias={user.accessTokenAlias}
                        courseId={courseId}
                        sltHash={sltHash}
                        onExecuteTx={async () => {
                          await handleUpdateTxExecute(revisionHash);
                        }}
                        submitLabel="Resubmit Work"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        ) : !commitment || commitment.networkStatus === "PENDING_TX_COMMIT" ? (
          /* Branch: No commitment OR evidence saved but TX not yet submitted */
          <div className="space-y-4">
            {!isLocked ? (
              <EvidenceEditorSection
                label="Your Work"
                description="Write your assignment work below. When you are ready, click Finalize to prepare it for submission."
                placeholder="Write your assignment work..."
                content={localEvidenceContent}
                onContentChange={handleEvidenceContentChange}
                onLock={handleLockEvidence}
                lockDisabled={!localEvidenceContent}
              />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <AndamioLabel>Finalized Work</AndamioLabel>
                  {evidenceContent && (
                    <ContentDisplay content={evidenceContent} variant="muted" />
                  )}
                  {evidenceHash && (
                    <EvidenceHashDisplay label="Submission Hash:" hash={evidenceHash} truncate={false} />
                  )}
                </div>
                <AndamioSeparator />
                <div className="space-y-3">
                  <UpdateTxStatusSection
                    txState={commitTx.state}
                    txResult={commitTx.result}
                    txError={parseTxErrorMessage(commitTx.error?.message)}
                    txStatus={commitTxStatus}
                    txConfirmed={commitTxConfirmed}
                    onRetry={() => commitTx.reset()}
                    successMessage="Assignment submitted successfully!"
                  />
                  {commitTx.state === "idle" && !commitTxConfirmed && (
                    <div className="flex justify-end gap-2">
                      <AndamioButton variant="outline" onClick={handleUnlockEvidence}>
                        Edit Work
                      </AndamioButton>
                      {user?.accessTokenAlias && sltHash && evidenceHash && (
                        <UpdateEvidenceActions
                          txState={commitTx.state}
                          txConfirmed={commitTxConfirmed}
                          localEvidenceContent={evidenceContent}
                          accessTokenAlias={user.accessTokenAlias}
                          courseId={courseId}
                          sltHash={sltHash}
                          onExecuteTx={async (hash) => {
                            await commitTx.execute({
                              txType: "COURSE_STUDENT_ASSIGNMENT_COMMIT",
                              params: {
                                alias: user.accessTokenAlias!,
                                course_id: courseId,
                                slt_hash: sltHash,
                                assignment_info: hash,
                              },
                              metadata: {
                                slt_hash: sltHash,
                                course_module_code: moduleCode,
                                evidence: JSON.stringify(evidenceContent),
                                evidence_hash: hash,
                              },
                              recoveryContext: {
                                kind: "course_assignment",
                                courseId,
                                moduleCode,
                                sltHash,
                              },
                              onSuccess: () => {
                                setHasUnsavedChanges(false);
                              },
                              onError: (err) => setTxError(err.message),
                            });
                          }}
                          submitLabel="Submit Assignment"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        ) : (
          /* Branch: Existing commitment — read-only status */
          <div className="space-y-4">
            <CommitmentStatusBanner networkStatus={commitment.networkStatus} />
            <div className="space-y-2">
              <AndamioLabel>Your Submitted Work</AndamioLabel>
              {commitment.networkEvidence ? (
                <>
                  <ContentDisplay content={commitment.networkEvidence} variant="muted" />
                  {commitment.networkEvidenceHash && (
                    <EvidenceHashDisplay label="Submission Hash:" hash={commitment.networkEvidenceHash} />
                  )}
                </>
              ) : (
                <AndamioAlert>
                  <AlertIcon className="h-4 w-4" />
                  <AndamioAlertDescription>No submission content available.</AndamioAlertDescription>
                </AndamioAlert>
              )}
            </div>
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}

// =============================================================================
// CommitmentStatusBanner — JSX wrapper for getBannerConfig
// =============================================================================
// The config function lives in `./assignment-commitment-banner.ts` so it can
// be unit-tested without React rendering. See issue #520.

function CommitmentStatusBanner({
  networkStatus,
}: {
  networkStatus: CommitmentNetworkStatus;
}) {
  const config = getBannerConfig(networkStatus);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-4 ${config.bannerClass}`}>
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 shrink-0 ${config.iconClass}`} />
        <div>
          <AndamioText className="font-medium">{config.title}</AndamioText>
          <AndamioText variant="small" className="text-xs">
            {config.subtitle}
          </AndamioText>
        </div>
      </div>
    </div>
  );
}
