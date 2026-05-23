/**
 * Transaction UI Configuration
 *
 * Centralized UI strings for all Andamio V2 transactions.
 * Extracted from @andamio/transactions package for use after gateway
 * auto-confirmation makes side effects obsolete.
 *
 * ## Usage
 *
 * ```tsx
 * import { TRANSACTION_UI, type TransactionType } from "~/config/transaction-ui";
 *
 * const txType: TransactionType = "COURSE_STUDENT_ASSIGNMENT_COMMIT";
 * const ui = TRANSACTION_UI[txType];
 *
 * <Button>{ui.buttonText}</Button>
 * <p>{ui.successInfo}</p>
 * ```
 *
 * ## Migration Notes
 *
 * This config replaces the `ui` property from `@andamio/transactions` definitions.
 * The gateway now handles transaction confirmation automatically, so:
 * - onSubmit/onConfirmation side effects are OBSOLETE
 * - UX strings are the primary value we preserve
 *
 * @see https://docs.andamio.io/docs/protocol/v2/transactions
 */

import { getDocsUrl } from "./branding";

// =============================================================================
// Types
// =============================================================================

/**
 * UI metadata for a transaction type
 */
export interface TransactionUIConfig {
  /** Button label for the transaction action */
  buttonText: string;
  /** Title for dialogs/cards showing this transaction */
  title: string;
  /** Description paragraphs explaining the transaction */
  description: string[];
  /** Link to transaction documentation */
  footerLink: string;
  /** Text for the footer documentation link */
  footerLinkText: string;
  /** Success message shown after transaction completes */
  successInfo: string;
  /**
   * Whether this transaction requires DB updates after on-chain confirmation.
   * - true: Register with gateway for status tracking (default)
   * - false: Pure on-chain TX, no DB state to update (e.g., Access Token Mint)
   */
  requiresDBUpdate: boolean;
  /**
   * Whether this transaction should be registered with the gateway for
   * on-chain confirmation tracking, even if no DB updates are needed.
   * Gateway will track pending → confirmed → updated (updated is immediate
   * since there are no DB writes).
   *
   * - true: Register and track via SSE/polling (e.g., Access Token Mint)
   * - false: No tracking needed (default)
   */
  requiresOnChainConfirmation?: boolean;
}

/**
 * All supported transaction types
 */
export type TransactionType =
  // Global
  | "GLOBAL_GENERAL_ACCESS_TOKEN_MINT"
  | "GLOBAL_USER_ACCESS_TOKEN_CLAIM"
  // Instance
  | "INSTANCE_COURSE_CREATE"
  | "INSTANCE_PROJECT_CREATE"
  // Course - Owner
  | "COURSE_OWNER_TEACHERS_MANAGE"
  // Course - Teacher
  | "COURSE_TEACHER_MODULES_MANAGE"
  | "COURSE_TEACHER_ASSIGNMENTS_ASSESS"
  // Course - Student
  | "COURSE_STUDENT_ASSIGNMENT_COMMIT"
  | "COURSE_STUDENT_ASSIGNMENT_UPDATE"
  | "COURSE_STUDENT_CREDENTIAL_CLAIM"
  // Project - Owner
  | "PROJECT_OWNER_MANAGERS_MANAGE"
  | "PROJECT_OWNER_BLACKLIST_MANAGE"
  // Project - Manager
  | "PROJECT_MANAGER_TASKS_MANAGE"
  | "PROJECT_MANAGER_TASKS_ASSESS"
  // Project - Contributor
  | "PROJECT_CONTRIBUTOR_TASK_COMMIT"
  | "PROJECT_CONTRIBUTOR_TASK_ACTION"
  | "PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM"
  // Project - User (Treasury)
  | "PROJECT_USER_TREASURY_ADD_FUNDS";

// =============================================================================
// Transaction UI Configuration
// =============================================================================

