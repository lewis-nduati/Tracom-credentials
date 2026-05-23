/* eslint-disable */
/* tslint:disable */
// TypeScript checking enabled - API types are compile-time safe
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum ReviewAssignmentCommitmentV2RequestDecision {
  ReviewAssignmentCommitmentV2RequestDecisionAccept = "accept",
  ReviewAssignmentCommitmentV2RequestDecisionRefuse = "refuse",
}

export enum CourseModuleV2ModuleStatus {
  CourseModuleV2ModuleStatusAPPROVED = "APPROVED",
  CourseModuleV2ModuleStatusARCHIVED = "ARCHIVED",
  CourseModuleV2ModuleStatusDEPRECATED = "DEPRECATED",
  CourseModuleV2ModuleStatusDRAFT = "DRAFT",
  CourseModuleV2ModuleStatusONCHAIN = "ON_CHAIN",
  CourseModuleV2ModuleStatusPENDINGTX = "PENDING_TX",
}

export enum AggregateUpdateModuleV2RequestStatus {
  AggregateUpdateModuleV2RequestStatusAPPROVED = "APPROVED",
}

export enum AggregateUpdateErrorResponseFailedOperationOperation {
  Approve = "approve",
  Create = "create",
  Delete = "delete",
  Update = "update",
}

export enum AggregateUpdateErrorResponseFailedOperationEntity {
  Assignment = "assignment",
  Introduction = "introduction",
  Lesson = "lesson",
  Module = "module",
  Slt = "slt",
}

export enum AggregateUpdateErrorResponseCode {
  BADREQUEST = "BAD_REQUEST",
  DUPLICATELESSONSLTINDEX = "DUPLICATE_LESSON_SLT_INDEX",
  DUPLICATESLTINDEX = "DUPLICATE_SLT_INDEX",
  INVALIDSLTHASH = "INVALID_SLT_HASH",
  INVALIDSLTINDEX = "INVALID_SLT_INDEX",
  MODULENOTFOUND = "MODULE_NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
}

export interface APIKeyRequest {
  /**
   * @minLength 3
   * @maxLength 64
   * @example "MyFirstKey"
   */
  api_key_name: string;
  /**
   * @min 1
   * @example 365
   */
  expires_in_days?: number;
}

export interface APIKeyResponse {
  /** @example "ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" */
  api_key: string;
  /** @example "2025-08-31T23:59:59Z" */
  created_at: string;
  /** @example "2026-08-31T23:59:59Z" */
  expires_at: string;
  /** @example 365 */
  expires_in_days: number;
  /** @example true */
  is_active: boolean;
  /** @example "MyFirstKey" */
  name: string;
}

export interface APIUsage {
  /** @example "MyFirstKey" */
  api_key_name?: string;
  /** @example "v1" */
  api_version?: string;
  /** @example "API_KEY" */
  authentication_method?: string;
  /** @example false */
  cache_hit?: boolean;
  /** @example "2023-01-01T12:34:56Z" */
  created_at?: string;
  /** @example 1024 */
  data_transfer_in_bytes?: number;
  /** @example 2048 */
  data_transfer_out_bytes?: number;
  /** @example "/v1/data" */
  endpoint?: string;
  /** @example 0 */
  error_count?: number;
  /** @example "GET" */
  http_method?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  id?: string;
  /** @example "192.168.1.1" */
  ip_address?: string;
  /** @example 20 */
  latency_to_db_ms?: number;
  /** @example false */
  quota_exceeded?: boolean;
  /** @example "minute" */
  rate_limit_type?: string;
  /** @example false */
  rate_limited?: boolean;
  /** @example 999 */
  remaining_quota?: number;
  /** @example 99 */
  remaining_rate_limit?: number;
  /** @example 100 */
  request_body_size_bytes?: number;
  /** @example 1 */
  request_count?: number;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  request_id?: string;
  /** @example 500 */
  response_body_size_bytes?: number;
  /** @example 150 */
  response_time_ms?: number;
  /** @example 200 */
  status_code?: number;
  /** @example 1 */
  tier_id?: number;
  /** @example "Free" */
  tier_name?: string;
  /** @example "2023-01-01T12:34:56Z" */
  timestamp?: string;
  /** @example "2023-01-01T12:34:56Z" */
  updated_at?: string;
  /** @example "Mozilla/5.0" */
  user_agent?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  user_id?: string;
}

export interface APIUsageMetric {
  /** @example "MyFirstKey" */
  api_key_name?: string;
  usage_metrics?: APIUsage[];
}

export interface AddFundsTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /** List of (asset class, quantity) pairs. An asset class is either "lovelace" or a token with its minting policy and token name delimited by dot (.). */
  deposit_value?: any[][];
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  project_id?: string;
}

export interface AddTeachersV2Request {
  aliases?: string[];
  course_id?: string;
}

export interface AggregateAssignmentInput {
  content_json?: Record<string, any>;
  description?: string;
  image_url?: string;
  title?: string;
  video_url?: string;
}

export interface AggregateChangeSummary {
  assignment_created?: boolean;
  assignment_deleted?: boolean;
  assignment_updated?: boolean;
  introduction_created?: boolean;
  introduction_deleted?: boolean;
  introduction_updated?: boolean;
  lessons_created?: number;
  lessons_deleted?: number;
  lessons_updated?: number;
  module_updated?: boolean;
  slts_created?: number;
  slts_deleted?: number;
  slts_reordered?: boolean;
  /** SltsSkipped True when SLTs were present in the request but module is not DRAFT */
  slts_skipped?: boolean;
  slts_updated?: number;
  /** StatusChanged True if DRAFT → APPROVED */
  status_changed?: boolean;
}

export interface AggregateIntroductionInput {
  content_json?: Record<string, any>;
  description?: string;
  title?: string;
}

export interface AggregateLessonInput {
  content_json?: Record<string, any>;
  description?: string;
  image_url?: string;
  /** SltIndex 1-based SLT index this lesson belongs to */
  slt_index?: number;
  title?: string;
  video_url?: string;
}

export interface AggregateSltInput {
  /** SltIndex 1-based index. If provided: update existing. If omitted: create new. */
  slt_index?: number;
  /** SltText The SLT text content */
  slt_text?: string;
}

export interface AggregateUpdateErrorResponse {
  code?: AggregateUpdateErrorResponseCode;
  error?: string;
  failed_operation?: {
    entity?: AggregateUpdateErrorResponseFailedOperationEntity;
    entity_id?: number;
    operation?: AggregateUpdateErrorResponseFailedOperationOperation;
    reason?: string;
  };
  message?: string;
}

export interface AggregateUpdateModuleV2Request {
  assignment?: AggregateAssignmentInput;
  course_id?: string;
  course_module_code?: string;
  /** DeleteAssignment Set to true to delete the assignment */
  delete_assignment?: boolean;
  /** DeleteIntroduction Set to true to delete the introduction */
  delete_introduction?: boolean;
  /** Description Module description (only send if changed) */
  description?: string;
  /** ImageUrl Module image URL (only send if changed) */
  image_url?: string;
  introduction?: AggregateIntroductionInput;
  /** Lessons Flat array of lessons keyed by slt_index. Server diffs against current state. Editable in any status. */
  lessons?: AggregateLessonInput[];
  /** SltHash Required when status = 'APPROVED'. Hash of the SLT list. */
  slt_hash?: string;
  /** Slts Full ordered list of SLTs. Server diffs against current state. ONLY allowed when status is DRAFT. */
  slts?: AggregateSltInput[];
  /** Status Set to 'APPROVED' to approve a DRAFT module */
  status?: AggregateUpdateModuleV2RequestStatus;
  /** Title Module title (only send if changed) */
  title?: string;
  /** VideoUrl Module video URL (only send if changed) */
  video_url?: string;
}

export interface AggregateUpdateModuleV2Response {
  /** Changes Summary of what changed in the aggregate update */
  changes?: AggregateChangeSummary;
  /** Data Course Module V2 with full content */
  data?: CourseModuleV2;
}

export interface AliasExistsResponse {
  alias?: string;
  exists?: boolean;
}

export interface AnyUserDailyApiUsageRequest {
  /** @example "2023-01-31" */
  end_date: string;
  /** @example "2023-01-01" */
  start_date: string;
  /**
   * @maxItems 64
   * @minItems 1
   */
  user_infos?: UserInfo[];
}

export interface AnyUserDailyApiUsageResponse {
  /** A list of usage data, aggregated by user. */
  users_usages?: UserUsage[];
}

export interface AssessAssignmentsTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  assignment_decisions?: AssignmentOutcome[];
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  course_id?: string;
  /** Sponsored path (Path A) — API caller needs to handle sponsorship tank. */
  sponsor_data?: SponsorData;
}

export interface Asset {
  /** @example "1000000" */
  amount?: string;
  /** @example "AndamioToken" */
  name?: string;
  /** @example "abc123def456" */
  policy_id?: string;
}

export interface AssignmentActionTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /** A text string with a maximum length of 140 characters. */
  assignment_info?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  course_id?: string;
  /** Sponsored path (Path A) — API caller needs to handle sponsorship tank. */
  sponsor_data?: SponsorData;
}

