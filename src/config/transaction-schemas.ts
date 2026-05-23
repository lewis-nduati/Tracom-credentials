/**
 * Transaction Parameter Schemas
 *
 * Zod schemas for validating transaction parameters before submission.
 * These schemas match the Andamio Gateway API spec exactly.
 *
 * ## Usage
 *
 * ```tsx
 * import { txSchemas, type TxParams } from "~/config/transaction-schemas";
 *
 * // Validate before submission
 * const result = txSchemas.COURSE_STUDENT_ASSIGNMENT_COMMIT.safeParse(formData);
 * if (!result.success) {
 *   console.error(result.error.flatten());
 *   return;
 * }
 *
 * // Use validated data
 * const params: TxParams["COURSE_STUDENT_ASSIGNMENT_COMMIT"] = result.data;
 * ```
 *
 * @see https://preprod.api.andamio.io/api/v1/docs/
 */

import { z } from "zod";
import type { TransactionType } from "./transaction-ui";

// =============================================================================
// Common Schema Building Blocks
// =============================================================================

/**
 * Alias schema - User access token alias
 * Alphanumeric characters and underscores only
 */
export const aliasSchema = z.string().min(1).max(31);

/**
 * Policy ID schema - 56 character hex string
 * Used for course_id, project_id, contributor_state_id, etc.
 */
export const policyIdSchema = z.string().length(56);

/**
 * Hash schema - 64 character hex string
 * Used for slt_hash, task_hash, module_hash, etc.
 */
export const hashSchema = z.string().length(64);

/**
 * Short text schema - Max 140 characters
 * Used for assignment_info, project_info, task content, etc.
 */
export const shortTextSchema = z.string().max(140);

/**
 * Wallet data schema - Initiator data for transaction building
 * Contains addresses for UTxO selection and change output
 */
export const walletDataSchema = z
  .object({
    used_addresses: z.array(z.string()),
    change_address: z.string(),
  })
  .optional();

/**
 * Value schema - Array of [asset_class, quantity] tuples
 * Asset class is either "lovelace" or "policy_id.asset_name"
 */
export const valueSchema = z.array(z.tuple([z.string(), z.number()]));

// =============================================================================
// Transaction Parameter Schemas
// =============================================================================

/**
 * All transaction parameter schemas mapped by transaction type
 *
 * These schemas match the Andamio Gateway API spec exactly.
 * @see https://preprod.api.andamio.io/api/v1/docs/
 */