export const TRANSACTION_UI: Record<TransactionType, TransactionUIConfig> = {
  // ===========================================================================
  // Global Transactions
  // ===========================================================================

  GLOBAL_GENERAL_ACCESS_TOKEN_MINT: {
    buttonText: "Create Access Token",
    title: "Create Access Token",
    description: [
      "Mint your access token to participate in the Andamio protocol. This is required before you can enroll in courses or perform any other actions.",
    ],
    footerLink: getDocsUrl("accessTokenMint"),
    footerLinkText: "Tx Documentation",
    successInfo: "Access Token Created!",
    requiresDBUpdate: false, // No DB state to update after confirmation
    requiresOnChainConfirmation: true, // Track on-chain confirmation via gateway
  },

  GLOBAL_USER_ACCESS_TOKEN_CLAIM: {
    buttonText: "Claim V2 Access Token",
    title: "Claim V2 Access Token",
    description: [
      "Claim your V2 access token using your existing V1 token. This is a one-time migration — your V1 token proves ownership, so no authentication is required.",
    ],
    footerLink: getDocsUrl("accessTokenMint"),
    footerLinkText: "Tx Documentation",
    successInfo: "V2 access token claimed successfully!",
    requiresDBUpdate: false,
    requiresOnChainConfirmation: true,
  },

  // ===========================================================================
  // Instance Transactions
  // ===========================================================================

  INSTANCE_COURSE_CREATE: {
    buttonText: "Create Course",
    title: "Create Course",
    description: [
      "Create a new course on the Andamio platform. This will mint a Course NFT that represents ownership and enables on-chain course management.",
    ],
    footerLink: getDocsUrl("courseCreate"),
    footerLinkText: "Tx Documentation",
    successInfo: "Course created successfully!",
    requiresDBUpdate: true,
  },

  INSTANCE_PROJECT_CREATE: {
    buttonText: "Create Project",
    title: "Create Project",
    description: [
      "Create a new project on the Andamio platform. This will mint a Project NFT that represents ownership and enables on-chain project management.",
    ],
    footerLink: getDocsUrl("projectCreate"),
    footerLinkText: "Tx Documentation",
    successInfo: "Project created successfully!",
    requiresDBUpdate: true,
  },

  // ===========================================================================
  // Course - Owner Transactions
  // ===========================================================================

  COURSE_OWNER_TEACHERS_MANAGE: {
    buttonText: "Manage Teachers",
    title: "Manage Course Teachers",
    description: [
      "Add or remove teachers from a course. Teachers have the ability to manage course modules and assess student assignments.",
    ],
    footerLink: getDocsUrl("teachersManage"),
    footerLinkText: "Tx Documentation",
    successInfo: "Course teachers updated successfully!",
    requiresDBUpdate: true,
  },

  // ===========================================================================
  // Course - Teacher Transactions
  // ===========================================================================

  COURSE_TEACHER_MODULES_MANAGE: {
    buttonText: "Manage Modules",
    title: "Manage Course Modules",
    description: [
      "Add, update, or manage course modules. This transaction allows teachers to mint module tokens and update module content on-chain.",
      "Module token names are computed as Blake2b-256 hashes of the SLT content.",
    ],
    footerLink: getDocsUrl("modulesManage"),
    footerLinkText: "Tx Documentation",
    successInfo: "Course modules managed successfully!",
    requiresDBUpdate: true,
  },

  COURSE_TEACHER_ASSIGNMENTS_ASSESS: {
    buttonText: "Assess Assignment",
    title: "Assess Student Assignment",
    description: [
      "Review and assess a student's assignment submission. Accept to grant the student a credential for completing this module, or refuse with feedback for improvement.",
    ],
    footerLink: getDocsUrl("assignmentsAssess"),
    footerLinkText: "Tx Documentation",
    successInfo: "Assessment Submitted!",
    requiresDBUpdate: true,
  },

  // ===========================================================================
  // Course - Student Transactions
  // ===========================================================================

  COURSE_STUDENT_ASSIGNMENT_COMMIT: {
    buttonText: "Submit Assignment",
    title: "Submit Assignment",
    description: [
      "Submit an assignment in this course. This creates an on-chain record of your submission.",
      "You must select a module and provide assignment evidence.",
    ],
    footerLink: getDocsUrl("assignmentCommit"),
    footerLinkText: "Tx Documentation",
    successInfo: "Assignment Submitted!",
    requiresDBUpdate: true,
  },

  COURSE_STUDENT_ASSIGNMENT_UPDATE: {
    buttonText: "Resubmit Assignment",
    title: "Update Assignment",
    description: [
      "Update your assignment evidence while keeping the same module commitment.",
      "To commit to a different module, use the commit transaction instead.",
    ],
    footerLink: getDocsUrl("assignmentUpdate"),
    footerLinkText: "Tx Documentation",
    successInfo: "Assignment Updated!",
    requiresDBUpdate: true,
  },

  COURSE_STUDENT_CREDENTIAL_CLAIM: {
    buttonText: "Claim Credential",
    title: "Claim Course Credential",
    description: [
      "Claim your credential for completing this course. Once claimed, you will receive an on-chain credential token that proves your achievement.",
    ],
    footerLink: getDocsUrl("credentialClaim"),
    footerLinkText: "Tx Documentation",
    successInfo: "Credential claimed successfully!",
    requiresDBUpdate: true,
  },

  // ===========================================================================
  // Project - Owner Transactions
  // ===========================================================================

  PROJECT_OWNER_MANAGERS_MANAGE: {
    buttonText: "Manage Managers",
    title: "Manage Project Managers",
    description: [
      "Add or remove managers from a project. Managers have the ability to manage project tasks and assess contributor submissions.",
    ],
    footerLink: getDocsUrl("managersManage"),
    footerLinkText: "Tx Documentation",
    successInfo: "Project managers updated successfully!",
    requiresDBUpdate: true,
  },

  PROJECT_OWNER_BLACKLIST_MANAGE: {
    buttonText: "Manage Blacklist",
    title: "Manage Contributor Blacklist",
    description: [
      "Add or remove contributors from the project blacklist. Blacklisted contributors cannot participate in this project.",
    ],
    footerLink: getDocsUrl("blacklistManage"),
    footerLinkText: "Tx Documentation",
    successInfo: "Contributor blacklist updated successfully!",
    requiresDBUpdate: true,
  },

  // ===========================================================================
  // Project - Manager Transactions
  // ===========================================================================

  PROJECT_MANAGER_TASKS_MANAGE: {
    buttonText: "Manage Tasks",
    title: "Manage Project Tasks",
    description: [
      "Add or remove tasks from a project. Each task specifies its reward, expiration time, and content hash.",
    ],
    footerLink: getDocsUrl("tasksManage"),
    footerLinkText: "Tx Documentation",
    successInfo: "Project tasks managed successfully!",
    requiresDBUpdate: true,
  },

  PROJECT_MANAGER_TASKS_ASSESS: {
    buttonText: "Assess Task",
    title: "Assess Task Submission",
    description: [
      "Review and assess a contributor's task submission. Accept to approve and reward, refuse to allow resubmission, or deny to permanently reject.",
    ],
    footerLink: getDocsUrl("tasksAssess"),
    footerLinkText: "Tx Documentation",
    successInfo: "Task assessment submitted successfully!",
    requiresDBUpdate: true,
  },

  // ===========================================================================
  // Project - Contributor Transactions
  // ===========================================================================

  PROJECT_CONTRIBUTOR_TASK_COMMIT: {
    buttonText: "Commit to Task",
    title: "Commit to New Task",
    description: [
      "Commit to a new task in this project. This creates an on-chain commitment to the task.",
      "If you have a completed (accepted) task, committing to a new task will also claim your pending reward from the previous task.",
    ],
    footerLink: getDocsUrl("taskCommit"),
    footerLinkText: "Tx Documentation",
    successInfo: "Successfully committed to task!",
    requiresDBUpdate: true,
  },

  PROJECT_CONTRIBUTOR_TASK_ACTION: {
    buttonText: "Submit Evidence",
    title: "Submit Evidence",
    description: [
      "Submit or update your evidence for this task. Your manager will review your submission.",
    ],
    footerLink: getDocsUrl("taskAction"),
    footerLinkText: "Tx Documentation",
    successInfo: "Task action completed successfully!",
    requiresDBUpdate: true,
  },

  PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM: {
    buttonText: "Claim Credentials",
    title: "Claim Project Credentials",
    description: [
      "Claim your credentials for completed project tasks. Once claimed, you will receive on-chain credential tokens that prove your achievements.",
    ],
    footerLink: getDocsUrl("contributorCredentialClaim"),
    footerLinkText: "Tx Documentation",
    successInfo: "Credentials claimed successfully!",
    requiresDBUpdate: true,
  },

  // ===========================================================================
  // Project - User (Treasury) Transactions
  // ===========================================================================

  PROJECT_USER_TREASURY_ADD_FUNDS: {
    buttonText: "Add Funds",
    title: "Add Funds to Project Treasury",
    description: [
      "Add funds to the project treasury. These funds will be available for task rewards and project operations.",
    ],
    footerLink: getDocsUrl("treasuryAddFunds"),
    footerLinkText: "Tx Documentation",
    successInfo: "Funds added to treasury successfully!",
    requiresDBUpdate: true,
  },
};

