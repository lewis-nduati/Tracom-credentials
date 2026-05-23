import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  deriveModuleCompleted,
  hasClaimedModuleCredential,
  type StudentCourseCredential,
} from "./use-student-credentials";

// =============================================================================
// Test factories
// =============================================================================

function credential(
  overrides: Partial<StudentCourseCredential> = {},
): StudentCourseCredential {
  return {
    courseId: "course-1",
    courseTitle: "Course 1",
    isEnrolled: true,
    enrollmentStatus: "enrolled",
    claimedCredentials: [],
    modules: [],
    source: "merged",
    ...overrides,
  };
}

// =============================================================================
// hasClaimedModuleCredential
// =============================================================================

describe("hasClaimedModuleCredential — empty / missing data", () => {
  it("returns false when credentials list is empty", () => {
    assert.equal(hasClaimedModuleCredential([], "course-1", "MODULE_1"), false);
  });

  it("returns false when course is not present in credentials", () => {
    const creds = [credential({ courseId: "course-2" })];
    assert.equal(
      hasClaimedModuleCredential(creds, "course-1", "MODULE_1"),
      false,
    );
  });

  it("returns false when course has no claimed credentials", () => {
    const creds = [
      credential({
        modules: [
          { courseModuleCode: "MODULE_1", sltHash: "hash-1", title: "M1" },
        ],
        claimedCredentials: [],
      }),
    ];
    assert.equal(
      hasClaimedModuleCredential(creds, "course-1", "MODULE_1"),
      false,
    );
  });
});

describe("hasClaimedModuleCredential — module-level resolution", () => {
  it("returns true when the module's slt_hash is in claimedCredentials", () => {
    const creds = [
      credential({
        modules: [
          { courseModuleCode: "MODULE_1", sltHash: "hash-1", title: "M1" },
          { courseModuleCode: "MODULE_2", sltHash: "hash-2", title: "M2" },
        ],
        claimedCredentials: ["hash-1"],
      }),
    ];
    assert.equal(
      hasClaimedModuleCredential(creds, "course-1", "MODULE_1"),
      true,
    );
  });

  // Regression: original bug proxied a course-level `pastStudents` state into
  // a per-module "Module Completed" banner. Per-module scoping is the contract
  // any implementation must satisfy.
  it("does not leak across modules in the same course", () => {
    const creds = [
      credential({
        modules: [
          { courseModuleCode: "MODULE_1", sltHash: "hash-1", title: "M1" },
          { courseModuleCode: "MODULE_LAST", sltHash: "hash-last", title: "ML" },
        ],
        claimedCredentials: ["hash-1"],
      }),
    ];
    assert.equal(
      hasClaimedModuleCredential(creds, "course-1", "MODULE_LAST"),
      false,
    );
  });

  it("returns false when the module's slt_hash is empty (module not yet on-chain)", () => {
    const creds = [
      credential({
        modules: [
          { courseModuleCode: "MODULE_1", sltHash: "", title: "M1" },
        ],
        claimedCredentials: [""],
      }),
    ];
    assert.equal(
      hasClaimedModuleCredential(creds, "course-1", "MODULE_1"),
      false,
    );
  });

  it("isolates across courses — claim in course-2 does not leak to course-1", () => {
    const creds = [
      credential({
        courseId: "course-1",
        modules: [
          { courseModuleCode: "MODULE_1", sltHash: "hash-c1-m1", title: "M1" },
        ],
        claimedCredentials: [],
      }),
      credential({
        courseId: "course-2",
        modules: [
          { courseModuleCode: "MODULE_1", sltHash: "hash-c2-m1", title: "M1" },
        ],
        claimedCredentials: ["hash-c2-m1"],
      }),
    ];
    assert.equal(
      hasClaimedModuleCredential(creds, "course-1", "MODULE_1"),
      false,
    );
  });

  // The transform layer does not enforce sltHash uniqueness within a course's
  // modules. If two modules share an sltHash and the *other* module's hash is
  // claimed, the helper currently returns true — pinning this is intentional
  // so a future change to dedupe at the transform layer fails this test
  // loudly rather than silently.
  it("pins behavior when two modules share an sltHash (per-course uniqueness violated)", () => {
    const creds = [
      credential({
        modules: [
          { courseModuleCode: "MODULE_1", sltHash: "shared-hash", title: "M1" },
          { courseModuleCode: "MODULE_2", sltHash: "shared-hash", title: "M2" },
        ],
        claimedCredentials: ["shared-hash"],
      }),
    ];
    assert.equal(
      hasClaimedModuleCredential(creds, "course-1", "MODULE_2"),
      true,
      "current behavior: shared sltHash leaks across modules",
    );
  });
});

