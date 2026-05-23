/**
 * Hook to bridge student credential data into the format
 * that `checkProjectEligibility()` expects.
 *
 * Uses the single `POST /api/v2/course/student/credentials/list` endpoint
 * instead of N+1 parallel queries — one network call for all prerequisite data.
 *
 * @example
 * ```tsx
 * const { completions, isLoading } = useStudentCompletionsForPrereqs(prereqCourseIds);
 * const result = checkProjectEligibility(prerequisites, completions);
 * ```
 */

import { useMemo } from "react";
import { useStudentCredentials } from "./use-student-credentials";
import type { StudentCompletionInput } from "~/lib/project-eligibility";

/**
 * Fetch student course completions for a set of prerequisite course IDs.
 *
 * Returns `StudentCompletionInput[]` ready for `checkProjectEligibility()`.
 * Uses the credentials endpoint which returns everything in one call.
 *
 * @param prerequisiteCourseIds - Unique course IDs from project prerequisites
 */
export function useStudentCompletionsForPrereqs(
  prerequisiteCourseIds: string[],
) {
  const hasPrereqs = prerequisiteCourseIds.length > 0;

  const {
    data: credentials,
    isLoading,
    isError,
  } = useStudentCredentials({ enabled: hasPrereqs });

  // Memoize to produce a stable reference — without this, .map() returns a
  // new array every render, which triggers any useEffect that depends on it.
  const completions: StudentCompletionInput[] = useMemo(() => {
    const credentialMap = new Map(
      (credentials ?? []).map((c) => [c.courseId, c]),
    );

    return prerequisiteCourseIds.map((courseId) => {
      const cred = credentialMap.get(courseId);

      if (!cred) {
        return {
          courseId,
          completedModuleHashes: [],
          isEnrolled: false,
        };
      }

      return {
        courseId,
        completedModuleHashes: cred.claimedCredentials,
        isEnrolled: cred.isEnrolled,
      };
    });
  }, [credentials, prerequisiteCourseIds]);

  return {
    completions,
    isLoading,
    isAuthenticated: !isError,
  };
}