export interface AssignmentCommitment {
  /** @example "submitted" */
  assignment_commitment_status?: string;
  assignment_evidence_hash?: string;
  content?: AssignmentSubmissionInput;
  course_id: string;
  created_at?: string;
  slt_hash: string;
  student_address: string;
  updated_at?: string;
}

export interface AssignmentCommitmentContent {
  /** "accept" or "refuse" */
  assessment_outcome?: string;
  /** Hash for on-chain verification */
  assignment_evidence_hash?: string;
  /** DRAFT, SUBMITTED, APPROVED, etc. */
  commitment_status?: string;
  /** JSON evidence data */
  evidence?: any;
}

export interface AssignmentOutcome {
  /**
   * Plain text alias. Any characters allowed.
   * @example "JohnDoe"
   */
  alias?: string;
  /** enum: accept,refuse */
  outcome?: "accept" | "refuse";
}

export interface AssignmentSubmissionInput {
  feedback?: string;
  notes?: string;
  submission_url?: string;
}

export interface AssignmentV2 {
  /** ContentJson Tiptap JSON content */
  content_json?: Record<string, any>;
  created_by_alias?: string;
  description?: string;
  image_url?: string;
  is_live?: boolean;
  title?: string;
  video_url?: string;
}

export interface BadGatewayErrorResponse {
  details?: string;
  /** @example "Bad Gateway: The upstream server returned an invalid response." */
  message: string;
  /** @example 502 */
  status_code: number;
}

export interface BadRequestErrorResponse {
  details?: string;
  /** @example "Bad Request: Invalid input." */
  message: string;
  /** @example 400 */
  status_code: number;
}

export interface BadRequestResponse {
  details?: string;
  /** @example "Bad Request: Invalid input." */
  message: string;
  /** @example 400 */
  status_code: number;
}

export interface BillingStatusResponse {
  api?: SubscriptionStatus;
  platform?: SubscriptionStatus;
}

/** Standard API response envelope for billing status */
export interface BillingStatusResponseEnvelope {
  data: BillingStatusResponse;
}

export interface CheckoutRequest {
  /** @example "api" */
  product: "api";
  /** @example "starter" */
  tier: string;
}

export interface CheckoutResponse {
  /** @example "https://checkout.stripe.com/c/pay/cs_xxx" */
  url: string;
}

/** Standard API response envelope for checkout session */
export interface CheckoutResponseEnvelope {
  data: CheckoutResponse;
}

export interface ClaimCourseCredentialsTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  course_id?: string;
  /** Sponsored path (Path A) — API caller needs to handle sponsorship tank. */
  sponsor_data?: SponsorData;
}

export interface ClaimCredentialV2Request {
  course_id?: string;
  course_module_code?: string;
  pending_tx_hash?: string;
}

export interface ClaimProjectCredentialsTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  contributor_state_id?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  project_id?: string;
}

export interface ClaimV2AccessTokenTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @example "JohnDoe"
   */
  alias?: string;
}

export interface CleanerStatsView {
  candidates?: number;
  deleted?: number;
  dry_run?: boolean;
  errored?: number;
  operation_id?: string;
  skipped?: number;
}

export interface CommitAssignmentTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /** A text string with a maximum length of 140 characters. */
  assignment_info?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  course_id?: string;
  /**
   * Hex-encoded hash of the task SLT (exactly 64 characters).
   * @example "a1b2c3d4e5f6..."
   */
  slt_hash?: string;
  /** Sponsored path (Path A) — API caller needs to handle sponsorship tank. */
  sponsor_data?: SponsorData;
}

export interface CommitTaskTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  contributor_state_id?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  project_id?: string;
  /**
   * Hex-encoded hash of the task SLT (exactly 64 characters).
   * @example "a1b2c3d4e5f6..."
   */
  task_hash?: string;
  /** A text string with a maximum length of 140 characters. */
  task_info?: string;
}

/** Request to complete verification with a CIP-30 wallet signature. */
export interface CompleteVerificationRequest {
  /**
   * SessionID is the verification session ID from the /session endpoint.
   * 	@example	550e8400-e29b-41d4-a716-446655440000
   */
  session_id: string;
  /** Signature contains the CIP-30 signature data from the wallet. */
  signature: SignatureData;
}

/** Response containing the attestation JWT upon successful verification. */
export interface CompleteVerificationResponse {
  /**
   * Alias is the Access Token alias that was verified.
   * 	@example	alice
   */
  alias?: string;
  /**
   * AttestationJWT is a signed JWT attesting to the wallet's ownership of the Access Token.
   * This JWT can be verified offline using the public key from /.well-known/jwks.json.
   * 	@example	eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
   */
  attestation_jwt?: string;
  /**
   * Verified indicates whether the verification was successful.
   * 	@example	true
   */
  verified?: boolean;
  /**
   * WalletAddress is the bech32 wallet address extracted from the signature.
   * 	@example	addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp
   */
  wallet_address?: string;
}

export interface ConflictErrorResponse {
  details?: string;
  /** @example "Conflict" */
  message: string;
  /** @example 409 */
  status_code: number;
}

export interface ContributorCommitmentItem {
  /** Off-chain content (nested) */
  content?: TaskCommitmentContent;
  /** Hex-encoded */
  on_chain_content?: string;
  /** On-chain status */
  on_chain_status: string;
  project_id: string;
  /** Data source indicator */
  source: string;
  submission_tx?: string;
  /** Identifiers */
  task_hash: string;
}

