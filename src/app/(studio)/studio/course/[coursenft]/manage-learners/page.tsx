"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCourse } from "~/hooks/api/course/use-course";
import { useTeacherAssignmentCommitments } from "~/hooks/api/course/use-course-teacher";
import {
  AndamioBadge,
  AndamioButton,
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
import { LearnerIcon, AssignmentIcon, SuccessIcon, TeacherIcon } from "~/components/icons";
import { RequireCourseAccess } from "~/components/auth/require-course-access";

/**
 * Manage Learners Page
 *
 * View students who have submitted assignments for a course.
 * Derives the learner list by deduplicating studentAlias from
 * teacher assignment commitments.
 *
 * Wrapped in RequireCourseAccess to ensure only course owners
 * and teachers can view learner data.
 */
export default function ManageLearnersPage() {
  const params = useParams();
  const courseId = params.coursenft as string;

  return (
    <RequireCourseAccess
      courseId={courseId}
      title="Learners"
      description="Connect your wallet to view learners"
    >
      <ManageLearnersContent courseId={courseId} />
    </RequireCourseAccess>
  );
}

function ManageLearnersContent({ courseId }: { courseId: string }) {
  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(courseId);
  const { data: commitments, isLoading: commitmentsLoading } = useTeacherAssignmentCommitments(courseId);

  // Build per-learner stats from commitments (exclude LEFT students)
  const learnerStats = useMemo(() => {
    const stats = new Map<string, { submitted: number; accepted: number; pending: number }>();
    for (const c of commitments ?? []) {
      if (c.commitmentStatus === "LEFT") continue;
      const entry = stats.get(c.studentAlias) ?? { submitted: 0, accepted: 0, pending: 0 };
      entry.submitted++;
      if (c.commitmentStatus === "ACCEPTED") entry.accepted++;
      if (c.commitmentStatus === "SUBMITTED" || c.commitmentStatus === "PENDING_APPROVAL") entry.pending++;
      stats.set(c.studentAlias, entry);
    }
    return stats;
  }, [commitments]);

  const learners = useMemo(
    () => Array.from(learnerStats.keys()).sort(),
    [learnerStats]
  );

  const totalAccepted = useMemo(
    () => Array.from(learnerStats.values()).reduce((sum, s) => sum + s.accepted, 0),
    [learnerStats]
  );

  if (courseLoading || commitmentsLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  if (courseError || !course) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <AndamioBackButton href={`/studio/course/${courseId}`} label="Back to Course" />
        <AndamioPageHeader title="Learners" />
        <AndamioErrorAlert error={courseError?.message ?? "Course not found"} />
      </div>
    );
  }

  return (
    <AndamioScrollArea className="h-full">
    <div className="min-h-full">
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      <AndamioBackButton href={`/studio/course/${courseId}`} label="Back to Course" />

      <AndamioPageHeader
        title="Learners"
        description={`Students with assignment activity in ${course.title ?? "this course"}`}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <AndamioDashboardStat
          icon={LearnerIcon}
          label="Active Learners"
          value={learners.length}
          valueColor={learners.length > 0 ? "success" : undefined}
          iconColor={learners.length > 0 ? "success" : undefined}
        />
        <AndamioDashboardStat
          icon={AssignmentIcon}
          label="Assignments Completed"
          value={totalAccepted}
          valueColor={totalAccepted > 0 ? "success" : undefined}
          iconColor={totalAccepted > 0 ? "success" : undefined}
        />
      </div>

      {/* Pending review CTA */}
      {learnerStats.size > 0 && Array.from(learnerStats.values()).some(s => s.pending > 0) && (
        <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <TeacherIcon className="h-4 w-4 text-primary" />
            <div>
              <AndamioText className="font-medium text-sm">Assignments pending review</AndamioText>
              <AndamioText variant="muted" className="text-xs">
                {Array.from(learnerStats.values()).reduce((sum, s) => sum + s.pending, 0)} submission{Array.from(learnerStats.values()).reduce((sum, s) => sum + s.pending, 0) !== 1 ? "s" : ""} waiting for your decision
              </AndamioText>
            </div>
          </div>
          <Link href={`/studio/course/${courseId}/teacher`}>
            <AndamioButton size="sm">
              Review assignments
            </AndamioButton>
          </Link>
        </div>
      )}

      {/* Learners Card */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle className="flex items-center gap-2">
            <LearnerIcon className="h-5 w-5" />
            Learners
          </AndamioCardTitle>
          <AndamioCardDescription>
            Students who have submitted at least one assignment
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          {learners.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
                <LearnerIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <AndamioText className="font-medium">No learners yet</AndamioText>
              <AndamioText variant="muted" className="mt-1 max-w-[320px]">
                Learners will appear here once they submit assignments for this course.
              </AndamioText>
            </div>
          )}

          {learners.length > 0 && (
            <AndamioTableContainer>
              <AndamioTable>
                <AndamioTableHeader>
                  <AndamioTableRow>
                    <AndamioTableHead className="w-[50px]">#</AndamioTableHead>
                    <AndamioTableHead>Student</AndamioTableHead>
                    <AndamioTableHead className="w-[90px] text-center">Submitted</AndamioTableHead>
                    <AndamioTableHead className="w-[90px] text-center">Completed</AndamioTableHead>
                    <AndamioTableHead className="w-[90px] text-center">Pending</AndamioTableHead>
                    <AndamioTableHead className="w-[80px]" />
                  </AndamioTableRow>
                </AndamioTableHeader>
                <AndamioTableBody>
                  {learners.map((alias, index) => {
                    const stats = learnerStats.get(alias)!;
                    const reviewUrl = `/studio/course/${courseId}/teacher?student=${encodeURIComponent(alias)}`;
                    return (
                      <AndamioTableRow key={alias} className={stats.pending > 0 ? "cursor-pointer hover:bg-muted/50" : undefined}>
                        <AndamioTableCell className="text-muted-foreground">
                          {index + 1}
                        </AndamioTableCell>
                        <AndamioTableCell className="font-mono">
                          {alias}
                        </AndamioTableCell>
                        <AndamioTableCell className="text-center">
                          {stats.submitted}
                        </AndamioTableCell>
                        <AndamioTableCell className="text-center">
                          {stats.accepted > 0 ? (
                            <AndamioBadge variant="default" className="gap-1">
                              <SuccessIcon className="h-3 w-3" />
                              {stats.accepted}
                            </AndamioBadge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </AndamioTableCell>
                        <AndamioTableCell className="text-center">
                          {stats.pending > 0 ? (
                            <AndamioBadge variant="secondary">{stats.pending}</AndamioBadge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </AndamioTableCell>
                        <AndamioTableCell className="text-right">
                          {stats.pending > 0 ? (
                            <Link href={reviewUrl}>
                              <AndamioButton variant="outline" size="sm" className="h-7 text-xs px-2.5">
                                Review
                              </AndamioButton>
                            </Link>
                          ) : null}
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