export const txSchemas = {
  // ===========================================================================
  // Global Transactions
  // ===========================================================================

  /**
   * Mint access token to participate in the Andamio protocol
   * @see MintAccessTokenTxRequest
   */
  GLOBAL_GENERAL_ACCESS_TOKEN_MINT: z.object({
    alias: aliasSchema,
    initiator_data: z.string().min(1), // Bech32 address string
  }),

  /**
   * Claim V2 access token using existing V1 token (no auth required)
   * @see ClaimV2AccessTokenTxRequest
   */
  GLOBAL_USER_ACCESS_TOKEN_CLAIM: z.object({
    alias: aliasSchema,
  }),

  // ===========================================================================
  // Instance Transactions
  // ===========================================================================

  /**
   * Create a new course on-chain
   * @see CreateCourseTxRequest
   */
  INSTANCE_COURSE_CREATE: z.object({
    alias: aliasSchema,
    teachers: z.array(aliasSchema),
    initiator_data: walletDataSchema,
  }),

  /**
   * Create a new project on-chain
   * @see CreateProjectTxRequest
   */
  INSTANCE_PROJECT_CREATE: z.object({
    alias: aliasSchema,
    managers: z.array(aliasSchema),
    course_prereqs: z.array(
      z.tuple([
        policyIdSchema, // course_id
        z.array(hashSchema), // required module hashes
      ])
    ),
    initiator_data: walletDataSchema,
  }),

  // ===========================================================================
  // Course - Owner Transactions
  // ===========================================================================

  /**
   * Add or remove teachers from a course
   * @see ManageTeachersTxRequest
   */
  COURSE_OWNER_TEACHERS_MANAGE: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    teachers_to_add: z.array(aliasSchema),
    teachers_to_remove: z.array(aliasSchema),
    initiator_data: walletDataSchema,
  }),

  // ===========================================================================
  // Course - Teacher Transactions
  // ===========================================================================

  /**
   * Add, update, or remove course modules
   * @see ManageModulesTxRequest
   */
  COURSE_TEACHER_MODULES_MANAGE: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    modules_to_add: z.array(
      z.object({
        slts: z.array(z.string()),
        allowed_student_state_ids: z.array(policyIdSchema),
        prereq_slt_hashes: z.array(hashSchema),
      })
    ),
    modules_to_update: z.array(
      z.object({
        slt_hash: hashSchema,
        allowed_student_state_ids: z.array(policyIdSchema),
        prereq_slt_hashes: z.array(hashSchema),
      })
    ),
    modules_to_remove: z.array(z.string()),
    initiator_data: walletDataSchema,
  }),

  /**
   * Assess student assignment submissions
   * @see AssessAssignmentsTxRequest
   */
  COURSE_TEACHER_ASSIGNMENTS_ASSESS: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    assignment_decisions: z.array(
      z.object({
        alias: aliasSchema,
        outcome: z.string(), // API accepts any string, common values: "accept", "refuse"
      })
    ),
    initiator_data: walletDataSchema,
  }),

  // ===========================================================================
  // Course - Student Transactions
  // ===========================================================================

  /**
   * Commit to an assignment (first-time enrollment or subsequent commitment)
   * @see CommitAssignmentTxRequest
   */
  COURSE_STUDENT_ASSIGNMENT_COMMIT: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    slt_hash: hashSchema,
    assignment_info: shortTextSchema,
    initiator_data: walletDataSchema,
  }),

  /**
   * Update assignment submission evidence
   * @see AssignmentActionTxRequest
   */
  COURSE_STUDENT_ASSIGNMENT_UPDATE: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    assignment_info: shortTextSchema,
    initiator_data: walletDataSchema,
  }),

  /**
   * Claim course credential after completing all requirements
   * @see ClaimCourseCredentialsTxRequest
   */
  COURSE_STUDENT_CREDENTIAL_CLAIM: z.object({
    alias: aliasSchema,
    course_id: policyIdSchema,
    initiator_data: walletDataSchema,
  }),

  // ===========================================================================
  // Project - Owner Transactions
  // ===========================================================================

  /**
   * Add or remove managers from a project
   * @see ManageManagersTxRequest
   */
  PROJECT_OWNER_MANAGERS_MANAGE: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    managers_to_add: z.array(aliasSchema),
    managers_to_remove: z.array(aliasSchema),
    initiator_data: walletDataSchema,
  }),

  /**
   * Manage contributor blacklist
   * @see ManageContributorBlacklistTxRequest
   */
  PROJECT_OWNER_BLACKLIST_MANAGE: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    aliases_to_add: z.array(aliasSchema),
    aliases_to_remove: z.array(aliasSchema),
    initiator_data: walletDataSchema,
  }),

  // ===========================================================================
  // Project - Manager Transactions
  // ===========================================================================

  /**
   * Add or remove tasks from a project
   * @see ManageTasksTxRequest
   */
  PROJECT_MANAGER_TASKS_MANAGE: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    contributor_state_id: policyIdSchema,
    tasks_to_add: z.array(
      z.object({
        project_content: shortTextSchema,
        expiration_posix: z.number(),
        lovelace_amount: z.number(),
        native_assets: valueSchema,
      })
    ),
    tasks_to_remove: z.array(
      z.object({
        project_content: shortTextSchema,
        expiration_posix: z.number(),
        lovelace_amount: z.number(),
        native_assets: valueSchema,
      })
    ),
    deposit_value: valueSchema,
    initiator_data: walletDataSchema,
  }),

  /**
   * Assess contributor task submissions
   * @see TasksAssessV2TxRequest
   */
  PROJECT_MANAGER_TASKS_ASSESS: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    contributor_state_id: policyIdSchema,
    task_decisions: z.array(
      z.object({
        alias: aliasSchema,
        outcome: z.string(), // API accepts any string, common values: "accept", "refuse", "deny"
      })
    ),
    initiator_data: walletDataSchema,
  }),

  // ===========================================================================
  // Project - Contributor Transactions
  // ===========================================================================

  /**
   * Commit to a new task in a project
   * @see CommitTaskTxRequest
   */
  PROJECT_CONTRIBUTOR_TASK_COMMIT: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    contributor_state_id: policyIdSchema,
    task_hash: hashSchema,
    task_info: shortTextSchema,
    fee_tier: z.string().optional(),
    initiator_data: walletDataSchema,
  }),

  /**
   * Perform an action on current task (update submission, etc.)
   * @see TaskActionTxRequest
   */
  PROJECT_CONTRIBUTOR_TASK_ACTION: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    project_info: shortTextSchema,
    initiator_data: walletDataSchema,
  }),

  /**
   * Claim credentials for completed project tasks
   * @see ClaimProjectCredentialsTxRequest
   */
  PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    contributor_state_id: policyIdSchema,
    fee_tier: z.string().optional(),
    initiator_data: walletDataSchema,
  }),

  // ===========================================================================
  // Project - User (Treasury) Transactions
  // ===========================================================================

  /**
   * Add funds to project treasury
   * @see AddFundsTxRequest
   */
  PROJECT_USER_TREASURY_ADD_FUNDS: z.object({
    alias: aliasSchema,
    project_id: policyIdSchema,
    deposit_value: valueSchema,
    initiator_data: walletDataSchema,
  }),
} as const satisfies Record<TransactionType, z.ZodObject<z.ZodRawShape>>;

// =============================================================================
// Type Inference
// =============================================================================

/**
 * Inferred TypeScript types for each transaction's parameters
 *
 * @example
 * ```tsx
 * const params: TxParams["COURSE_STUDENT_ASSIGNMENT_COMMIT"] = {
 *   alias: "student1",
 *   course_id: "abc123...",
 *   slt_hash: "def456...",
 *   assignment_info: "My submission hash",
 * };
 * ```
 */
export type TxParams = {
  [K in TransactionType]: z.infer<(typeof txSchemas)[K]>;
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validate transaction parameters and return typed result
 */
export function validateTxParams<T extends TransactionType>(
  txType: T,
  params: unknown
): z.SafeParseReturnType<unknown, TxParams[T]> {
  return txSchemas[txType].safeParse(params) as z.SafeParseReturnType<
    unknown,
    TxParams[T]
  >;
}

/**
 * Get schema for a transaction type
 */
export function getTxSchema<T extends TransactionType>(
  txType: T
): (typeof txSchemas)[T] {
  return txSchemas[txType];
}

/**
 * Parse and validate params, throwing on error
 */
export function parseTxParams<T extends TransactionType>(
  txType: T,
  params: unknown
): TxParams[T] {
  return txSchemas[txType].parse(params) as TxParams[T];
}