export interface ContributorCommitmentResponse {
  data: ContributorCommitmentItem;
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface ContributorCommitmentsResponse {
  data: ContributorCommitmentItem[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface ContributorProjectListItem {
  /** Off-chain content (nested) */
  content?: ProjectContent;
  contributor_state_id?: string;
  created_at?: string;
  created_slot?: number;
  created_tx?: string;
  managers?: string[];
  /** Contributor's own commitments */
  my_commitments?: MyCommitmentSummary[];
  owner?: string;
  prerequisites?: ProjectPrerequisite[];
  project_address?: string;
  /** On-chain fields (top level) */
  project_id: string;
  /** Data source indicator */
  source: string;
  treasury_address?: string;
}

export interface ContributorProjectsResponse {
  data: ContributorProjectListItem[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface Course {
  content?: CourseContentInput;
  course_address?: string;
  /** @example "policy_abc123" */
  course_id: string;
  created_slot?: number;
  created_tx?: string;
  /** @example "addr1_owner" */
  owner?: string;
  /** @example "chain+db" */
  source: string;
  student_state_id?: string;
  teachers?: string[];
}

export interface CourseContent {
  description?: string;
  image_url?: string;
  is_public?: boolean;
  title?: string;
}

export interface CourseContentInput {
  category?: string;
  /** @example "Learn blockchain basics" */
  description?: string;
  /** @example "https://example.com/image.png" */
  image_url?: string;
  /** @example true */
  is_public?: boolean;
  /** @example "Introduction to Cardano" */
  title: string;
  video_url?: string;
}

export interface CourseModule {
  created_by?: string;
  prerequisites?: string[];
  slt_hash: string;
  slts?: string[];
}

export interface CourseModuleEntity {
  course_id: string;
  course_module_code?: string;
  created_at?: string;
  description?: string;
  image_url?: string;
  is_live?: boolean;
  module_status?: string;
  slt_hash: string;
  sort_order?: number;
  title?: string;
  updated_at?: string;
  video_url?: string;
}

export interface CourseModuleV2 {
  /** Assignment Assignment V2 (one-to-one with module) */
  assignment?: AssignmentV2;
  course_module_code?: string;
  created_by_alias?: string;
  description?: string;
  image_url?: string;
  introduction?: IntroductionV2;
  is_live?: boolean;
  module_status?: CourseModuleV2ModuleStatus;
  /** SltHash Hash of SLT list, used as module token name on-chain */
  slt_hash?: string;
  slts?: SltV2[];
  title?: string;
  video_url?: string;
}

export interface CreateAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
}

export interface CreateCourseRequest {
  content?: CourseContentInput;
  /** @example "policy_abc123" */
  course_id: string;
}

export interface CreateCourseTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /** Sponsored path (Path A) — API caller needs to handle sponsorship tank. */
  sponsor_data?: SponsorData;
  teachers?: string[];
}

export interface CreateKeyRequest {
  environment: "mainnet" | "preprod";
  /**
   * @minLength 3
   * @maxLength 64
   */
  name: string;
}

export interface CreateKeyResponse {
  created_at?: string;
  environment?: string;
  id?: string;
  key?: string;
  last4?: string;
  name?: string;
}

export interface CreateModuleRequest {
  content?: ModuleContentInput;
}

export interface CreateProjectRequest {
  content?: ProjectContentInput;
  /** @example "policy_xyz789" */
  project_id: string;
}

export interface CreateProjectTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  course_prereqs?: any[][];
  managers?: string[];
}

export interface CreateTaskCommitmentRequest {
  evidence?: Record<string, any>;
  /** @example "hash_abc123" */
  task_hash: string;
}

export interface CreateTaskRequest {
  /** @example "Build a responsive login page" */
  content?: string;
  content_json?: Record<string, any>;
  /** @example "policy_xyz789" */
  contributor_state_id: string;
  /** @example "1735689600000" */
  expiration_time: string;
  /** @example "5000000" */
  lovelace_amount: string;
  /** @example "Build login page" */
  title: string;
  tokens?: CreateTaskToken[];
}

export interface CreateTaskToken {
  /** @example "MyToken" */
  asset_name: string;
  /** @example "abc123def456" */
  policy_id: string;
  /** @example "100" */
  quantity: string;
}

export interface CredentialModuleInfo {
  course_module_code?: string;
  slt_hash?: string;
  title?: string;
}

export interface DashboardCommitmentSummary {
  course_id?: string;
  slt_hash?: string;
  status: string;
}

export interface DashboardCounts {
  completed_courses?: number;
  contributing_projects?: number;
  enrolled_courses?: number;
  managing_projects?: number;
  pending_project_assessments?: number;
  pending_reviews?: number;
  teaching_courses?: number;
  total_credentials?: number;
}

export interface DashboardCourseSummary {
  course_id: string;
  description?: string;
  image_url?: string;
  title?: string;
}

export interface DashboardCredentialSummary {
  course_id: string;
  course_title?: string;
  credentials?: string[];
}

export interface DashboardPendingAssessmentSummary {
  count?: number;
  project_id: string;
  project_title?: string;
}

export interface DashboardPendingReviewSummary {
  count?: number;
  course_id: string;
  course_title?: string;
}

export interface DashboardProjectPrerequisite {
  course_id?: string;
  slt_hashes?: string[];
}

export interface DashboardProjectSummary {
  description?: string;
  image_url?: string;
  project_id: string;
  title?: string;
}

export interface DashboardProjectWithPrereqs {
  image_url?: string;
  prerequisites?: DashboardProjectPrerequisite[];
  project_id: string;
  /** true if user has all required credentials */
  qualified?: boolean;
  title?: string;
}

export interface DashboardResponse {
  counts?: DashboardCounts;
  projects?: ProjectsDashboard;
  student?: StudentDashboard;
  teacher?: TeacherDashboard;
  user?: DashboardUser;
}

export interface DashboardResponseWrapper {
  data: DashboardResponse;
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface DashboardUser {
  alias: string;
  wallet_address?: string;
}

export interface DeleteAPIKeyRequest {
  /**
   * @minLength 3
   * @maxLength 64
   * @example "MyFirstKey"
   */
  api_key_name: string;
}

export interface DeleteAPIKeyResponse {
  /** @example "API key deleted successfully" */
  confirmation: string;
}

export interface DeleteModuleV2Request {
  course_id?: string;
  course_module_code?: string;
}

export interface DeleteTaskRequest {
  /** @example "policy_xyz789" */
  contributor_state_id: string;
  /** @example 0 */
  index: number;
}

export interface DeleteUserRequest {
  /**
   * @minLength 3
   * @maxLength 50
   * @example "johndoe"
   */
  alias: string;
}

export interface DeleteUserResponse {
  /** @example "User deleted successfully." */
  message?: string;
}

export interface EmailVerificationStatusResponse {
  /** @example true */
  can_resend?: boolean;
  /** @example false */
  email_verified?: boolean;
  /** @example 4 */
  remaining_attempts?: number;
  /** @example "2026-02-09T14:30:00Z" */
  verification_email_sent_at?: string;
  /** @example 0 */
  wait_duration_seconds?: number;
}

/** Error details with code, message, and optional debug info */
export interface ErrorDetail {
  /** @example "BAD_REQUEST" */
  code: string;
  /** @example "Field 'email' is required" */
  details?: string;
  /** @example "Invalid input provided" */
  message: string;
}

/** Standard error response envelope */
export interface ErrorEnvelope {
  /** Error details with code, message, and optional debug info */
  error: ErrorDetail;
}

/** Standard error response envelope */
export interface ErrorResponse {
  /** Error details with code, message, and optional debug info */
  error: ErrorDetail;
}

export interface FederatedCleanupCandidate {
  created_at?: string;
  user_id?: string;
  wallet_address?: string;
}

export interface ForbiddenErrorResponse {
  details?: string;
  /** @example "Forbidden: Insufficient permissions or tier access." */
  message: string;
  /** @example 403 */
  status_code: number;
}

export interface GetContributorCommitmentRequest {
  project_id?: string;
  task_hash?: string;
}

export interface GetStudentAssignmentCommitmentRequest {
  course_id?: string;
  /** Human-readable code (e.g., "101") - used for DB lookup */
  course_module_code?: string;
  /** On-chain hash - required for on-chain lookup */
  slt_hash?: string;
}

export interface GoneErrorResponse {
  details?: string;
  /** @example "Gone - The requested resource is no longer available." */
  message: string;
  /** @example 410 */
  status_code: number;
}

export interface InitRolesResponse {
  courses?: Course[];
  projects?: Project[];
}

export interface InternalServerErrorResponse {
  details?: string;
  /** @example "Internal Server Error: An unexpected error occurred." */
  message: string;
  /** @example 500 */
  status_code: number;
}

export interface IntroductionV2 {
  /** ContentJson Tiptap JSON content */
  content_json?: Record<string, any>;
  created_by_alias?: string;
  description?: string;
  image_url?: string;
  is_live?: boolean;
  title?: string;
  video_url?: string;
}

/** A single JSON Web Key (JWK) as defined in RFC 7517. */
export interface JWK {
  /**
   * Alg is the algorithm intended for use with the key
   * @example "RS256"
   */
  alg?: string;
  /**
   * E is the RSA exponent (base64url-encoded)
   * @example "AQAB"
   */
  e?: string;
  /**
   * Kid is a key identifier used to match a specific key
   * @example "andamio-api-attestation-key"
   */
  kid?: string;
  /**
   * Kty is the key type (always "RSA" for our keys)
   * @example "RSA"
   */
  kty?: string;
  /**
   * N is the RSA modulus (base64url-encoded)
   * @example "0vx7agoebGcQ..."
   */
  n?: string;
  /**
   * Use indicates the intended use of the key ("sig" for signature verification)
   * @example "sig"
   */
  use?: string;
}

/** JSON Web Key Set containing public keys for JWT verification. */
export interface JWKSResponse {
  keys?: JWK[];
}

export interface JWTResponse {
  /** @example "2025-09-01T23:59:59Z" */
  expires_at: string;
  /** @example "eyJhbGci..." */
  token: string;
}

export interface KeyListItem {
  created_at?: string;
  environment?: string;
  id?: string;
  last4?: string;
  name?: string;
}

export interface LeaveAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
  pending_tx_hash?: string;
}

export interface LessonV2 {
  /** ContentJson Tiptap JSON content */
  content_json?: Record<string, any>;
  created_by_alias?: string;
  description?: string;
  image_url?: string;
  is_live?: boolean;
  title?: string;
  video_url?: string;
}

export interface ListKeysKeyMetadata {
  created_at?: string;
  expires_at?: string;
  is_active?: boolean;
  key_id?: string;
  name?: string;
  prefix?: string;
  source?: string;
}

export interface ListKeysResponse {
  keys?: KeyListItem[];
}

export interface ListManagerTasksRequest {
  project_id?: string;
}

export interface ListProjectCommitmentsRequest {
  project_id?: string;
}

export interface ListStudentAssignmentCommitmentsRequest {
  course_id?: string;
}

export interface ListTasksRequest {
  project_id?: string;
}

export interface ListTeacherAssignmentCommitmentsRequest {
  course_id?: string;
}

export interface ListTeacherCourseModulesRequest {
  course_id?: string;
}

export interface LoginCompleteRequest {
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  session_id: string;
  /** CIP-30 signature data from a Cardano wallet, containing the COSE_Sign1 signature and COSE_Key. */
  signature: SignatureData;
}

export interface LoginRequest {
  /**
   * @minLength 1
   * @maxLength 32
   * @example "johndoe"
   */
  alias: string;
  /**
   * @minLength 103
   * @maxLength 108
   * @example "addr1q..."
   */
  wallet_address: string;
}

export interface LoginResponse {
  /** @example "johndoe" */
  alias: string;
  jwt: JWTResponse;
  /** @example "Free" */
  tier: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  user_id: string;
}

export interface LoginSession {
  /** @example "2025-01-24T12:00:00Z" */
  expires_at: string;
  /** @example "session-123" */
  id: string;
  /** @example "abc123xyz" */
  nonce: string;
}

export interface LoginSessionRequest {
  /**
   * @minLength 1
   * @maxLength 32
   * @example "johndoe"
   */
  alias: string;
  /**
   * @minLength 103
   * @maxLength 108
   * @example "addr1q..."
   */
  wallet_address: string;
}

export interface LoginSessionResponse {
  /** @example "2026-05-05T12:35:00Z" */
  expires_at?: string;
  /** @example "Sign this message to login to Andamio: abc123..." */
  nonce?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  session_id?: string;
}

export interface ManageContributorBlacklistTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  aliases_to_add?: string[];
  aliases_to_remove?: string[];
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  project_id?: string;
}

export interface ManageManagersTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  managers_to_add?: string[];
  managers_to_remove?: string[];
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  project_id?: string;
}

