/**
 * Unified Andamio Gateway API Client
 *
 * Single client for all Andamio API calls through the unified gateway.
 * Consolidates DB API, Andamioscan, and TX API into one interface.
 *
 * Uses the Next.js API proxy at /api/gateway which forwards to the
 * Unified Andamio API Gateway with the app's API key.
 *
 * @see /src/app/api/gateway/[...path]/route.ts - Proxy implementation
 * @see .claude/skills/audit-api-coverage/unified-api-endpoints.md - Full endpoint list
 */

export const PROXY_BASE = "/api/gateway";

// =============================================================================
// Types
// =============================================================================

/**
 * Gateway API Error
 */
export class GatewayError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

/**
 * Request options for gateway calls (excluding method and body which are handled separately)
 */
export type GatewayRequestOptions = Omit<RequestInit, "method" | "body">;

// =============================================================================
// Error Parsing
// =============================================================================

/** Extract a human-readable message and details from a gateway error response.
 * Handles both ErrorEnvelope shape {error: {code, message, details}} and
 * legacy flat shape {details: "..."}. */
function parseGatewayError(
  response: Response,
  data: unknown
): { message: string; details?: string } {
  const fallbackMessage = `Gateway API error: ${response.status} ${response.statusText}`;

  if (
    data != null &&
    typeof data === "object" &&
    "error" in data &&
    data.error != null &&
    typeof data.error === "object" &&
    "message" in data.error &&
    typeof data.error.message === "string"
  ) {
    const err = data.error as { message: string; details?: unknown };
    return { message: err.message, details: typeof err.details === "string" ? err.details : undefined };
  }

  // Legacy flat shape or unknown structure
  const flat = data as { details?: string; message?: string };
  return { message: fallbackMessage, details: flat?.details ?? flat?.message };
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Make a GET request to the gateway
 *
 * @param path - API path (e.g., "/api/v2/courses" or "/v2/courses/{id}/details")
 * @returns Parsed JSON response
 *
 * @example
 * ```typescript
 * const courses = await gateway<CourseResponse[]>("/api/v2/course/user/courses/list");
 * ```
 */
export async function gateway<T>(path: string): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const parsed = parseGatewayError(response, errorData);
    throw new GatewayError(parsed.message, response.status, parsed.details);
  }

  return response.json() as Promise<T>;
}

/**
 * Make a POST request to the gateway
 *
 * @param path - API path (e.g., "/api/v2/course/owner/course/create")
 * @param body - Request body (will be JSON stringified)
 * @param options - Additional fetch options
 * @returns Parsed JSON response
 *
 * @example
 * ```typescript
 * const result = await gatewayPost<CourseResponse>(
 *   "/api/v2/course/owner/course/create",
 *   { title: "My Course", policy_id: "..." }
 * );
 * ```
 */
export async function gatewayPost<T>(
  path: string,
  body?: unknown,
  options?: GatewayRequestOptions
): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const parsed = parseGatewayError(response, errorData);
    throw new GatewayError(parsed.message, response.status, parsed.details);
  }

  return response.json() as Promise<T>;
}

/**
 * Make an authenticated POST request to the gateway
 *
 * @param path - API path
 * @param jwt - User JWT token
 * @param body - Request body (will be JSON stringified)
 * @param options - Additional fetch options
 * @returns Parsed JSON response
 *
 * @example
 * ```typescript
 * const result = await gatewayAuthPost<CourseResponse>(
 *   "/api/v2/course/owner/course/create",
 *   userJwt,
 *   { title: "My Course", policy_id: "..." }
 * );
 * ```
 */
export async function gatewayAuthPost<T>(
  path: string,
  jwt: string,
  body?: unknown,
  options?: GatewayRequestOptions
): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const parsed = parseGatewayError(response, errorData);
    throw new GatewayError(parsed.message, response.status, parsed.details);
  }

  return response.json() as Promise<T>;
}

/**
 * Make an authenticated GET request to the gateway
 *
 * @param path - API path
 * @param jwt - User JWT token
 * @returns Parsed JSON response
 *
 * @example
 * ```typescript
 * const courses = await gatewayAuth<CourseResponse[]>(
 *   "/api/v2/course/owner/courses/list",
 *   userJwt
 * );
 * ```
 */
export async function gatewayAuth<T>(path: string, jwt: string): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const parsed = parseGatewayError(response, errorData);
    throw new GatewayError(parsed.message, response.status, parsed.details);
  }

  return response.json() as Promise<T>;
}

// =============================================================================
// Validated Gateway Functions (with Zod runtime validation)
// =============================================================================

import type { ZodSchema } from "zod";
import { validateResponse, validateResponseSoft } from "./api-validation";

