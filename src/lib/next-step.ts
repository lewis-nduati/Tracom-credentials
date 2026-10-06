import type { DashboardPendingReview } from "~/hooks/api/use-dashboard";
import type { CoursePath } from "./course-path";

export interface NextStep {
  title: string;
  detail?: string;
  action?: { label: string; href: string };
}

/**
 * The single next action for the dashboard banner. First matching rule wins:
 * revision → claim → review (teachers) → continue → waiting → browse.
 *
 * Revision links to the course page, not the assignment: the dashboard data
 * has no module code to build the assignment URL.
 */
export function getNextStep(
  paths: CoursePath[],
  teacher: { pendingReviews: DashboardPendingReview[] },
): NextStep {
  const find = (status: CoursePath["status"]) => paths.find((p) => p.status === status);

  const revision = find("revision_requested");
  if (revision) {
    return {
      title: `Revise your assignment for ${revision.title}`,
      detail: "Your assessor asked for changes.",
      action: { label: "Open course", href: `/course/${revision.courseId}` },
    };
  }

  const claim = find("ready_to_claim");
  if (claim) {
    return {
      title: `Claim your credential for ${claim.title}`,
      detail: "Your assignment was accepted.",
      action: { label: "Claim credential", href: `/course/${claim.courseId}` },
    };
  }

  const review = [...teacher.pendingReviews].filter((r) => r.count > 0).sort((a, b) => b.count - a.count)[0];
  if (review) {
    const noun = review.count === 1 ? "submission" : "submissions";
    return {
      title: `Review ${review.count} ${noun} in ${review.courseTitle || "your course"}`,
      action: { label: "Review", href: `/studio/course/${review.courseId}/teacher` },
    };
  }

  const active = find("in_progress");
  if (active) {
    return {
      title: `Continue ${active.title}`,
      action: { label: "Continue", href: `/course/${active.courseId}` },
    };
  }

  const waiting = find("with_assessor");
  if (waiting) {
    return {
      title: `Your assignment for ${waiting.title} is with the assessor`,
      detail: "You'll see the result here once it has been reviewed.",
    };
  }

  return {
    title: "Browse courses",
    detail: "Choose a course to start earning a credential.",
    action: { label: "Browse courses", href: "/course" },
  };
}
