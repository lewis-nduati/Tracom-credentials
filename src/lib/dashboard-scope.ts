import type { Dashboard } from "~/hooks/api/use-dashboard";

/**
 * Scope the user dashboard to Tracom's courses and projects.
 *
 * The /user/dashboard endpoint returns the user's activity across every
 * Andamio course and project, without owner fields, so items are matched
 * against the ids of Tracom-owned courses and projects. Counts are rebuilt
 * from the filtered lists so the numbers agree with what's shown.
 */
export function scopeDashboard(
  dashboard: Dashboard,
  courseIds: ReadonlySet<string>,
  projectIds: ReadonlySet<string>,
): Dashboard {
  const isCourse = (item: { courseId: string }) => courseIds.has(item.courseId);
  const isProject = (item: { projectId: string }) => projectIds.has(item.projectId);

  const enrolledCourses = dashboard.student.enrolledCourses.filter(isCourse);
  const completedCourses = dashboard.student.completedCourses.filter(isCourse);
  const credentialsByCourse = dashboard.student.credentialsByCourse.filter(isCourse);
  const teachingCourses = dashboard.teacher.courses.filter(isCourse);
  const pendingReviews = dashboard.teacher.pendingReviews.filter(isCourse);
  const contributing = dashboard.projects.contributing.filter(isProject);
  const managing = dashboard.projects.managing.filter(isProject);
  const pendingAssessments = dashboard.projects.pendingAssessments.filter(isProject);

  const totalCredentials = credentialsByCourse.reduce((sum, c) => sum + c.credentials.length, 0);
  const totalPendingReviews = pendingReviews.reduce((sum, r) => sum + r.count, 0);
  const totalPendingAssessments = pendingAssessments.reduce((sum, a) => sum + a.count, 0);

  return {
    ...dashboard,
    counts: {
      enrolledCourses: enrolledCourses.length,
      completedCourses: completedCourses.length,
      totalCredentials,
      teachingCourses: teachingCourses.length,
      pendingReviews: totalPendingReviews,
      contributingProjects: contributing.length,
      managingProjects: managing.length,
      pendingProjectAssessments: totalPendingAssessments,
    },
    student: {
      enrolledCourses,
      completedCourses,
      totalCredentials,
      credentialsByCourse,
      commitments: dashboard.student.commitments.filter(isCourse),
    },
    teacher: {
      courses: teachingCourses,
      pendingReviews,
      totalPendingReviews,
    },
    projects: {
      contributing,
      managing,
      withPrerequisites: dashboard.projects.withPrerequisites.filter(isProject),
      pendingAssessments,
      totalPendingAssessments,
    },
  };
}
