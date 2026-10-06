import type { DashboardStudent } from "~/hooks/api/use-dashboard";
import type { PathMilestone } from "~/components/andamio/andamio-path-timeline";
import { normalizeAssignmentStatus } from "~/lib/assignment-status";

export type CourseStatus =
  | "revision_requested"
  | "ready_to_claim"
  | "with_assessor"
  | "in_progress"
  | "credential_issued";

export interface CoursePath {
  courseId: string;
  title: string;
  status: CourseStatus;
  statusLabel: string;
  /** Accepted assignments whose credential hasn't been claimed. */
  claimableCount: number;
  credentialCount: number;
  milestones: PathMilestone[];
}

const LABELS: Record<CourseStatus, string> = {
  revision_requested: "Revision requested",
  ready_to_claim: "Credential ready to claim",
  with_assessor: "With the assessor",
  in_progress: "In progress",
  credential_issued: "Credential issued",
};

const ORDER: Record<CourseStatus, number> = {
  ready_to_claim: 0,
  revision_requested: 1,
  with_assessor: 2,
  in_progress: 3,
  credential_issued: 4,
};

const SUBMITTED = new Set(["PENDING_APPROVAL", "ASSIGNMENT_ACCEPTED", "ASSIGNMENT_DENIED", "CREDENTIAL_CLAIMED"]);

/**
 * One entry per course the learner is enrolled in or has completed, with a
 * status in words and four milestones (enrolled, submitted, accepted,
 * credential claimed) worked out from the dashboard's commitment statuses.
 */
export function getCoursePaths(student: DashboardStudent): CoursePath[] {
  const claimed = new Set(student.credentialsByCourse.flatMap((c) => c.credentials));
  const completedIds = new Set(student.completedCourses.map((c) => c.courseId));
  const seen = new Set<string>();

  const paths: CoursePath[] = [];
  for (const c of [...student.enrolledCourses, ...student.completedCourses]) {
    if (seen.has(c.courseId)) continue;
    seen.add(c.courseId);

    const statuses = student.commitments
      .filter((m) => m.courseId === c.courseId)
      .map((m) => ({ hash: m.sltHash, status: normalizeAssignmentStatus(m.status) }));
    const credentialCount =
      student.credentialsByCourse.find((x) => x.courseId === c.courseId)?.credentials.length ?? 0;
    const claimableCount = statuses.filter((s) => s.status === "ASSIGNMENT_ACCEPTED" && !claimed.has(s.hash)).length;

    const anySubmitted = statuses.some((s) => SUBMITTED.has(s.status));
    const anyAccepted = statuses.some((s) => s.status === "ASSIGNMENT_ACCEPTED" || s.status === "CREDENTIAL_CLAIMED");
    const issued = credentialCount > 0 || completedIds.has(c.courseId);

    const status: CourseStatus = statuses.some((s) => s.status === "ASSIGNMENT_DENIED")
      ? "revision_requested"
      : claimableCount > 0
        ? "ready_to_claim"
        : statuses.some((s) => s.status === "PENDING_APPROVAL")
          ? "with_assessor"
          : issued
            ? "credential_issued"
            : "in_progress";

    paths.push({
      courseId: c.courseId,
      title: c.title || `Course ${c.courseId.slice(0, 8)}…`,
      status,
      statusLabel: LABELS[status],
      claimableCount,
      credentialCount,
      milestones: [
        { id: "enrolled", label: "Enrolled", done: true },
        { id: "submitted", label: "Assignment submitted", done: anySubmitted || issued },
        { id: "accepted", label: "Assignment accepted", done: anyAccepted || issued },
        { id: "claimed", label: "Credential claimed", done: issued },
      ],
    });
  }

  return paths.sort((a, b) => ORDER[a.status] - ORDER[b.status]);
}