// =============================================================================
// deriveModuleCompleted — composed (status × credential) gate
// =============================================================================

describe("deriveModuleCompleted — status precondition", () => {
  const claimedCreds = [
    credential({
      modules: [
        { courseModuleCode: "MODULE_1", sltHash: "hash-1", title: "M1" },
      ],
      claimedCredentials: ["hash-1"],
    }),
  ];

  it("returns true for ASSIGNMENT_ACCEPTED with a matching claim", () => {
    assert.equal(
      deriveModuleCompleted(
        "ASSIGNMENT_ACCEPTED",
        claimedCreds,
        "course-1",
        "MODULE_1",
      ),
      true,
    );
  });

  it("returns true for raw CREDENTIAL_CLAIMED with a matching claim (gateway alias passthrough)", () => {
    assert.equal(
      deriveModuleCompleted(
        "CREDENTIAL_CLAIMED",
        claimedCreds,
        "course-1",
        "MODULE_1",
      ),
      true,
    );
  });

  it("returns true for on-chain alias COMPLETED (normalized to CREDENTIAL_CLAIMED)", () => {
    assert.equal(
      deriveModuleCompleted("COMPLETED", claimedCreds, "course-1", "MODULE_1"),
      true,
    );
  });

  it("returns false for non-accepted lifecycle states", () => {
    for (const status of [
      "NOT_STARTED",
      "IN_PROGRESS",
      "AWAITING_SUBMISSION",
      "PENDING_APPROVAL",
      "SUBMITTED",
      "ASSIGNMENT_DENIED",
      "PENDING_TX_COMMIT",
      "PENDING_TX_ACCEPT",
      "UNKNOWN_GATEWAY_VALUE",
    ]) {
      assert.equal(
        deriveModuleCompleted(status, claimedCreds, "course-1", "MODULE_1"),
        false,
        `status=${status} must not yield completed`,
      );
    }
  });

  it("returns false for null/undefined/empty status", () => {
    assert.equal(
      deriveModuleCompleted(null, claimedCreds, "course-1", "MODULE_1"),
      false,
    );
    assert.equal(
      deriveModuleCompleted(undefined, claimedCreds, "course-1", "MODULE_1"),
      false,
    );
    assert.equal(
      deriveModuleCompleted("", claimedCreds, "course-1", "MODULE_1"),
      false,
    );
  });
});

describe("deriveModuleCompleted — credential precondition", () => {
  it("returns false for ASSIGNMENT_ACCEPTED with no claimed credential", () => {
    const creds = [
      credential({
        modules: [
          { courseModuleCode: "MODULE_1", sltHash: "hash-1", title: "M1" },
        ],
        claimedCredentials: [],
      }),
    ];
    assert.equal(
      deriveModuleCompleted(
        "ASSIGNMENT_ACCEPTED",
        creds,
        "course-1",
        "MODULE_1",
      ),
      false,
    );
  });

  // The bug fixed in PR #603, expressed at the composed-gate level.
  it("does not leak across modules in the same course", () => {
    const creds = [
      credential({
        modules: [
          { courseModuleCode: "MODULE_1", sltHash: "hash-1", title: "M1" },
          { courseModuleCode: "MODULE_LAST", sltHash: "hash-last", title: "ML" },
        ],
        claimedCredentials: ["hash-1"],
      }),
    ];
    assert.equal(
      deriveModuleCompleted(
        "ASSIGNMENT_ACCEPTED",
        creds,
        "course-1",
        "MODULE_LAST",
      ),
      false,
    );
  });

  it("isolates across courses", () => {
    const creds = [
      credential({
        courseId: "course-2",
        modules: [
          { courseModuleCode: "MODULE_1", sltHash: "hash-c2-m1", title: "M1" },
        ],
        claimedCredentials: ["hash-c2-m1"],
      }),
    ];
    assert.equal(
      deriveModuleCompleted(
        "ASSIGNMENT_ACCEPTED",
        creds,
        "course-1",
        "MODULE_1",
      ),
      false,
    );
  });
});
