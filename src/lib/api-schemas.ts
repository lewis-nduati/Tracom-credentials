/**
 * Zod Schemas for API Response Validation
 *
 * These schemas provide runtime validation for API responses.
 * They match the TypeScript types in ~/types/generated/gateway.ts.
 *
 * Usage:
 * ```typescript
 * import { DashboardResponseWrapperSchema } from "~/lib/api-schemas";
 * import { gatewayAuthValidated } from "~/lib/gateway";
 *
 * const data = await gatewayAuthValidated(
 *   "/v2/user/dashboard",
 *   jwt,
 *   DashboardResponseWrapperSchema
 * );
 * ```
 *
 * @see ~/lib/api-validation.ts - Validation utilities
 * @see ~/lib/gateway.ts - Validated gateway functions
 */

import { z } from "zod";

// =============================================================================
// Common Schemas
// =============================================================================

/**
 * Meta schema for API response metadata
 */
export const MetaSchema = z.object({
  warning: z.string().optional(),
});

// =============================================================================
// Dashboard Schemas
// =============================================================================

export const DashboardCommitmentSummarySchema = z.object({
  course_id: z.string().optional(),
  slt_hash: z.string().optional(),
  status: z.string(),
});

export const DashboardCountsSchema = z.object({
  completed_courses: z.number().optional(),
  contributing_projects: z.number().optional(),
  enrolled_courses: z.number().optional(),
  managing_projects: z.number().optional(),
  pending_project_assessments: z.number().optional(),
  pending_reviews: z.number().optional(),
  teaching_courses: z.number().optional(),
  total_credentials: z.number().optional(),
});

export const DashboardCourseSummarySchema = z.object({
  course_id: z.string(),
  description: z.string().optional(),
  image_url: z.string().optional(),
  title: z.string().optional(),
});

export const DashboardCredentialSummarySchema = z.object({
  course_id: z.string(),
  course_title: z.string().optional(),
  credentials: z.array(z.string()).optional(),
});

export const DashboardPendingAssessmentSummarySchema = z.object({
  count: z.number().optional(),
  project_id: z.string(),
  project_title: z.string().optional(),
});

export const DashboardPendingReviewSummarySchema = z.object({
  count: z.number().optional(),
  course_id: z.string(),
  course_title: z.string().optional(),
});

export const DashboardProjectPrerequisiteSchema = z.object({
  course_id: z.string().optional(),
  slt_hashes: z.array(z.string()).optional(),
});

export const DashboardProjectSummarySchema = z.object({
  description: z.string().optional(),
  image_url: z.string().optional(),
  project_id: z.string(),
  title: z.string().optional(),
});

export const DashboardProjectWithPrereqsSchema = z.object({
  image_url: z.string().optional(),
  prerequisites: z.array(DashboardProjectPrerequisiteSchema).optional(),
  project_id: z.string(),
  qualified: z.boolean().optional(),
  title: z.string().optional(),
});

export const DashboardUserSchema = z.object({
  alias: z.string(),
  wallet_address: z.string().optional(),
});

export const StudentDashboardSchema = z.object({
  commitments: z.array(DashboardCommitmentSummarySchema).optional(),
  completed_courses: z.array(DashboardCourseSummarySchema).optional(),
  credentials_by_course: z.array(DashboardCredentialSummarySchema).optional(),
  enrolled_courses: z.array(DashboardCourseSummarySchema).optional(),
  total_credentials: z.number().optional(),
});

export const TeacherDashboardSchema = z.object({
  courses: z.array(DashboardCourseSummarySchema).optional(),
  pending_reviews: z.array(DashboardPendingReviewSummarySchema).optional(),
  total_pending_reviews: z.number().optional(),
});

export const ProjectsDashboardSchema = z.object({
  contributing: z.array(DashboardProjectSummarySchema).optional(),
  managing: z.array(DashboardProjectSummarySchema).optional(),
  pending_assessments: z.array(DashboardPendingAssessmentSummarySchema).optional(),
  total_pending_assessments: z.number().optional(),
  with_prerequisites: z.array(DashboardProjectWithPrereqsSchema).optional(),
});

export const DashboardResponseSchema = z.object({
  counts: DashboardCountsSchema.optional(),
  projects: ProjectsDashboardSchema.optional(),
  student: StudentDashboardSchema.optional(),
  teacher: TeacherDashboardSchema.optional(),
  user: DashboardUserSchema.optional(),
});

/**
 * Dashboard API response with envelope wrapper
 */
export const DashboardResponseWrapperSchema = z.object({
  data: DashboardResponseSchema,
  meta: MetaSchema.optional(),
});

// =============================================================================
// Type Exports (inferred from schemas)
// =============================================================================

export type DashboardResponseWrapper = z.infer<typeof DashboardResponseWrapperSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
