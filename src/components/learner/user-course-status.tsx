"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useCourse, useCourseModules, useStudentCourses } from "~/hooks/api";
import { useStudentAssignmentCommitments } from "~/hooks/api/course/use-student-assignment-commitments";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "~/components/tx/transaction-button";
import { TransactionStatus } from "~/components/tx/transaction-status";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioCardLoading } from "~/components/andamio/andamio-loading";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioProgress } from "~/components/andamio/andamio-progress";
import { toast } from "sonner";
import {
  SuccessIcon,
  OnChainIcon,
  LoadingIcon,
} from "~/components/icons";

/**
 * User Course Status Component
 *
 * Displays the authenticated learner's enrollment status in a course.
 * Uses the V2 merged API endpoints.
 *
 * Note: Detailed per-module progress is not available in V2 API.
 * This component shows enrollment and completion status only.
 */

interface UserCourseStatusProps {
  courseId: string;
}

export function UserCourseStatus({ courseId }: UserCourseStatusProps) {
  const { isAuthenticated } = useAndamioAuth();

  // Fetch merged course data
  const { data: course, isLoading: courseLoading } = useCourse(courseId);

  // Fetch database modules for count
  const { data: dbModules } = useCourseModules(courseId);

  // Fetch user's enrolled/completed courses
  const { data: studentCourses, isLoading: studentLoading, refetch: refetchStudent } = useStudentCourses();

  // Fetch student commitments for progress summary
  const { data: studentCommitments } = useStudentAssignmentCommitments(courseId);

  // Count accepted assignments for progress calculation
  const acceptedCount = useMemo(() => {
    if (!studentCommitments || studentCommitments.length === 0) return 0;
    return studentCommitments.filter(
      (c) => c.networkStatus === "ASSIGNMENT_ACCEPTED",
    ).length;
  }, [studentCommitments]);

  // Find this course in student's courses
  const studentCourseStatus = useMemo(() => {
    if (!studentCourses) return null;
    return studentCourses.find((c) => c.courseId === courseId);
  }, [studentCourses, courseId]);

  if (!isAuthenticated) {
    return null;
  }

  const isLoading = courseLoading || studentLoading;

  if (isLoading) {
    return <AndamioCardLoading title="Your Progress" lines={3} />;
  }

  // Not enrolled — module cards with "Earn Credential" CTAs communicate the path
  if (!studentCourseStatus) {
    return null;
  }

  const isCompleted = studentCourseStatus.enrollmentStatus === "completed";
  const totalModules = dbModules?.length ?? 0;
  const courseTitle = course?.title ?? "this course";

  // Completed state
  if (isCompleted) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <SuccessIcon className="h-5 w-5 text-success" />
            <div>
              <AndamioCardTitle>Course Complete!</AndamioCardTitle>
              <AndamioCardDescription>
                You&apos;ve earned your credential for {courseTitle}
              </AndamioCardDescription>
            </div>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md bg-success/10 border-success/20">
            <div className="flex items-center gap-2">
              <OnChainIcon className="h-4 w-4 text-success" />
              <AndamioText className="text-sm font-medium">Credential Earned</AndamioText>
            </div>
            <AndamioBadge status="success">Verified</AndamioBadge>
          </div>

          {totalModules > 0 && (
            <AndamioText variant="small" className="text-muted-foreground">
              All {totalModules} modules completed
            </AndamioText>
          )}

          <Link href="/credentials">
            <AndamioButton variant="outline" size="sm">
              View All Credentials
            </AndamioButton>
          </Link>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Enrolled (in progress) state
  const accepted = acceptedCount;
  const progressPercent = totalModules > 0 ? Math.round((accepted / totalModules) * 100) : 0;

  return (
    <AndamioCard>
      <AndamioCardContent className="p-4 space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <AndamioText variant="small" className="font-medium">
              {accepted} of {totalModules} {totalModules === 1 ? "module" : "modules"} complete
            </AndamioText>
            <AndamioText variant="small" className="text-muted-foreground">
              {progressPercent}%
            </AndamioText>
          </div>
          <AndamioProgress
            value={progressPercent}
            aria-label={`Course progress: ${accepted} of ${totalModules} modules complete`}
            aria-valuenow={accepted}
            aria-valuemin={0}
            aria-valuemax={totalModules}
          />
        </div>

        {/* Summary + CTA */}
        {totalModules > 0 && (
          <CredentialClaimCTA
            courseId={courseId}
            courseTitle={courseTitle}
            accepted={accepted}
            totalModules={totalModules}
            onSuccess={() => void refetchStudent()}
          />
        )}

      </AndamioCardContent>
    </AndamioCard>
  );
}