/**
 * Options for validated gateway calls
 */
export interface ValidatedGatewayOptions {
  /**
   * Use soft validation mode - logs warnings but doesn't throw.
   * Use during migration to identify issues without breaking the app.
   */
  soft?: boolean;
}

/**
 * Make a validated GET request to the gateway
 *
 * @param path - API path
 * @param schema - Zod schema to validate response against
 * @param options - Validation options
 * @returns Validated and typed response
 * @throws ApiValidationError if validation fails (unless soft mode)
 *
 * @example
 * ```typescript
 * import { DashboardResponseWrapperSchema } from "~/lib/api-schemas";
 *
 * const data = await gatewayValidated(
 *   "/v2/user/dashboard",
 *   DashboardResponseWrapperSchema
 * );
 * ```
 */
export async function gatewayValidated<T>(
  path: string,
  schema: ZodSchema<T>,
  options?: ValidatedGatewayOptions
): Promise<T> {
  const data = await gateway<unknown>(path);
  return options?.soft
    ? validateResponseSoft(data, schema, path)
    : validateResponse(data, schema, path);
}

/**
 * Make a validated authenticated GET request to the gateway
 *
 * @param path - API path
 * @param jwt - User JWT token
 * @param schema - Zod schema to validate response against
 * @param options - Validation options
 * @returns Validated and typed response
 * @throws ApiValidationError if validation fails (unless soft mode)
 *
 * @example
 * ```typescript
 * import { DashboardResponseWrapperSchema } from "~/lib/api-schemas";
 *
 * const data = await gatewayAuthValidated(
 *   "/v2/user/dashboard",
 *   jwt,
 *   DashboardResponseWrapperSchema
 * );
 * ```
 */
export async function gatewayAuthValidated<T>(
  path: string,
  jwt: string,
  schema: ZodSchema<T>,
  options?: ValidatedGatewayOptions
): Promise<T> {
  const data = await gatewayAuth<unknown>(path, jwt);
  return options?.soft
    ? validateResponseSoft(data, schema, path)
    : validateResponse(data, schema, path);
}

/**
 * Make a validated POST request to the gateway
 *
 * @param path - API path
 * @param body - Request body
 * @param schema - Zod schema to validate response against
 * @param options - Validation options
 * @returns Validated and typed response
 * @throws ApiValidationError if validation fails (unless soft mode)
 *
 * @example
 * ```typescript
 * import { CourseResponseSchema } from "~/lib/api-schemas";
 *
 * const data = await gatewayPostValidated(
 *   "/v2/course/create",
 *   { title: "My Course" },
 *   CourseResponseSchema
 * );
 * ```
 */
export async function gatewayPostValidated<T>(
  path: string,
  body: unknown,
  schema: ZodSchema<T>,
  options?: ValidatedGatewayOptions
): Promise<T> {
  const data = await gatewayPost<unknown>(path, body);
  return options?.soft
    ? validateResponseSoft(data, schema, path)
    : validateResponse(data, schema, path);
}

/**
 * Make a validated authenticated POST request to the gateway
 *
 * @param path - API path
 * @param jwt - User JWT token
 * @param body - Request body
 * @param schema - Zod schema to validate response against
 * @param options - Validation options
 * @returns Validated and typed response
 * @throws ApiValidationError if validation fails (unless soft mode)
 *
 * @example
 * ```typescript
 * import { CourseResponseSchema } from "~/lib/api-schemas";
 *
 * const data = await gatewayAuthPostValidated(
 *   "/v2/course/owner/course/create",
 *   jwt,
 *   { title: "My Course" },
 *   CourseResponseSchema
 * );
 * ```
 */
export async function gatewayAuthPostValidated<T>(
  path: string,
  jwt: string,
  body: unknown,
  schema: ZodSchema<T>,
  options?: ValidatedGatewayOptions
): Promise<T> {
  const data = await gatewayAuthPost<unknown>(path, jwt, body);
  return options?.soft
    ? validateResponseSoft(data, schema, path)
    : validateResponse(data, schema, path);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if an error is a GatewayError
 */
export function isGatewayError(error: unknown): error is GatewayError {
  return error instanceof GatewayError;
}

/**
 * Check if an error is a 404 Not Found
 */
export function isNotFound(error: unknown): boolean {
  return isGatewayError(error) && error.status === 404;
}

/**
 * Check if an error is a 401 Unauthorized
 */
export function isUnauthorized(error: unknown): boolean {
  return isGatewayError(error) && error.status === 401;
}

/**
 * Check if an error is a 403 Forbidden
 */
export function isForbidden(error: unknown): boolean {
  return isGatewayError(error) && error.status === 403;
}
