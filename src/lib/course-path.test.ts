import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { DashboardStudent } from "~/hooks/api/use-dashboard";
import { getCoursePaths } from "./course-path";

const course = (courseId: string, title = courseId) => ({ courseId, title, description: "", imageUrl: "" });

function student(over: Partial<DashboardStudent>): DashboardStudent {
  return {
    enrolledCourses: [],
    completedCourses: [],
    totalCredentials: 0,
    credentialsByCourse: [],
    commitments: [],
    ...over,
  };
}

describe("getCoursePaths", () => {
  it("marks a fresh enrolment as in progress with only the first milestone done", () => {
    const [p] = getCoursePaths(student({ enrolledCourses: [course("c1", "Payments")] }));
    assert.equal(p!.status, "in_progress");
    assert.equal(p!.statusLabel, "In progress");
    assert.deepEqual(p!.milestones.map((m) => m.done), [true, false, false, false]);
  });

  it("reports a submission waiting for review", () => {
    const [p] = getCoursePaths(
      student({
        enrolledCourses: [course("c1")],
        commitments: [{ courseId: "c1", sltHash: "h1", status: "PENDING_APPROVAL" }],
      }),
    );
    assert.equal(p!.status, "with_assessor");
    assert.deepEqual(p!.milestones.map((m) => m.done), [true, true, false, false]);
  });

  it("asks for a revision when an assignment was refused", () => {
    const [p] = getCoursePaths(
      student({
        enrolledCourses: [course("c1")],
        commitments: [{ courseId: "c1", sltHash: "h1", status: "ASSIGNMENT_DENIED" }],
      }),
    );
    assert.equal(p!.status, "revision_requested");
    assert.equal(p!.statusLabel, "Revision requested");
  });

  it("offers a claim when accepted but not yet claimed", () => {
    const [p] = getCoursePaths(
      student({
        enrolledCourses: [course("c1")],
        commitments: [{ courseId: "c1", sltHash: "h1", status: "ASSIGNMENT_ACCEPTED" }],
      }),
    );
    assert.equal(p!.status, "ready_to_claim");
    assert.equal(p!.claimableCount, 1);
    assert.deepEqual(p!.milestones.map((m) => m.done), [true, true, true, false]);
  });

  it("treats a claimed credential as issued", () => {
    const [p] = getCoursePaths(
      student({
        completedCourses: [course("c1")],
        credentialsByCourse: [{ courseId: "c1", courseTitle: "c1", credentials: ["h1"] }],
        commitments: [{ courseId: "c1", sltHash: "h1", status: "ASSIGNMENT_ACCEPTED" }],
      }),
    );
    assert.equal(p!.status, "credential_issued");
    assert.equal(p!.credentialCount, 1);
    assert.equal(p!.claimableCount, 0);
    assert.deepEqual(p!.milestones.map((m) => m.done), [true, true, true, true]);
  });

  it("lists claimable courses first, then in progress, then issued", () => {
    const paths = getCoursePaths(
      student({
        enrolledCourses: [course("a"), course("b")],
        completedCourses: [course("c")],
        credentialsByCourse: [{ courseId: "c", courseTitle: "c", credentials: ["x"] }],
        commitments: [{ courseId: "b", sltHash: "y", status: "ASSIGNMENT_ACCEPTED" }],
      }),
    );
    assert.deepEqual(paths.map((p) => p.courseId), ["b", "a", "c"]);
  });

  it("falls back to a short id when a course has no title", () => {
    const [p] = getCoursePaths(student({ enrolledCourses: [course("0123456789abcdef", "")] }));
    assert.equal(p!.title, "Course 01234567…");
  });
});