// =============================================================================
// Credential Claim CTA - completion summary + claim or continue action
// =============================================================================

interface CredentialClaimCTAProps {
  courseId: string;
  courseTitle: string;
  accepted: number;
  totalModules: number;
  onSuccess: () => void;
}

function CredentialClaimCTA({
  courseId,
  courseTitle,
  accepted,
  totalModules,
  onSuccess,
}: CredentialClaimCTAProps) {
  const { user } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  const { status: txStatus, isSuccess: txConfirmed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          toast.success("Credentials Claimed!", {
            description: `You've earned your credentials for ${courseTitle}`,
          });
          onSuccess();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Claim Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    },
  );

  const allAccepted = accepted === totalModules;

  const handleClaim = async () => {
    if (!user?.accessTokenAlias) return;

    await execute({
      txType: "COURSE_STUDENT_CREDENTIAL_CLAIM",
      params: {
        alias: user.accessTokenAlias,
        course_id: courseId,
      },
      onSuccess: async (txResult) => {
        console.log("[CredentialClaimCTA] TX submitted!", txResult);
      },
      onError: (txError) => {
        console.error("[CredentialClaimCTA] Error:", txError);
      },
    });
  };

  return (
    <div className="space-y-3 pt-3 border-t">
      {/* Context-aware summary */}
      {allAccepted ? (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3 space-y-1">
          <AndamioText variant="small" className="font-medium text-success">
            All assignments complete!
          </AndamioText>
          <AndamioText variant="small">
            You earned it. Claim your {accepted === 1 ? "credential" : "credentials"} to record {accepted === 1 ? "it" : "them"} on-chain as proof of your achievement.
          </AndamioText>
        </div>
      ) : (
        <AndamioText variant="small">
          <span className="font-semibold">{accepted}</span> of{" "}
          <span className="font-semibold">{totalModules}</span>{" "}
          {totalModules === 1 ? "assignment" : "assignments"} complete
        </AndamioText>
      )}

      {/* TX status feedback */}
      {state !== "idle" && !txConfirmed && (
        <TransactionStatus
          state={state}
          result={result}
          error={error?.message ?? null}
          onRetry={() => reset()}
          messages={{ success: "Transaction submitted! Waiting for confirmation..." }}
        />
      )}

      {/* Gateway confirmation progress */}
      {state === "success" && result?.requiresDBUpdate && !txConfirmed && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <LoadingIcon className="h-4 w-4 animate-spin text-secondary" />
            <div className="flex-1">
              <AndamioText variant="small" className="font-medium">
                Confirming on blockchain...
              </AndamioText>
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

      {/* Success state */}
      {txConfirmed && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3">
          <div className="flex items-center gap-3">
            <SuccessIcon className="h-4 w-4 text-success" />
            <AndamioText variant="small" className="font-medium text-success">
              Credentials claimed! Your achievements have been recorded on-chain.
            </AndamioText>
          </div>
        </div>
      )}

      {/* Claim button — only when all modules accepted */}
      {allAccepted && !txConfirmed && (
        <TransactionButton
          txState={state}
          onClick={handleClaim}
          disabled={!user?.accessTokenAlias}
          stateText={{
            idle: `Claim ${accepted} ${accepted === 1 ? "Credential" : "Credentials"}`,
            fetching: "Preparing Claim...",
            signing: "Sign in Wallet",
            submitting: "Claiming Credentials...",
          }}
          className="w-full"
        />
      )}
    </div>
  );
}
