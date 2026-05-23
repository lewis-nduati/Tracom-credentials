/**
 * React Query API Hooks
 *
 * Centralized exports for all Andamio API hooks.
 * These hooks provide cached, deduplicated access to API data.
 *
 * ## Benefits over raw fetch():
 * - **Caching**: Data is cached and shared across components
 * - **Deduplication**: Multiple components requesting the same data = 1 network request
 * - **Background refetching**: Stale data is automatically refreshed
 * - **Optimistic updates**: Mutations can update cache immediately
 * - **Loading/error states**: Consistent state management
 *
 * ## Usage
 *
 * ```tsx
 * import { useCourse, useCourseModules, useUpdateCourse } from "~/hooks/api";
 *
 * function CourseEditor({ courseId }: { courseId: string }) {
 *   // Read queries - automatically cached
 *   const { data: course, isLoading } = useCourse(courseId);
 *   const { data: modules } = useCourseModules(courseId);
 *
 *   // Mutations - automatically invalidate cache
 *   const updateCourse = useUpdateCourse();
 *
 *   const handleSave = async (data: UpdateCourseInput) => {
 *     await updateCourse.mutateAsync({ courseId, data });
 *     // Cache is automatically invalidated - no manual refetch needed!
 *   };
 *
 *   return <CourseForm course={course} onSave={handleSave} />;
 * }
 * ```
 *
 * ## Query Keys
 *
 * Each hook exports its query keys for advanced cache management:
 *
 * ```tsx
 * import { courseKeys, courseModuleKeys } from "~/hooks/api";
 *
 * // Invalidate all course data
 * queryClient.invalidateQueries({ queryKey: courseKeys.all });
 *
 * // Invalidate specific course
 * queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
 * ```
 */

// =============================================================================
// Course Hooks
// =============================================================================

// Core course (public queries + types)
export {
  useCourse,
  useActiveCourses,
  courseKeys,
  transformCourse,
  transformCourseDetail,
  type Course,
  type CourseDetail,
  type CourseStatus,
} from "./course/use-course";

// Course owner (mutations)
export {
  useOwnerCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useRegisterCourse,
  useInvalidateOwnerCourses,
  ownerCourseKeys,
} from "./course/use-course-owner";

// Course modules
export {
  useCourseModules,
  useTeacherCourseModules,
  useCourseModule,
  useCourseModuleMap,
  useCreateCourseModule,
  useUpdateCourseModule,
  useUpdateCourseModuleStatus,
  useDeleteCourseModule,
  useRegisterCourseModule,
  courseModuleKeys,
  transformCourseModule,
  transformSLT,
  transformLesson,
  transformAssignment,
  transformIntroduction,
  type CourseModule,
  type CourseModuleStatus,
  type SLT,
  type Lesson,
  type Assignment,
  type Introduction,
  type CourseModuleSummary,
  type RegisterCourseModuleInput,
  type RegisteredModule,
} from "./course/use-course-module";

// Course content (public read-only queries for SLTs, Lessons, Assignments, Introductions)
export {
  useSLTs,
  useLessons,
  useLesson,
  useAssignment,
  useIntroduction,
  sltKeys,
  lessonKeys,
  assignmentKeys,
  introductionKeys,
} from "./course/use-course-content";

// Module draft save (aggregate-update endpoint)
export { useSaveModuleDraft } from "./course/use-save-module-draft";

// Course teacher (role-based)
export {
  useTeacherCourses,
  useTeacherAssignmentCommitments,
  useTeacherCommitmentsQueries,
  useTeacherCoursesWithModules,
  useInvalidateTeacherCourses,
  courseTeacherKeys,
  type TeacherCourse,
  type TeacherCourseStatus,
  type TeacherCoursesResponse,
  type TeacherAssignmentCommitment,
  type TeacherAssignmentCommitmentsResponse,
  type TeacherCourseWithModules,
} from "./course/use-course-teacher";

// Course student (role-based)
export {
  useStudentCourses,
  useInvalidateStudentCourses,
  courseStudentKeys,
  transformStudentCourse,
  type StudentCourse,
  type StudentCoursesResponse,
} from "./course/use-course-student";

// Student assignment commitments (cross-route status)
export {
  useStudentAssignmentCommitments,
  getModuleCommitmentStatus,
  fetchStudentCommitments,
  studentCommitmentsQueryKey,
  type StudentCommitmentSummary,
} from "./course/use-student-assignment-commitments";

// Student credentials (enrolled + completed courses, claimed credentials)
export {
  useStudentCredentials,
  studentCredentialKeys,
  hasClaimedModuleCredential,
  deriveModuleCompleted,
  type StudentCourseCredential,
  type CredentialModuleInfo,
} from "./course/use-student-credentials";

// Student completions for project prerequisites
export {
  useStudentCompletionsForPrereqs,
} from "./course/use-student-completions-for-prereqs";

// Module wizard (composite UI hook)
export { useModuleWizardData } from "./course/use-module-wizard-data";

// =============================================================================
// Project Hooks
// =============================================================================

// Core project (public queries + types)
export {
  useProject,
  useProjects,
  useInvalidateProjects,
  projectKeys,
  type Project,
  type ProjectStatus,
} from "./project/use-project";

// Project owner (role-based)
export {
  useOwnerProjects,
  useCreateProject,
  useUpdateProject,
  useRegisterProject,
  useInvalidateOwnerProjects,
  ownerProjectKeys,
} from "./project/use-project-owner";

// Project manager (role-based)
export {
  useManagerProjects,
  useManagerCommitments,
  useTaskBatchStatus,
  useInvalidateManagerProjects,
  projectManagerKeys,
  type ManagerProject,
  type ManagerProjectsResponse,
  type ManagerCommitment,
  type ManagerCommitmentsResponse,
  type TaskBatchStatusInput,
} from "./project/use-project-manager";

// Project contributor (role-based)
export {
  useContributorProjects,
  useContributorCommitments,
  useContributorCommitment,
  useSubmitTaskEvidence,
  useInvalidateContributorProjects,
  projectContributorKeys,
  type ContributorProject,
  type ContributorCommitment,
  type ContributorProjectsResponse,
  type SubmitTaskEvidenceInput,
} from "./project/use-project-contributor";

// =============================================================================
// User Hooks
// =============================================================================

export {
  useUpdateAccessTokenAlias,
  type UpdateAccessTokenAliasInput,
  type UpdateAccessTokenAliasResponse,
} from "./use-user";

// =============================================================================
// Dashboard Hooks
// =============================================================================

export {
  useDashboard,
  dashboardKeys,
  type Dashboard,
  type DashboardUser,
  type DashboardCounts,
  type DashboardStudent,
  type DashboardTeacher,
  type DashboardProjects,
  type DashboardCourseSummary,
  type DashboardCredentialSummary,
  type DashboardCommitmentSummary,
  type DashboardPendingReview,
  type DashboardPendingAssessment,
  type DashboardProjectSummary,
  type DashboardProjectWithPrereqs,
  type DashboardProjectPrerequisite,
} from "./use-dashboard";

// =============================================================================
// Image Upload Hooks
// =============================================================================

export {
  useImageUpload,
  type ImageUploadResult,
} from "./use-image-upload";
