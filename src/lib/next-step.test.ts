import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { CoursePath } from "./course-path";
import { getNextStep } from "./next-step";

const path = (courseId: string, status: CoursePath["status"], claimableCount = 0): CoursePath => ({
  courseId,
  title: `Course ${courseId}`,
  status,
  statusLabel: "",
  claimableCount,
  credentialCount: 0,
  milestones: [],
});

const noReviews = { pendingReviews: [] };

describe("getNextStep", () => {
  it("1. asks for a revision first", () => {
    const step = getNextStep([path("a", "ready_to_claim", 1), path("b", "revision_requested")], noReviews);
    assert.equal(step.title, "Revise your assignment for Course b");
    assert.deepEqual(step.action, { label: "Open course", href: "/course/b" });
  });

  it("2. then a credential to claim", () => {
    const step = getNextStep([path("a", "in_progress"), path("b", "ready_to_claim", 1)], noReviews);
    assert.equal(step.title, "Claim your credential for Course b");
    assert.equal(step.action?.href, "/course/b");
  });

  it("3. then reviews waiting for a teacher, most first", () => {
    const step = getNextStep([path("a", "in_progress")], {
      pendingReviews: [
        { courseId: "t1", courseTitle: "Teach One", count: 1 },
        { courseId: "t2", courseTitle: "Teach Two", count: 3 },
      ],
    });
    assert.equal(step.title, "Review 3 submissions in Teach Two");
    assert.equal(step.action?.href, "/studio/course/t2/teacher");
  });

  it("3. uses the singular for one submission", () => {
    const step = getNextStep([], { pendingReviews: [{ courseId: "t1", courseTitle: "Teach One", count: 1 }] });
    assert.equal(step.title, "Review 1 submission in Teach One");
  });

  it("4. then continuing a course in progress", () => {
    const step = getNextStep([path("a", "with_assessor"), path("b", "in_progress")], noReviews);
    assert.equal(step.title, "Continue Course b");
    assert.equal(step.action?.label, "Continue");
  });

  it("5. then a status with no button while the assessor reviews", () => {
    const step = getNextStep([path("a", "with_assessor"), path("c", "credential_issued")], noReviews);
    assert.equal(step.title, "Your assignment for Course a is with the assessor");
    assert.equal(step.action, undefined);
  });

  it("6. otherwise browse courses", () => {
    const step = getNextStep([path("c", "credential_issued")], noReviews);
    assert.equal(step.title, "Browse courses");
    assert.equal(step.action?.href, "/course");
  });

  it("ignores reviews with a zero count", () => {
    const step = getNextStep([], { pendingReviews: [{ courseId: "t1", courseTitle: "T", count: 0 }] });
    assert.equal(step.title, "Browse courses");
  });
});
