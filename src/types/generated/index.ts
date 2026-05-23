/**
 * Type re-exports from generated gateway types
 *
 * This file provides clean type aliases and re-exports from the auto-generated
 * gateway types. All types come from code generation - no manual definitions.
 *
 * NOTE: As of API v2.1.0, type names have been cleaned up:
 * - Orchestration* prefix removed
 * - MergedHandlers* prefix removed
 * - AndamioApiInternal* prefix removed
 * - ApiTypes* prefix removed
 * - AuthViewmodels* prefix removed
 *
 * @see gateway.ts - Raw auto-generated types from OpenAPI spec
 */

// =============================================================================
// Course System Types (clean names from v2.1.0)
// =============================================================================

// Course types - using orchestration types for merged data
export type { MergedCourseDetail as CourseDetailResponse } from "./gateway";
export type { MergedCourseListItem as CourseListItem } from "./gateway";
export type { MergedCourseModuleItem as CourseModuleItem } from "./gateway";

// Type aliases for backward compatibility
import type { MergedCourseDetail, MergedCourseListItem } from "./gateway";

/** Course response type - maps to MergedCourseDetail */
export type CourseResponse = MergedCourseDetail;

/** Course list response type - array of MergedCourseListItem */
export type CourseListResponse = MergedCourseListItem[];

// =============================================================================
// Project System Types (app-level flattened types)
// =============================================================================

// Import and re-export app-level types with backward-compatible names
// These types are colocated with the project hooks (single source of truth)
export {
  type Task as ProjectTaskV2Output,
  // Use ProjectDetail for pages that need full data (states, contributors, tasks, etc.)
  type ProjectDetail as ProjectV2Output,
  type TaskCommitment as CommitmentV2Output,
  type TaskToken as ProjectTaskTokenOutput,
  type ProjectState as ProjectStateOutput,
  type TaskStatusValue,
  // Transform functions for use in hooks/libs
  transformApiTask,
  transformApiProject,
  transformApiCommitment,
  transformOnChainTask,
  transformProjectDetail,
  transformProjectListItem,
  transformMergedTask,
} from "~/hooks/api/project/use-project";

// Re-export the app types with clean names too
export type { Task, Project, ProjectDetail, TaskCommitment, TaskToken, ProjectState } from "~/hooks/api/project/use-project";

// =============================================================================
// Orchestration Types (clean names from v2.1.0)
// =============================================================================

export type {
  // Course types
  CourseModule,
  CourseContent,
  ModuleContent,
  MergedCourseDetail,
  MergedCourseListItem,
  MergedCourseModuleItem,
  StudentCourseListItem,
  StudentAssignmentCommitmentItem,
  AssignmentCommitmentContent,
  StudentCourseCredential,
  CredentialModuleInfo,

  // Project types
  MergedProjectDetail,
  MergedProjectListItem,
  MergedTaskListItem,
  ContributorProjectListItem,
  ManagerProjectListItem,
  ContributorCommitmentItem,
  ManagerCommitmentItem,
  ManagerCommitmentTaskInfo,
  ProjectTaskOnChain,
  ProjectContent,
  ProjectPrerequisite,
  ProjectContributorOnChain,
  ProjectSubmissionOnChain,
  ProjectAssessmentOnChain,
  ProjectTreasuryFundingOnChain,
  ProjectCredentialClaimOnChain,
  TaskCommitmentContent,
  TaskContent,
  MyCommitmentSummary,
  PendingAssessmentSummary,
} from "./gateway";

// =============================================================================
// Response Types (clean names from v2.1.0)
// =============================================================================

export type {
  // Course responses
  MergedCoursesResponse,
  MergedCourseDetailResponse,
  MergedCourseModulesResponse,
  StudentCoursesResponse,
  StudentAssignmentCommitmentResponse,
  StudentAssignmentCommitmentsResponse,
  GetStudentAssignmentCommitmentRequest,
  StudentCredentialsResponse,
  RegisterModuleResponse,

  // Project responses
  MergedProjectsResponse,
  MergedProjectDetailResponse,
  ContributorProjectsResponse,
  ManagerProjectsResponse,
  ContributorCommitmentResponse,
  ContributorCommitmentsResponse,
  ManagerCommitmentsResponse,
  MergedTasksResponse,
  GetContributorCommitmentRequest,
  ListManagerTasksRequest,
  ListTasksRequest,
  ErrorResponse,
} from "./gateway";

// =============================================================================
// TX Client Types (clean names from v2.1.0)
// =============================================================================