export interface ManageModulesTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  course_id?: string;
  modules_to_add?: MintModuleV2[];
  modules_to_remove?: string[];
  modules_to_update?: UpdateModuleV2[];
  /** Sponsored path (Path A) — API caller needs to handle sponsorship tank. */
  sponsor_data?: SponsorData;
}

export interface ManageTasksTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  contributor_state_id?: string;
  /** List of (asset class, quantity) pairs. An asset class is either "lovelace" or a token with its minting policy and token name delimited by dot (.). */
  deposit_value?: any[][];
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  project_id?: string;
  tasks_to_add?: TaskData[];
  tasks_to_remove?: TaskData[];
}

export interface ManageTeachersTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  course_id?: string;
  /** Sponsored path (Path A) — API caller needs to handle sponsorship tank. */
  sponsor_data?: SponsorData;
  teachers_to_add?: string[];
  teachers_to_remove?: string[];
}

export interface ManagerCommitmentItem {
  /** Off-chain content (nested) - contributor's evidence */
  content?: TaskCommitmentContent;
  /** Hex-encoded */
  on_chain_content?: string;
  /** Identifiers */
  project_id: string;
  /** Data source indicator */
  source: string;
  /** On-chain submission info */
  submission_tx?: string;
  submitted_by: string;
  /** Task context */
  task?: ManagerCommitmentTaskInfo;
  task_hash: string;
}

export interface ManagerCommitmentTaskInfo {
  assets?: Asset[];
  expiration?: string;
  expiration_posix?: number;
  lovelace_amount?: number;
  on_chain_content?: string;
}

