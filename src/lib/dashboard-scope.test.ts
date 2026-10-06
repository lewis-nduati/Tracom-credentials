import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Dashboard } from "~/hooks/api/use-dashboard";
import { scopeDashboard } from "./dashboard-scope";

const course = (courseId: string) => ({ courseId, title: courseId, description: "", imageUrl: "" });
const project = (projectId: string) => ({ projectId, title: projectId, description: "", imageUrl: "" });

const dashboard: Dashboard = {
  user: { alias: "learner", walletAddress: "" },
  counts: {
    enrolledCourses: 2, completedCourses: 1, totalCredentials: 3, teachingCourses: 0,
    pendingReviews: 0, contributingProjects: 2, managingProjects: 0, pendingProjectAssessments: 0,
  },
  student: {
    enrolledCourses: [course("tracom-1"), course("other")],
    completedCourses: [course("other")],
    totalCredentials: 3,
    credentialsByCourse: [
      { courseId: "tracom-1", courseTitle: "", credentials: ["a"] },
      { courseId: "other", courseTitle: "", credentials: ["b", "c"] },
    ],
    commitments: [{ courseId: "other", sltHash: "", status: "" }],
  },
  teacher: { courses: [], pendingReviews: [], totalPendingReviews: 0 },
  projects: {
    contributing: [project("tracom-p"), project("other-p")],
    managing: [],
    withPrerequisites: [],
    pendingAssessments: [],
    totalPendingAssessments: 0,
  },
};

describe("scopeDashboard", () => {
  const scoped = scopeDashboard(dashboard, new Set(["tracom-1"]), new Set(["tracom-p"]));

  it("drops courses and projects from other owners", () => {
    assert.deepEqual(scoped.student.enrolledCourses.map((c) => c.courseId), ["tracom-1"]);
    assert.equal(scoped.student.completedCourses.length, 0);
    assert.equal(scoped.student.commitments.length, 0);
    assert.deepEqual(scoped.projects.contributing.map((p) => p.projectId), ["tracom-p"]);
  });

  it("rebuilds counts from what is left", () => {
    assert.equal(scoped.counts.enrolledCourses, 1);
    assert.equal(scoped.counts.completedCourses, 0);
    assert.equal(scoped.counts.totalCredentials, 1);
    assert.equal(scoped.student.totalCredentials, 1);
    assert.equal(scoped.counts.contributingProjects, 1);
  });

  it("shows nothing when no ids are owned", () => {
    const empty = scopeDashboard(dashboard, new Set(), new Set());
    assert.equal(empty.student.enrolledCourses.length, 0);
    assert.equal(empty.counts.totalCredentials, 0);
  });
});