// =============================================================================
// API Endpoints (for reference)
// =============================================================================

/**
 * Transaction API endpoints mapped by type.
 * These are the POST endpoints used to build unsigned transactions.
 */
export const TRANSACTION_ENDPOINTS: Record<TransactionType, string> = {
  GLOBAL_GENERAL_ACCESS_TOKEN_MINT: "/api/v2/tx/global/user/access-token/mint",
  GLOBAL_USER_ACCESS_TOKEN_CLAIM: "/api/v2/tx/global/user/access-token/claim",
  INSTANCE_COURSE_CREATE: "/api/v2/tx/instance/owner/course/create",
  INSTANCE_PROJECT_CREATE: "/api/v2/tx/instance/owner/project/create",
  COURSE_OWNER_TEACHERS_MANAGE: "/api/v2/tx/course/owner/teachers/manage",
  COURSE_TEACHER_MODULES_MANAGE: "/api/v2/tx/course/teacher/modules/manage",
  COURSE_TEACHER_ASSIGNMENTS_ASSESS: "/api/v2/tx/course/teacher/assignments/assess",
  COURSE_STUDENT_ASSIGNMENT_COMMIT: "/api/v2/tx/course/student/assignment/commit",
  COURSE_STUDENT_ASSIGNMENT_UPDATE: "/api/v2/tx/course/student/assignment/update",
  COURSE_STUDENT_CREDENTIAL_CLAIM: "/api/v2/tx/course/student/credential/claim",
  PROJECT_OWNER_MANAGERS_MANAGE: "/api/v2/tx/project/owner/managers/manage",
  PROJECT_OWNER_BLACKLIST_MANAGE: "/api/v2/tx/project/owner/contributor-blacklist/manage",
  PROJECT_MANAGER_TASKS_MANAGE: "/api/v2/tx/project/manager/tasks/manage",
  PROJECT_MANAGER_TASKS_ASSESS: "/api/v2/tx/project/manager/tasks/assess",
  PROJECT_CONTRIBUTOR_TASK_COMMIT: "/api/v2/tx/project/contributor/task/commit",
  PROJECT_CONTRIBUTOR_TASK_ACTION: "/api/v2/tx/project/contributor/task/action",
  PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM: "/api/v2/tx/project/contributor/credential/claim",
  PROJECT_USER_TREASURY_ADD_FUNDS: "/api/v2/tx/project/user/treasury/add-funds",
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get UI config for a transaction type
 */
export function getTransactionUI(txType: TransactionType): TransactionUIConfig {
  return TRANSACTION_UI[txType];
}

/**
 * Get API endpoint for a transaction type
 */
export function getTransactionEndpoint(txType: TransactionType): string {
  return TRANSACTION_ENDPOINTS[txType];
}

/**
 * Check if a string is a valid transaction type
 */
export function isTransactionType(value: string): value is TransactionType {
  return value in TRANSACTION_UI;
}
