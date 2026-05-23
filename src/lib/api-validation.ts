/**
 * API Response Validation Utilities
 *
 * Provides runtime validation for API responses using Zod schemas.
 * Catches malformed API data at the boundary before it causes crashes
 * deep in component code.
 *
 * @see ~/lib/api-schemas.ts - Zod schemas for API types
 * @see ~/lib/gateway.ts - Validated gateway functions
 * @see ~/types/errors.ts - ParsedError interface
 */

import { type ZodError, type ZodSchema } from "zod";
import type { ParsedError } from "~/types/errors";

/**
 * Validation error for API responses
 *
 * Thrown when API response doesn't match expected Zod schema.
 * Integrates with the unified error handling system via toParsedError().
 */
export class ApiValidationError extends Error {
  constructor(
    public readonly zodError: ZodError,
    public readonly endpoint: string
  ) {
    super(`API validation failed for ${endpoint}`);
    this.name = "ApiValidationError";
  }

  /**
   * Convert to ParsedError for unified error handling
   */
  toParsedError(): ParsedError {
    // Log detailed errors for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("[Validation Details]:", this.zodError.issues);
    }
    return {
      message: "The server returned unexpected data. Please try again.",
      code: "VALIDATION_ERROR",
      retryable: true,
      domain: "api",
    };
  }
}

/**
 * Type guard for ApiValidationError
 */
export function isApiValidationError(error: unknown): error is ApiValidationError {
  return error instanceof ApiValidationError;
}

/**
 * Validate API response data against Zod schema
 *
 * Throws ApiValidationError if validation fails.
 *
 * @param data - Raw API response data
 * @param schema - Zod schema to validate against
 * @param endpoint - API endpoint (for error messages)
 * @returns Validated and typed data
 * @throws ApiValidationError if validation fails
 *
 * @example
 * ```typescript
 * const data = await response.json();
 * const validated = validateResponse(data, DashboardResponseSchema, "/v2/user/dashboard");
 * ```
 */
export function validateResponse<T>(
  data: unknown,
  schema: ZodSchema<T>,
  endpoint: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    // Always log in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.error(`[API Validation] ${endpoint}:`, result.error.issues);
    }
    throw new ApiValidationError(result.error, endpoint);
  }
  return result.data;
}

/**
 * Soft validation - logs warnings but returns data anyway
 *
 * Use during migration to identify validation issues without breaking
 * the application. Once issues are resolved, switch to strict validation.
 *
 * @param data - Raw API response data
 * @param schema - Zod schema to validate against
 * @param endpoint - API endpoint (for error messages)
 * @returns Data cast to expected type (even if validation fails)
 *
 * @example
 * ```typescript
 * // During migration - logs warnings but doesn't break
 * const data = await gatewayValidated(path, schema, { soft: true });
 *
 * // After migration - throws on validation failures
 * const data = await gatewayValidated(path, schema);
 * ```
 */
export function validateResponseSoft<T>(
  data: unknown,
  schema: ZodSchema<T>,
  endpoint: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn(`[API Validation Warning] ${endpoint}:`, result.error.issues);
  }
  // Return data regardless of validation result
  return data as T;
}