// Course transactions
export type { CreateCourseTxRequest } from "./gateway";
export type { ManageModulesTxRequest } from "./gateway";
export type { MintModuleV2 } from "./gateway";
export type { UpdateModuleV2 } from "./gateway";
export type { CommitAssignmentTxRequest } from "./gateway";
export type { AssignmentActionTxRequest } from "./gateway";
export type { AssessAssignmentsTxRequest } from "./gateway";
export type { ClaimCourseCredentialsTxRequest } from "./gateway";

// Project transactions
export type { CreateProjectTxRequest } from "./gateway";
export type { ManageTasksTxRequest } from "./gateway";
export type { TaskData } from "./gateway";
export type { CommitTaskTxRequest } from "./gateway";
export type { TaskActionTxRequest } from "./gateway";
export type { TasksAssessV2TxRequest } from "./gateway";
export type { ClaimProjectCredentialsTxRequest } from "./gateway";
export type { ProjectOutcome } from "./gateway";

// Global transactions
export type { MintAccessTokenTxRequest } from "./gateway";

// Response types
export type { UnsignedTxResponse } from "./gateway";
export type { UnsignedTxResponseInitCourse } from "./gateway";
export type { UnsignedTxResponseInitProject } from "./gateway";

// =============================================================================
// Request Types (clean names from v2.1.0)
// =============================================================================

// Project requests
export type {
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateTaskCommitmentRequest,
  UpdateTaskCommitmentRequest,
} from "./gateway";

// =============================================================================
// Auth Types (clean names from v2.1.0)
// =============================================================================

export type {
  // Developer registration (two-step flow)
  RegisterSessionRequest,
  RegisterSessionResponse,
  RegisterCompleteRequest,
  RegisterResponse,
  SignatureData,

  // Developer login
  LoginRequest,
  LoginResponse,
  JWTResponse,
} from "./gateway";

// =============================================================================
// API Key Types (clean names from v2.1.0)
// =============================================================================

export type {
  APIKeyRequest,
  APIKeyResponse,
  DeleteAPIKeyRequest,
  DeleteAPIKeyResponse,
  RotateAPIKeyRequest,
  RotateAPIKeyResponse,
} from "./gateway";

// =============================================================================
// Developer Auth Types (CIP-30 secure login + refresh tokens, v2.3)
// =============================================================================

export type {
  LoginCompleteRequest,
  LoginSessionRequest,
  LoginSessionResponse,
  RefreshRequest,
  RefreshTokenData,
  SecureLoginResponse,
} from "./gateway";

// Developer profile type (returned from /v2/apikey/developer/profile/get)
export type { MeResponse as DeveloperProfileResponse } from "./gateway";

// Developer usage type (returned from /v2/apikey/developer/usage/get)
export type { UsageResponse as DeveloperUsageResponse } from "./gateway";

// =============================================================================
// Billing Types (Stripe subscription billing)
// =============================================================================

export type {
  BillingStatusResponse,
  BillingStatusResponseEnvelope,
  CheckoutRequest,
  CheckoutResponse,
  CheckoutResponseEnvelope,
  PortalResponse,
  PortalResponseEnvelope,
  SubscriptionStatus,
} from "./gateway";

// =============================================================================
// Dashboard Types (clean names from v2.1.0)
// =============================================================================

export type {
  DashboardResponse,
  DashboardResponseWrapper,
  DashboardCounts,
  DashboardUser,
  StudentDashboard,
  TeacherDashboard,
  ProjectsDashboard,
  DashboardCourseSummary,
  DashboardCredentialSummary,
  DashboardCommitmentSummary,
  DashboardPendingReviewSummary,
  DashboardPendingAssessmentSummary,
  DashboardProjectSummary,
  DashboardProjectWithPrereqs,
} from "./gateway";

// =============================================================================
// Custom Types (not in API spec)
// =============================================================================

/**
 * Valid gateway transaction type strings
 * These are the values the gateway expects for tx_type in transaction registration
 *
 * @see TX_TYPE_MAP in ~/hooks/use-tx-watcher.ts for frontend-to-gateway mapping
 */
export type GatewayTxType =
  | "access_token_mint"
  | "course_create"
  | "teachers_update"
  | "modules_manage"
  | "assignment_submit"
  | "assessment_assess"
  | "credential_claim"
  | "project_create"
  | "project_join"
  | "managers_manage"
  | "blacklist_update"
  | "tasks_manage"
  | "task_submit"
  | "task_assess"
  | "project_credential_claim"
  | "treasury_fund";