export interface ManagerCommitmentsResponse {
  data: ManagerCommitmentItem[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface ManagerProjectListItem {
  /** Off-chain content (nested) */
  content?: ProjectContent;
  contributor_state_id?: string;
  created_at?: string;
  created_slot?: number;
  created_tx?: string;
  managers?: string[];
  owner?: string;
  /** Pending assessments for this manager */
  pending_assessments?: PendingAssessmentSummary[];
  prerequisites?: ProjectPrerequisite[];
  project_address?: string;
  /** On-chain fields (top level) */
  project_id: string;
  /** Data source indicator */
  source: string;
  treasury_address?: string;
}

export interface ManagerProjectsResponse {
  data: ManagerProjectListItem[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface MeResponse {
  active_keys?: APIKeyResponse[];
  /** @example "johndoe" */
  alias: string;
  /** @example "2025-08-31T23:59:59Z" */
  created_at: string;
  /** @example "Free" */
  tier: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  user_id: string;
}

/** Standard API response envelope for user profile */
export interface MeResponseEnvelope {
  data: MeResponse;
}

export interface MergedAssignmentContent {
  /** Tiptap JSON content */
  content_json?: Record<string, any>;
  description?: string;
  image_url?: string;
  title?: string;
  video_url?: string;
}

export interface MergedAssignmentResponse {
  /** Off-chain content (from DB API) */
  content?: MergedAssignmentContent;
  /** Course and module context */
  course_id: string;
  course_module_code: string;
  /** On-chain fields */
  created_by?: string;
  slt_hash?: string;
  /** Data source indicator */
  source: string;
}

export interface MergedAssignmentResponseWrapper {
  data: MergedAssignmentResponse;
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface MergedCourseDetail {
  /** Off-chain content (nested) */
  content?: CourseContent;
  course_address?: string;
  /** On-chain fields (top level) */
  course_id: string;
  modules?: CourseModule[];
  /** WORKAROUND: fetched via extra API call until Andamioscan#15 is resolved */
  owner?: string;
  past_students?: string[];
  /** Data source indicator */
  source: string;
  student_state_id?: string;
  students?: string[];
  teachers?: string[];
}

export interface MergedCourseDetailResponse {
  data: MergedCourseDetail;
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface MergedCourseListItem {
  /** Off-chain content (nested) */
  content?: CourseContent;
  course_address?: string;
  /** On-chain fields (top level) */
  course_id: string;
  created_slot?: number;
  created_tx?: string;
  owner?: string;
  /** Data source indicator */
  source: string;
  student_state_id?: string;
  teachers?: string[];
}

export interface MergedCourseModuleItem {
  /** Off-chain content (from DB API) */
  content?: ModuleContent;
  /** Course context */
  course_id: string;
  /** On-chain fields (from Andamioscan) */
  created_by?: string;
  /** SLT hashes from chain */
  on_chain_slts?: string[];
  /** On-chain prerequisite module hashes */
  prerequisites?: string[];
  /**
   * Primary identifier - matches on-chain slts_hash and DB slt_hash.
   * Empty string for db_only drafts without SLTs computed yet.
   */
  slt_hash?: string;
  /** Data source indicator */
  source: string;
}

export interface MergedCourseModulesPublicResponse {
  data: PublicCourseModuleItem[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface MergedCourseModulesResponse {
  data: MergedCourseModuleItem[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface MergedCoursesResponse {
  data: MergedCourseListItem[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface MergedIntroductionContent {
  /** Tiptap JSON content */
  content_json?: Record<string, any>;
  description?: string;
  image_url?: string;
  title?: string;
  video_url?: string;
}

export interface MergedIntroductionResponse {
  content?: MergedIntroductionContent;
  course_id: string;
  course_module_code: string;
  created_by?: string;
  slt_hash?: string;
  /** "merged", "chain_only" */
  source: string;
}

export interface MergedIntroductionResponseWrapper {
  data: MergedIntroductionResponse;
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface MergedLessonContent {
  /** Tiptap JSON content */
  content_json?: Record<string, any>;
  description?: string;
  image_url?: string;
  title?: string;
  video_url?: string;
}

export interface MergedLessonResponse {
  content?: MergedLessonContent;
  course_id: string;
  course_module_code: string;
  created_by?: string;
  slt_hash?: string;
  slt_index: number;
  slt_text?: string;
  /** "merged", "chain_only" */
  source: string;
}

export interface MergedLessonResponseWrapper {
  data: MergedLessonResponse;
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface MergedProjectDetail {
  assessments?: ProjectAssessmentOnChain[];
  /** Off-chain content (nested) */
  content?: ProjectContent;
  contributor_state_id?: string;
  contributors?: ProjectContributorOnChain[];
  credential_claims?: ProjectCredentialClaimOnChain[];
  managers?: string[];
  owner?: string;
  prerequisites?: ProjectPrerequisite[];
  /** On-chain fields (top level) */
  project_id: string;
  /** Data source indicator */
  source: string;
  submissions?: ProjectSubmissionOnChain[];
  tasks?: ProjectTaskOnChain[];
  treasury_address?: string;
  /** Aggregated native asset balances across all fundings */
  treasury_assets?: Asset[];
  /** Spendable lovelace (total fundings minus 5 ADA reserve) */
  treasury_balance?: number;
  treasury_fundings?: ProjectTreasuryFundingOnChain[];
}

export interface MergedProjectDetailResponse {
  data: MergedProjectDetail;
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface MergedProjectListItem {
  available_task_count?: number;
  /** Off-chain content (nested) */
  content?: ProjectContent;
  contributor_state_id?: string;
  created_at?: string;
  created_slot?: number;
  created_tx?: string;
  managers?: string[];
  owner?: string;
  prerequisites?: ProjectPrerequisite[];
  project_address?: string;
  /** On-chain fields (top level) */
  project_id: string;
  /** Data source indicator */
  source: string;
  /** Aggregated task reward data (computed from Andamioscan detail) */
  total_reward_lovelace?: number;
  treasury_address?: string;
}

export interface MergedProjectsResponse {
  data: MergedProjectListItem[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface MergedSltItem {
  created_by?: string;
  has_lesson?: boolean;
  lesson?: MergedLessonContent;
  slt_index?: number;
  slt_text?: string;
}

export interface MergedSltsResponse {
  course_id: string;
  course_module_code: string;
  created_by?: string;
  slt_hash?: string;
  slts?: MergedSltItem[];
  /** "merged", "chain_only" */
  source: string;
}

export interface MergedSltsResponseWrapper {
  data: MergedSltsResponse;
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface MergedTaskListItem {
  /** Native assets */
  assets?: Asset[];
  /** Number of active (non-terminal) commitments on this task */
  commitment_count?: number;
  /** Off-chain content (nested) */
  content?: TaskContent;
  contributor_state_id?: string;
  created_by?: string;
  /** ISO timestamp */
  expiration?: string;
  expiration_posix?: number;
  lovelace_amount?: number;
  /** Hex-encoded */
  on_chain_content?: string;
  project_id: string;
  /** Data source indicator */
  source: string;
  /** On-chain fields (top level) */
  task_hash?: string;
  /** DB task index (for draft identification) */
  task_index?: number;
  /** DB task status (for db_only tasks: DRAFT, PENDING_TX, ON_CHAIN, etc.) */
  task_status?: string;
}

export interface MergedTasksResponse {
  data: MergedTaskListItem[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

/** Optional metadata for API responses */
export interface Meta {
  /** Pagination metadata for list endpoints */
  pagination?: Pagination;
  warning?: string;
}

export interface MintAccessTokenTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /** Self-funded path: Bech32 address of the access token recipient. Enterprise Path B also uses this as the receiver address. */
  initiator_data?: string;
  /** Sponsored path (Path A): provide this OR initiator_data, not both. */
  sponsor_data?: MintSponsorData;
}

export interface MintModuleV2 {
  allowed_student_state_ids?: string[];
  prereq_slt_hashes?: string[];
  slts?: string[];
}

export interface MintSponsorData {
  /**
   * Bech32 address of the end-user wallet that will receive the minted access token.
   * MUST differ from sponsor_address — the sponsor pays fees but does not receive the token.
   */
  access_token_receiver: string;
  /** UTxO reference for collateral (format: txhash#index) returned by getStaticInfo() from the utxos.dev SDK. */
  collateral_utxo_ref: string;
  /** Bech32 address of the sponsor wallet that funds the transaction. */
  sponsor_address: string;
  /**
   * UTxO reference (format: txhash#index) returned by getStaticInfo() from the utxos.dev SDK.
   * Do not pick arbitrary UTxOs — the sponsorship contract requires this exact reference.
   */
  static_utxo_ref: string;
}

export interface ModuleContent {
  /** Full assignment content (AssignmentV2) */
  assignment?: any;
  course_module_code?: string;
  description?: string;
  image_url?: string;
  /** Full introduction content (IntroductionV2) */
  introduction?: any;
  is_live?: boolean;
  module_status?: string;
  /** Full SLT content from DB ([]SltV2) */
  slts?: any;
  title?: string;
  video_url?: string;
}

export interface ModuleContentInput {
  course_module_code?: string;
  description?: string;
  image_url?: string;
  is_live?: boolean;
  module_status?: string;
  sort_order?: number;
  title?: string;
  video_url?: string;
}

export interface MyCommitmentSummary {
  /** committed, submitted, approved, rejected */
  commitment_status: string;
  content?: TaskCommitmentContent;
  task_hash: string;
}

export interface NotFoundErrorResponse {
  details?: string;
  /** @example "Not Found: The requested resource could not be found." */
  message: string;
  /** @example 404 */
  status_code: number;
}

/** Pagination metadata for list endpoints */
export interface Pagination {
  /** @example 1 */
  page: number;
  /** @example 20 */
  page_size: number;
  /** @example 100 */
  total: number;
}

export interface PaymentRequiredErrorResponse {
  details?: string;
  /** @example "Payment Required: Sponsorship quota exhausted." */
  message: string;
  /** @example 402 */
  status_code: number;
}

export interface PendingAssessmentSummary {
  on_chain_content?: string;
  submission_tx?: string;
  submitted_by: string;
  task_hash: string;
}

/** Response containing the current state of a tracked transaction. */
export interface PendingTxResponse {
  /**
   * Timestamp when the transaction was confirmed on-chain (RFC3339 format, null if not yet confirmed)
   * @example "2026-01-19T12:00:30Z"
   */
  confirmed_at?: string;
  /**
   * Timestamp when the transaction was registered (RFC3339 format)
   * @example "2026-01-19T12:00:00Z"
   */
  created_at?: string;
  /**
   * Failure reason code for permanent failures (e.g., TASK_NOT_FOUND, MODULE_NOT_FOUND)
   * @example "TASK_NOT_FOUND"
   */
  failure_reason?: string;
  /**
   * Optional instance ID (course_id or project_id)
   * @example "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
   */
  instance_id?: string;
  /**
   * Last error message if the transaction failed
   * @example ""
   */
  last_error?: string;
  /** Optional metadata stored with the transaction */
  metadata?: Record<string, string>;
  /**
   * Number of 404 poll cycles (Andamioscan not yet indexed)
   * @example 0
   */
  not_indexed_count?: number;
  /**
   * Number of retry attempts for confirmation polling (error retries only, not 404s)
   * @example 0
   */
  retry_count?: number;
  /**
   * Current state in the transaction lifecycle
   * @example "pending"
   */
  state?: "pending" | "confirmed" | "updated" | "failed" | "expired";
  /**
   * Transaction hash (64 hex characters)
   * @example "8a3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b"
   */
  tx_hash?: string;
  /**
   * Transaction type
   * @example "assignment_submit"
   */
  tx_type?:
    | "course_create"
    | "course_enroll"
    | "modules_manage"
    | "teachers_update"
    | "managers_manage"
    | "assignment_submit"
    | "assessment_assess"
    | "credential_claim"
    | "project_create"
    | "project_join"
    | "tasks_manage"
    | "task_submit"
    | "task_assess"
    | "project_credential_claim"
    | "blacklist_update"
    | "treasury_fund"
    | "access_token_mint";
  /**
   * Timestamp of the last state update (RFC3339 format)
   * @example "2026-01-19T12:01:00Z"
   */
  updated_at?: string;
  /**
   * User ID who registered the transaction
   * @example "user_abc123"
   */
  user_id?: string;
}

export interface PlanTier {
  checkout_keys?: Record<string, string>;
  /** @example 2500 */
  daily_quota?: number;
  /** @example "For developers building on the Andamio protocol." */
  description?: string;
  /** @example 2 */
  max_api_keys?: number;
  /** @example 75000 */
  monthly_quota?: number;
  /** @example "starter" */
  name?: string;
  /** @example 50 */
  rate_limit_per_minute?: number;
}

export interface PlansResponse {
  plans?: PlanTier[];
}

/** Standard API response envelope for available plans */
export interface PlansResponseEnvelope {
  data: PlansResponse;
}

export interface PortalResponse {
  /** @example "https://billing.stripe.com/p/session/xxx" */
  url: string;
}

/** Standard API response envelope for portal session */
export interface PortalResponseEnvelope {
  data: PortalResponse;
}

export interface PostProjectContributorCommitmentDeleteJSONRequestBody {
  task_hash?: string;
}

export interface PostUserAccessTokenAliasJSONRequestBody {
  access_token_alias?: string;
}

export interface PreviewCandidatesResponse {
  candidates?: FederatedCleanupCandidate[];
  count?: number;
  cross_env_operation_id?: string;
  grace_period_minutes?: number;
}

export interface Project {
  content?: ProjectContentInput;
  contributor_state_id?: string;
  created_at?: string;
  created_slot?: number;
  created_tx?: string;
  managers?: string[];
  owner?: string;
  project_address?: string;
  /** @example "policy_xyz789" */
  project_id: string;
  /** @example "chain+db" */
  source: string;
  treasury_address?: string;
}

export interface ProjectAssessmentOnChain {
  assessed_by: string;
  /** ACCEPTED, REFUSED, DENIED */
  decision: string;
  slot?: number;
  task_hash: string;
  tx?: string;
}

export interface ProjectContent {
  description?: string;
  image_url?: string;
  title?: string;
}

export interface ProjectContentInput {
  category?: string;
  description?: string;
  image_url?: string;
  /** @example true */
  is_public?: boolean;
  /** @example "Cardano Developer Tools" */
  title: string;
  video_url?: string;
}

export interface ProjectContributorOnChain {
  alias: string;
}

export interface ProjectCredentialClaimOnChain {
  alias: string;
  slot?: number;
  tx?: string;
}

export interface ProjectOutcome {
  /**
   * Plain text alias. Any characters allowed.
   * @example "JohnDoe"
   */
  alias?: string;
  /** enum: accept,refuse,deny */
  outcome?: "accept" | "refuse" | "deny";
}

export interface ProjectPrerequisite {
  course_id?: string;
  slt_hashes?: string[];
}

export interface ProjectSubmissionOnChain {
  on_chain_content?: string;
  slot?: number;
  submission_tx?: string;
  submitted_by: string;
  task_hash: string;
}

export interface ProjectTaskOnChain {
  /** Native assets */
  assets?: Asset[];
  contributor_state_id?: string;
  created_by?: string;
  /** ISO timestamp */
  expiration?: string;
  expiration_posix?: number;
  lovelace_amount?: number;
  /** Hex-encoded */
  on_chain_content?: string;
  task_hash: string;
}

export interface ProjectTreasuryFundingOnChain {
  alias?: string;
  assets?: Asset[];
  lovelace_amount?: number;
  slot?: number;
  tx_hash: string;
}

export interface ProjectsDashboard {
  contributing?: DashboardProjectSummary[];
  managing?: DashboardProjectSummary[];
  pending_assessments?: DashboardPendingAssessmentSummary[];
  total_pending_assessments?: number;
  with_prerequisites?: DashboardProjectWithPrereqs[];
}

export interface PublicCourseModuleItem {
  /** Off-chain content (from DB API) */
  content?: PublicModuleContent;
  /** Course context */
  course_id: string;
  /** On-chain fields (from Andamioscan) */
  created_by?: string;
  /** SLT text from chain */
  on_chain_slts?: string[];
  /** On-chain prerequisite module hashes */
  prerequisites?: string[];
  /** Primary identifier - on-chain slts_hash */
  slt_hash: string;
  /** Data source indicator */
  source: string;
}

export interface PublicModuleContent {
  course_module_code?: string;
  description?: string;
  image_url?: string;
  is_live?: boolean;
  title?: string;
}

export interface PublishModuleV2Request {
  course_id?: string;
  course_module_code?: string;
}

export interface QualifiedContributorsResponse {
  aliases?: string[];
  project_id?: string;
  /**
   * Status indicates the reason for an empty aliases list.
   * "ok" — prerequisites are configured and the intersection was computed.
   * "no_prerequisites_configured" — the project has no prerequisites on-chain; every alias is vacuously qualified.
   */
  status?: string;
  total_count?: number;
  truncated?: boolean;
}

export interface QualifiedContributorsResponseEnvelope {
  data: QualifiedContributorsResponse;
}

export interface RefreshRequest {
  /** @example "a3f1c2d4e5b6..." */
  refresh_token: string;
}

/** Refresh token data included in login and refresh responses */
export interface RefreshTokenData {
  /** @example "2026-06-04T12:30:00Z" */
  expires_at?: string;
  /** @example "a3f1c2d4e5b6..." */
  token?: string;
}

export interface RegisterCompleteRequest {
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  session_id: string;
  /** CIP-30 signature data from a Cardano wallet, containing the COSE_Sign1 signature and COSE_Key. */
  signature: SignatureData;
}

export interface RegisterCourseV2Request {
  category?: string;
  course_id?: string;
  description?: string;
  image_url?: string;
  is_public?: boolean;
  title?: string;
  tx_hash?: string;
  video_url?: string;
}

export interface RegisterModuleFromChainRequest {
  course_id?: string;
  course_module_code?: string;
  slt_hash?: string;
}

export interface RegisterModuleResponse {
  data: RegisterModuleResponse;
  /** Optional metadata for API responses */
  meta?: Meta;
}

/** Request body for registering a transaction with the TX State Machine. After submitting a signed transaction to the Cardano network, register it here so the Gateway can track confirmation and automatically update the database. */
export interface RegisterPendingTxRequest {
  /**
   * Optional instance ID (course_id or project_id) for scoping
   * @example "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
   */
  instance_id?: string;
  /** Optional metadata for off-chain data needed during DB update (e.g., policy_id, module_code) */
  metadata?: Record<string, string>;
  /**
   * Transaction hash (64 hex characters) returned from wallet.submitTx()
   * @example "8a3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b"
   */
  tx_hash: string;
  /**
   * Transaction type - determines which Andamioscan event endpoint to poll and which DB update to perform
   * @example "assignment_submit"
   */
  tx_type:
    | "course_create"
    | "course_enroll"
    | "modules_manage"
    | "teachers_update"
    | "managers_manage"
    | "assignment_submit"
    | "assessment_assess"
    | "credential_claim"
    | "project_create"
    | "project_join"
    | "tasks_manage"
    | "task_submit"
    | "task_assess"
    | "project_credential_claim"
    | "blacklist_update"
    | "treasury_fund"
    | "access_token_mint";
}

export interface RegisterProjectRequest {
  description?: string;
  image_url?: string;
  project_id?: string;
  title?: string;
}

export interface RegisterRequest {
  /**
   * @minLength 1
   * @maxLength 32
   * @example "johndoe"
   */
  alias: string;
  /**
   * @minLength 1
   * @maxLength 254
   * @example "john.doe@example.com"
   */
  email: string;
  /**
   * @minLength 103
   * @maxLength 108
   * @example "addr1q..."
   */
  wallet_address: string;
}

export interface RegisterResponse {
  /** @example "johndoe" */
  alias?: string;
  /** @example "2026-08-31T23:59:59Z" */
  subscription_expiration?: string;
  /** @example "Free" */
  tier?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  user_id?: string;
}

export interface RegisterSessionRequest {
  /**
   * @minLength 1
   * @maxLength 32
   * @example "johndoe"
   */
  alias: string;
  /**
   * @minLength 1
   * @maxLength 254
   * @example "john.doe@example.com"
   */
  email: string;
  /**
   * @minLength 103
   * @maxLength 108
   * @example "addr1q..."
   */
  wallet_address: string;
}

export interface RegisterSessionResponse {
  /** @example "2026-01-22T15:30:00Z" */
  expires_at?: string;
  /** @example "Please sign this message to verify wallet ownership: abc123..." */
  nonce?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  session_id?: string;
}

export interface RegisterTokenRequest {
  /** AssetName Hex-encoded asset name — 2-64 hex characters */
  asset_name?: string;
  /** AssetNameDecoded Human-readable asset name (auto-decoded from hex if omitted) */
  asset_name_decoded?: string;
  /** Decimals Number of decimal places */
  decimals?: number;
  /** Name Display name for the token */
  name?: string;
  /** PolicyId Cardano policy ID — exactly 56 hex characters */
  policy_id?: string;
  /** Ticker Token ticker symbol (e.g., ANDA) */
  ticker?: string;
}

export interface RegisteredSltItem {
  /** 1-based index */
  slt_index?: number;
  /** The SLT content */
  slt_text?: string;
}

export interface RemoveTeachersV2Request {
  aliases?: string[];
  course_id?: string;
}

export interface ResendVerificationResponse {
  /** @example "Verification email sent" */
  message?: string;
  /** @example "2026-02-09T15:30:00Z" */
  next_resend_available_at?: string;
  /** @example 4 */
  remaining_attempts?: number;
}

export interface ReviewAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
  decision?: ReviewAssignmentCommitmentV2RequestDecision;
  participant_alias?: string;
  pending_tx_hash?: string;
}

export interface RevokeKeyResponse {
  cross_env_operation_id?: string;
  environment?: string;
  key_id?: string;
  revoked_at?: string;
}

export interface RotateAPIKeyRequest {
  /**
   * @minLength 3
   * @maxLength 64
   * @example "MyFirstKey"
   */
  api_key_name: string;
  /**
   * @min 1
   * @example 365
   */
  expires_in_days?: number;
}

export interface RotateAPIKeyResponse {
  /** @example "API key expiration extended to 2026-08-31T23:59:59Z" */
  confirmation: string;
}

export interface RunCleanupOnceRequest {
  dry_run?: boolean;
}

export interface RunCleanupOnceResponse {
  cross_env_operation_id?: string;
  stats?: CleanerStatsView;
}

export interface SecureLoginResponse {
  /** @example "johndoe" */
  alias?: string;
  jwt?: JWTResponse;
  /** Refresh token data included in login and refresh responses */
  refresh_token?: RefreshTokenData;
  /** @example "pioneer" */
  tier?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  user_id?: string;
}

export interface ServiceUnavailableErrorResponse {
  details?: string;
  /** @example "Service Unavailable - One or more critical dependencies (e.g., database, Redis) are not reachable or healthy." */
  message: string;
  /** @example 503 */
  status_code: number;
}

export interface SetUserRoleRequest {
  /** @example 1 */
  tier_id?: number;
  /** @example "pro" */
  tier_name?: string;
  /** @example "123e4567-e89b-12d3-a456-426614174000" */
  user_id: string;
}

export interface SetUserRoleResponse {
  /** @example "User role updated successfully." */
  message?: string;
  /**
   * @min 1
   * @example 1
   */
  tier_id: number;
  /**
   * @minLength 1
   * @example "pro"
   */
  tier_name: string;
  /** @example "123e4567-e89b-12d3-a456-426614174000" */
  user_id?: string;
}

/** Standard API response envelope for setting user role */
export interface SetUserRoleResponseEnvelope {
  data: SetUserRoleResponse;
}

/** CIP-30 signature data from a Cardano wallet, containing the COSE_Sign1 signature and COSE_Key. */
export interface SignatureData {
  /** @example "a4010103272006215820..." */
  key: string;
  /** @example "84582aa201276761..." */
  signature: string;
}

export interface SltV2 {
  created_by_alias?: string;
  lesson?: LessonV2;
  /** SltIndex 1-based SLT index (starts at 1, not 0) */
  slt_index?: number;
  slt_text?: string;
}

export interface SponsorData {
  /** UTxO reference for collateral (format: txhash#index) returned by getStaticInfo() from the utxos.dev SDK. */
  collateral_utxo_ref: string;
  /** Bech32 address of the sponsor wallet that funds the transaction. */
  sponsor_address: string;
  /**
   * UTxO reference (format: txhash#index) returned by getStaticInfo() from the utxos.dev SDK.
   * Do not pick arbitrary UTxOs — the sponsorship contract requires this exact reference.
   */
  static_utxo_ref: string;
}

/** Request to start an Access Token ownership verification session. */
export interface StartVerificationRequest {
  /**
   * Alias is the Access Token alias to verify ownership of.
   * 	@example	alice
   * @minLength 1
   * @maxLength 64
   */
  alias: string;
}

/** Response containing session details for the wallet to sign. */
export interface StartVerificationResponse {
  /**
   * ExpiresAt is the timestamp when this session expires (5 minutes from creation).
   * 	@example	2026-03-10T12:05:00Z
   */
  expires_at?: string;
  /**
   * Nonce is the message that must be signed by the wallet using CIP-30.
   * 	@example	Sign this message to verify Andamio Access Token ownership: a1b2c3d4...
   */
  nonce?: string;
  /**
   * SessionID is the unique identifier for this verification session.
   * 	@example	550e8400-e29b-41d4-a716-446655440000
   */
  session_id?: string;
}

export interface StudentAssignmentCommitmentItem {
  /** Off-chain content (nested) */
  content?: AssignmentCommitmentContent;
  course_id: string;
  course_module_code: string;
  /** Hex-encoded on-chain content */
  on_chain_content?: string;
  /** On-chain status */
  on_chain_status: string;
  /** Identifiers */
  slt_hash: string;
  /** Data source indicator */
  source: string;
}

export interface StudentAssignmentCommitmentResponse {
  data: StudentAssignmentCommitmentItem;
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface StudentAssignmentCommitmentsResponse {
  data: StudentAssignmentCommitmentItem[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface StudentCourseCredential {
  /** Claimed credentials (slt_hashes from on-chain, for completed courses) */
  claimed_credentials?: string[];
  /** Course identity */
  course_id: string;
  course_title?: string;
  /** "enrolled", "completed" */
  enrollment_status: string;
  /** Enrollment state (from on-chain) */
  is_enrolled?: boolean;
  /** Module metadata (from DB, for resolving slt_hash → title/code) */
  modules?: CredentialModuleInfo[];
  /** Data source indicator */
  source: string;
}

export interface StudentCourseListItem {
  /** Off-chain content (nested) */
  content?: CourseContent;
  course_address?: string;
  /** On-chain fields (top level) */
  course_id: string;
  created_slot?: number;
  created_tx?: string;
  /** "enrolled" or "completed" */
  enrollment_status: string;
  owner?: string;
  /** Data source indicator */
  source: string;
  student_state_id?: string;
  teachers?: string[];
}

export interface StudentCoursesResponse {
  data: StudentCourseListItem[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface StudentCredentialsResponse {
  data: StudentCourseCredential[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface StudentDashboard {
  commitments?: DashboardCommitmentSummary[];
  completed_courses?: DashboardCourseSummary[];
  credentials_by_course?: DashboardCredentialSummary[];
  enrolled_courses?: DashboardCourseSummary[];
  total_credentials?: number;
}

export interface SubmitAssignmentCommitmentV2Request {
  /** CourseId The course ID (policy ID) */
  course_id?: string;
  /** Evidence Tiptap JSON evidence content */
  evidence?: Record<string, any>;
  /** EvidenceHash Hash of the evidence for on-chain verification */
  evidence_hash?: string;
  /** PendingTxHash The pending transaction hash */
  pending_tx_hash?: string;
  /** SltHash The SLT hash identifying the module (on-chain identifier) */
  slt_hash?: string;
}

export interface SubmitSponsoredRequest {
  /**
   * holder-signed tx hex
   * @example "84a40081825820..."
   */
  tx: string;
}

export interface SubscriptionStatus {
  /** @example false */
  cancel_at_period_end?: boolean;
  /** @example "2026-04-18T00:00:00Z" */
  current_period_end?: string;
  /** @example "active" */
  status?: string;
  /** @example "starter" */
  tier?: string;
}

export interface SuccessResponse {
  /** @example "Operation completed" */
  message?: string;
  /** @example true */
  success: boolean;
}

export interface Task {
  content?: TaskContentInput;
  contributor_state_id?: string;
  created_by?: string;
  expiration?: string;
  expiration_posix?: number;
  lovelace_amount?: number;
  on_chain_content?: string;
  project_id: string;
  source: string;
  /** @example "hash_abc123" */
  task_hash: string;
}

export interface TaskActionTxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  project_id?: string;
  /** A text string with a maximum length of 140 characters. */
  project_info?: string;
}

export interface TaskCommitment {
  content?: TaskSubmissionInput;
  contributor_address: string;
  created_at?: string;
  project_id: string;
  /** @example "pending" */
  task_commitment_status?: string;
  task_evidence_hash?: string;
  task_hash: string;
  updated_at?: string;
}

export interface TaskCommitmentContent {
  /** Manager who assessed */
  assessed_by?: string;
  /** DRAFT, COMMITTED, ACCEPTED, REFUSED, DENIED, REWARDED, ABANDONED, PENDING_TX_*. */
  commitment_status?: string;
  /** Tiptap JSON document */
  evidence?: any;
  /** Hash for on-chain verification */
  task_evidence_hash?: string;
  /** accept, refuse, deny (lowercase, matches db-api enum) */
  task_outcome?: string;
}

export interface TaskContent {
  /** Rich Tiptap JSON document */
  content_json?: any;
  description?: string;
  task_index?: number;
  title?: string;
}

export interface TaskContentInput {
  description?: string;
  image_url?: string;
  title?: string;
}

export interface TaskData {
  /**
   * Unix timestamp (milliseconds) for task expiration
   * @example 1776421758000
   */
  expiration_posix?: number;
  /**
   * Amount in lovelace
   * @example 2000000
   */
  lovelace_amount?: number;
  /** List of (asset class, quantity) pairs. An asset class is either "lovelace" or a token with its minting policy and token name delimited by dot (.). */
  native_assets?: any[][];
  /**
   * Human-readable description of the task requirements
   * @example "Complete the assigned module and submit proof."
   */
  project_content?: string;
}

export interface TaskSubmissionInput {
  evidence_url?: string;
  notes?: string;
}

export interface TasksAssessV2TxRequest {
  /**
   * Plain text alias. Any characters allowed.
   * @minLength 1
   * @maxLength 31
   * @example "JohnDoe"
   */
  alias?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  contributor_state_id?: string;
  /**
   * Hash of a minting policy script.
   * @example "ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef"
   */
  project_id?: string;
  task_decisions?: ProjectOutcome[];
}

export interface TeacherAssignmentCommitmentItem {
  /** Off-chain content (nested) */
  content?: AssignmentCommitmentContent;
  /** Identifiers */
  course_id: string;
  /** Human-readable module code (from DB) */
  course_module_code?: string;
  /** Hex-encoded on-chain content */
  on_chain_content?: string;
  /** On-chain student status (from course details) */
  on_chain_status?: string;
  slt_hash: string;
  /** Data source indicator */
  source: string;
  student_alias: string;
  submission_slot?: number;
  /** On-chain submission info */
  submission_tx?: string;
}

export interface TeacherAssignmentCommitmentsResponse {
  data: TeacherAssignmentCommitmentItem[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface TeacherDashboard {
  courses?: DashboardCourseSummary[];
  pending_reviews?: DashboardPendingReviewSummary[];
  total_pending_reviews?: number;
}

/** Single registered native asset token */
export interface TokenDetailResponse {
  data: TokenRegistryEntry;
  /** Optional metadata for API responses */
  meta?: Meta;
}

/** List of registered native asset tokens */
export interface TokenListResponse {
  data: TokenRegistryEntry[];
  /** Optional metadata for API responses */
  meta?: Meta;
}

export interface TokenRegistryEntry {
  /** @example "416e64616d696f546f6b656e" */
  asset_name: string;
  /** @example "AndamioToken" */
  asset_name_decoded: string;
  /** @example 6 */
  decimals?: number;
  /** @example "Andamio Token" */
  name?: string;
  /** @example "f4c9f9c4252d86702c2f4c2e49e6648873ca2ac01c8b5c76f2d4da5f" */
  policy_id: string;
  /** @example "f4c9f9c4252d86702c2f4c2e49e6648873ca2ac01c8b5c76f2d4da5f416e64616d696f546f6b656e" */
  subject: string;
  /** @example "ANDA" */
  ticker?: string;
}

export interface TokenResponse {
  expires_at: string;
  token: string;
}

export interface TooManyRequestsErrorResponse {
  details?: string;
  /** @example "Too Many Requests: Rate limit or quota exceeded." */
  message: string;
  /** @example 429 */
  status_code: number;
}

/** Statistics about the TX State Machine for monitoring and debugging. */
export interface TxStatsResponse {
  /**
   * Number of transactions confirmed on-chain
   * @example 142
   */
  confirmed_count?: number;
  /**
   * Number of expired transactions (not confirmed within timeout)
   * @example 0
   */
  expired_count?: number;
  /**
   * Number of failed transactions
   * @example 2
   */
  failed_count?: number;
  /**
   * Number of transactions in pending state
   * @example 5
   */
  pending_count?: number;
  /**
   * Current length of the confirmation queue
   * @example 3
   */
  queue_length?: number;
  /** Breakdown of pending transactions by type */
  type_breakdown?: Record<string, number>;
  /**
   * Number of transactions with completed DB updates
   * @example 140
   */
  updated_count?: number;
}

export interface UnauthorizedErrorResponse {
  details?: string;
  /** @example "Unauthorized: Invalid or missing credentials." */
  message: string;
  /** @example 401 */
  status_code: number;
}

export interface UnprocessableEntityErrorResponse {
  details?: string;
  /** @example "Unprocessable Entity: Invalid request structure or data." */
  message: string;
  /** @example 422 */
  status_code: number;
}

export interface UnsignedTxResponse {
  unsigned_tx?: string;
}

export interface UnsignedTxResponseInitCourse {
  /** This is the hash of a minting policy script. */
  course_id?: string;
  unsigned_tx?: string;
}

export interface UnsignedTxResponseInitProject {
  /** This is the hash of a minting policy script. */
  project_id?: string;
  unsigned_tx?: string;
}

export interface UpdateAssignmentCommitmentV2Request {
  course_id?: string;
  course_module_code?: string;
  evidence?: Record<string, any>;
  evidence_hash?: string;
}

export interface UpdateCourseRequest {
  category?: string;
  description?: string;
  image_url?: string;
  is_public?: boolean;
  title?: string;
  video_url?: string;
}

export interface UpdateModuleStatusRequest {
  course_id?: string;
  course_module_code?: string;
  /** Required when status = "APPROVED" */
  slt_hash?: string;
  /** "DRAFT", "APPROVED", or "PENDING_TX" */
  status?: string;
}

export interface UpdateModuleV2 {
  allowed_student_state_ids?: string[];
  prereq_slt_hashes?: string[];
  /** Hex-encoded hash of the SLT (exactly 64 characters). */
  slt_hash?: string;
}

export interface UpdateProjectRequest {
  category?: string;
  description?: string;
  image_url?: string;
  is_public?: boolean;
  title?: string;
  video_url?: string;
}

export interface UpdateTaskCommitmentRequest {
  evidence?: Record<string, any>;
  /** @example "ev_hash_456" */
  evidence_hash?: string;
  /** @example "hash_abc123" */
  task_hash: string;
}

export interface UpdateTaskRequest {
  /** @example "Build a responsive login page" */
  content?: string;
  content_json?: Record<string, any>;
  /** @example "policy_xyz789" */
  contributor_state_id: string;
  /** @example "1735689600000" */
  expiration_time?: string;
  /** @example 0 */
  index: number;
  /** @example "5000000" */
  lovelace_amount?: string;
  /** @example "Build login page" */
  title?: string;
  tokens?: CreateTaskToken[];
}

export interface UpdateTeachersV2Request {
  /** Add Aliases to add as teachers */
  add?: string[];
  course_id?: string;
  /** Remove Aliases to remove as teachers */
  remove?: string[];
}

export interface UpdateTeachersV2Response {
  course_id?: string;
  success?: boolean;
  teachers_added?: string[];
  /** TeachersCurrent Final list of teachers after updates */
  teachers_current?: string[];
  teachers_removed?: string[];
}

export interface UsageData {
  /** @example "MyFirstKey" */
  api_key_name?: string;
  /** @example ["[\"v1\"]"] */
  api_versions?: string[];
  /** @example ["[\"API_KEY\"]"] */
  authentication_methods?: string[];
  /** @example "2023-01-01T00:00:00Z" */
  date?: string;
  /** @example ["[\"/v1/data\"]"] */
  endpoints?: string[];
  /** @example ["[\"GET\"]"] */
  http_methods?: string[];
  /** @example 500 */
  max_response_time_ms?: number;
  /** @example 10 */
  min_response_time_ms?: number;
  /** @example 1 */
  tier_id?: number;
  /** @example "Free" */
  tier_name?: string;
  /** @example 100 */
  total_cache_hit_count?: number;
  /** @example 1024000 */
  total_data_transfer_in_bytes?: number;
  /** @example 2048000 */
  total_data_transfer_out_bytes?: number;
  /** @example 50 */
  total_error_count?: number;
  /** @example 2 */
  total_quota_exceeded_count?: number;
  /** @example 5 */
  total_rate_limited_count?: number;
  /** @example 1000 */
  total_requests?: number;
  /** @example 50000 */
  total_response_time_ms?: number;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  user_id?: string;
  /**
   * Added UserIPs
   * @example ["[\"192.168.1.1\"]"]
   */
  user_ips?: string[];
}

export interface UsagePerApiKeyName {
  /** @example "MyFirstKey" */
  api_key_name?: string;
  usage_data?: UsageData[];
}

export interface UsageResponse {
  /** @example 50 */
  daily_quota_consumed?: number;
  /** @example 1000 */
  daily_quota_limit?: number;
  /** @example "2026-08-31T23:59:59Z" */
  expiration?: string;
  /** @example 500 */
  monthly_quota_consumed?: number;
  /** @example 10000 */
  monthly_quota_limit?: number;
  /** @example ["[\"100 req/min\""," \"1000 req/day\""," \"10000 req/month\"]"] */
  rate_limit_windows?: string[];
  /** @example 950 */
  remaining_daily?: number;
  /** @example 9500 */
  remaining_monthly?: number;
  /** @example "Free" */
  subscription_tier?: string;
}

/** Standard API response envelope for usage metrics */
export interface UsageResponseEnvelope {
  data: UsageResponse;
}

export interface UserAPIUsageRequest {
  /**
   * @minLength 1
   * @maxLength 64
   * @example "johndoe"
   */
  alias: string;
  /** @example ["[\"MyFirstKey\""," \"AnotherKey\"]"] */
  api_key_names?: string[];
  /** @example "2023-01-31" */
  end_date: string;
  /** @example "2023-01-01" */
  start_date: string;
}

export interface UserAPIUsageResponse {
  /** @example "johndoe" */
  alias?: string;
  api_usage_metrics?: APIUsageMetric[];
}

export interface UserDailyApiUsageRequest {
  /** @example ["[\"MyFirstKey\""," \"AnotherKey\"]"] */
  api_key_names?: string[];
  /** @example "2023-01-31" */
  end_date: string;
  /** @example "2023-01-01" */
  start_date: string;
}

export interface UserDailyApiUsageResponse {
  user_usages?: UserUsagePerApiKeyName[];
}

export interface UserInfo {
  /**
   * @minLength 1
   * @maxLength 64
   * @example "johndoe"
   */
  alias: string;
  /** @example ["[\"MyFirstKey\""," \"AnotherKey\"]"] */
  api_key_names?: string[];
}

export interface UserUsage {
  /** @example "johndoe" */
  alias?: string;
  usages?: UsagePerApiKeyName[];
}

export interface UserUsageData {
  /** @example "MyFirstKey" */
  api_key_name?: string;
  /** @example ["[\"v1\"]"] */
  api_versions?: string[];
  /** @example ["[\"API_KEY\"]"] */
  authentication_methods?: string[];
  /** @example "2023-01-01" */
  date?: string;
  /** @example ["[\"/v1/data\"]"] */
  endpoints?: string[];
  /** @example ["[\"GET\"]"] */
  http_methods?: string[];
  /** @example 1 */
  tier_id?: number;
  /** @example "Free" */
  tier_name?: string;
  /** @example 50 */
  total_error_count?: number;
  /** @example 1000 */
  total_requests?: number;
}

export interface UserUsagePerApiKeyName {
  /** @example "MyFirstKey" */
  api_key_name?: string;
  usage_Data?: UserUsageData[];
}

/** List of valid transaction types that can be registered with the TX State Machine. */
export interface ValidTxTypesResponse {
  /**
   * List of valid transaction type strings
   * @example ["course_create","assignment_submit","access_token_mint"]
   */
  types?: string[];
}

/** Validates CIP-30/CIP-8 wallet signature and returns JWT token. */
export interface ValidateSignatureRequest {
  /**
   * Access token alias (e.g. 'falcon'). For CLI/agent headless login.
   * @example "falcon"
   */
  access_token_alias?: string;
  /**
   * Wallet address in bech32 or hex format
   * @example "addr_test1qq..."
   */
  address?: string;
  /** Full access token unit (policyId + hex-encoded name). For browser wallets. */
  andamio_access_token_unit?: string;
  /**
   * Session ID from /auth/login/session
   * @example "session-123"
   */
  id: string;
  /** CIP-30 wallet signature */
  signature: SignatureData;
  /** Wallet name for debugging */
  wallet_preference?: string;
}

/** Response when verification fails, containing error details. */
export interface VerificationFailureResponse {
  /**
   * Error is a machine-readable error code.
   * 	@example	session_expired
   */
  error?: string;
  /**
   * Message is a human-readable error description.
   * 	@example	The verification session has expired. Please start a new session.
   */
  message?: string;
  /**
   * Verified is always false for failure responses.
   * 	@example	false
   */
  verified?: boolean;
}

export interface VerifyEmailRequest {
  /** @example "dGVzdC10b2tlbg==" */
  token: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  token_id: string;
}

export interface VerifyEmailResponse {
  /** @example "johndoe" */
  alias?: string;
  /** @example true */
  email_verified?: boolean;
  jwt?: JWTResponse;
  /** @example "Email verified successfully" */
  message?: string;
  /** @example "a1b2c3d4-e5f6-7890-1234-567890abcdef" */
  user_id?: string;
}
