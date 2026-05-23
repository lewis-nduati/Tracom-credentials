/**
 * API Utilities
 *
 * Standardized error handling and response parsing for Andamio API calls.
 * Eliminates inconsistent error handling patterns across the codebase.
 */

/**
 * Standardized API error response structure
 */
export interface ApiErrorResponse {
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

/**
 * Parse error response from API
 *
 * Handles various error response formats consistently.
 *
 * @example
 * ```tsx
 * if (!response.ok) {
 *   const error = await parseApiError(response);
 *   throw new Error(error.message ?? "Request failed");
 * }
 * ```
 */
export async function parseApiError(
  response: Response
): Promise<ApiErrorResponse> {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    return {
      message: data.message ?? response.statusText,
      code: data.code,
      details: data.details,
      statusCode: response.status,
    };
  } catch {
    // JSON parsing failed - return generic error
    return {
      message: response.statusText || "An unexpected error occurred",
      statusCode: response.status,
    };
  }
}

/**
 * Build API URL with query parameters
 *
 * @example
 * ```tsx
 * const url = buildApiUrl("/courses/list", { limit: 10, offset: 0 });
 * // => "http://localhost:4000/api/v0/courses/list?limit=10&offset=0"
 * ```
 */
export function buildApiUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  // Use gateway proxy for API calls
  const baseUrl = "/api/gateway/api/v2";
  const url = new URL(`${baseUrl}${endpoint}`, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Type guard to check if an error is an ApiErrorResponse
 */
export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    ("message" in error || "code" in error || "statusCode" in error)
  );
}

/**
 * Extract user-friendly error message
 *
 * Falls back to generic message if error structure is unexpected.
 */
export function getErrorMessage(error: unknown, fallback = "An error occurred"): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isApiError(error)) {
    return error.message ?? fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}

// =============================================================================
// API Request Helpers
// =============================================================================

/**
 * Gateway API base path
 */
export const GATEWAY_API_BASE = "/api/gateway/api/v2";

/**
 * Options for API requests
 */
export interface ApiRequestOptions {
  /** Request body (for POST) */
  body?: unknown;
  /** Custom error message prefix */
  errorPrefix?: string;
  /** Whether to treat 404 as empty result instead of error */
  treat404AsEmpty?: boolean;
}

/**
 * Standard API error class with structured error info
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Make an authenticated POST request to the Gateway API
 *
 * This helper reduces boilerplate in mutation hooks by standardizing:
 * - Content-Type headers
 * - Error handling
 * - Response parsing
 *
 * @example
 * ```tsx
 * const response = await authenticatedPost(
 *   authenticatedFetch,
 *   "/course/teacher/course-module/create",
 *   { course_id: "...", course_module_code: "101" },
 *   { errorPrefix: "Failed to create module" }
 * );
 * ```
 */
export async function authenticatedPost<T>(
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>,
  endpoint: string,
  body: unknown,
  options: Omit<ApiRequestOptions, "body"> = {}
): Promise<T> {
  const { errorPrefix = "API request failed", treat404AsEmpty = false } = options;
  const url = `${GATEWAY_API_BASE}${endpoint}`;

  const response = await authenticatedFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (treat404AsEmpty && response.status === 404) {
    return [] as T;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { message?: string; details?: string };
    const errorMessage = errorData.message ?? errorData.details ?? response.statusText;
    throw new ApiError(`${errorPrefix}: ${errorMessage}`, response.status, errorData.details);
  }

  return response.json() as Promise<T>;
}

/**
 * Make an unauthenticated GET request to the Gateway API
 *
 * @example
 * ```tsx
 * const data = await gatewayGet<CourseListResponse>(
 *   "/course/user/courses/list",
 *   { errorPrefix: "Failed to fetch courses", treat404AsEmpty: true }
 * );
 * ```
 */
export async function gatewayGet<T>(
  endpoint: string,
  options: Omit<ApiRequestOptions, "body"> = {}
): Promise<T> {
  const { errorPrefix = "API request failed", treat404AsEmpty = false } = options;
  const url = `${GATEWAY_API_BASE}${endpoint}`;

  const response = await fetch(url);

  if (treat404AsEmpty && response.status === 404) {
    return [] as T;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { message?: string; details?: string };
    const errorMessage = errorData.message ?? errorData.details ?? response.statusText;
    throw new ApiError(`${errorPrefix}: ${errorMessage}`, response.status, errorData.details);
  }

  return response.json() as Promise<T>;
}
