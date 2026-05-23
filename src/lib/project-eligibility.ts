/**
 * Project Eligibility Checker
 *
 * Determines if a user meets the prerequisites to contribute to a project.
 * Prerequisites are course modules that must be completed before joining.
 *
 * This is a pure function that accepts data from hooks rather than fetching directly.
 * Callers should pass prerequisites from useProject() and student completion data
 * from useCourse() or useStudentCourses().
 */

/**
 * Prerequisite info passed from useProject() hook
 */
export interface PrerequisiteInput {
  courseId: string;
  sltHashes?: string[];
}

/**
 * Student completion record for a course
 * Callers should provide this from their hooks data
 */
export interface StudentCompletionInput {
  courseId: string;
  completedModuleHashes: string[];
  isEnrolled: boolean;
}

/**
 * Missing prerequisite info for UI display
 */
export interface MissingPrerequisite {
  courseId: string;
  requiredModules: string[];
  completedModules: string[];
  missingModules: string[];
}

/**
 * Eligibility check result
 */
export interface EligibilityResult {
  /** Whether user meets all prerequisites */
  eligible: boolean;
  /** Prerequisites that are not yet met */
  missingPrerequisites: MissingPrerequisite[];
  /** Total modules required across all prerequisite courses */
  totalRequired: number;
  /** Total modules user has completed that count toward prerequisites */
  totalCompleted: number;
  /** Raw project prerequisites for reference */
  prerequisites: PrerequisiteInput[];
}

/**
 * Check if a user meets the prerequisites for a project
 *
 * Pure function — accepts data from hooks instead of making API calls.
 *
 * @param prerequisites - From useProject().projectDetail.prerequisites
 * @param studentCompletions - From useCourse() or useStudentCourses() for each prerequisite course
 * @returns Eligibility result with details about missing prerequisites
 *
 * @example
 * ```typescript
 * const prerequisites = projectDetail.prerequisites ?? [];
 * const completions = await getStudentCompletionsFromHooks(prerequisites, alias);
 * const result = checkProjectEligibility(prerequisites, completions);
 * ```
 */
export function checkProjectEligibility(
  prerequisites: PrerequisiteInput[],
  studentCompletions: StudentCompletionInput[],
): EligibilityResult {
  // No prerequisites = always eligible
  if (prerequisites.length === 0) {
    return {
      eligible: true,
      missingPrerequisites: [],
      totalRequired: 0,
      totalCompleted: 0,
      prerequisites: [],
    };
  }

  // Build lookup map for student completions
  const completionMap = new Map<string, StudentCompletionInput>();
  for (const completion of studentCompletions) {
    completionMap.set(completion.courseId, completion);
  }

  const missingPrerequisites: MissingPrerequisite[] = [];
  let totalRequired = 0;
  let totalCompleted = 0;

  for (const prereq of prerequisites) {
    const requiredModules = prereq.sltHashes ?? [];
    totalRequired += requiredModules.length;

    const courseProgress = completionMap.get(prereq.courseId);

    // If no progress at all, user has no completed modules in this course
    if (!courseProgress) {
      missingPrerequisites.push({
        courseId: prereq.courseId,
        requiredModules,
        completedModules: [],
        missingModules: requiredModules,
      });
      continue;
    }

    const completedModules = courseProgress.completedModuleHashes;

    // Check which required modules are completed
    const missingModules = requiredModules.filter(
      (moduleHash) => !completedModules.includes(moduleHash)
    );

    const completedRequiredModules = requiredModules.filter(
      (moduleHash) => completedModules.includes(moduleHash)
    );

    totalCompleted += completedRequiredModules.length;

    if (missingModules.length > 0) {
      missingPrerequisites.push({
        courseId: prereq.courseId,
        requiredModules,
        completedModules: completedRequiredModules,
        missingModules,
      });
    }
  }

  return {
    eligible: missingPrerequisites.length === 0,
    missingPrerequisites,
    totalRequired,
    totalCompleted,
    prerequisites,
  };
}

/**
 * Quick eligibility check (just returns boolean)
 *
 * @param prerequisites - From useProject().projectDetail.prerequisites
 * @param studentCompletions - Student completion records
 * @returns true if user meets all prerequisites
 */
export function isUserEligible(
  prerequisites: PrerequisiteInput[],
  studentCompletions: StudentCompletionInput[],
): boolean {
  const result = checkProjectEligibility(prerequisites, studentCompletions);
  return result.eligible;
}
