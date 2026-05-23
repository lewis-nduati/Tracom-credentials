/**
 * API Error Message Parser
 *
 * Translates HTTP status codes and API error codes into user-friendly messages.
 * Handles errors from:
 * - Gateway API calls (GatewayError)
 * - Generic fetch errors
 * - Network errors
 */

import type { ParsedError, ErrorMapEntry } from "~/types/errors";
import { GatewayError } from "~/lib/gateway";

/**
 * HTTP status code to user-friendly message mapping
 */
const HTTP_STATUS_MAP: Record<number, ErrorMapEntry> = {
  400: {
    message: "The request was invalid. Please check your input and try again.",
    retryable: false,
  },
  401: {
    message: "You need to sign in to access this resource.",
    retryable: true,
  },
  403: {
    message: "You don't have permission to access this resource.",
    retryable: false,
  },
  404: {
    message: "The requested resource was not found.",
    retryable: false,
  },
  409: {
    message: "This action conflicts with another operation. Please refresh and try again.",
    retryable: true,
  },
  422: {
    message: "The provided data is invalid. Please check and try again.",
    retryable: false,
  },
  429: {
    message: "Too many requests. Please wait a moment before trying again.",
    retryable: true,
  },
  500: {
    message: "Something went wrong on our end. Please try again later.",
    retryable: true,
  },
  502: {
    message: "The service is temporarily unavailable. Please try again in a moment.",
    retryable: true,
  },
  503: {
    message: "The service is under maintenance. Please try again later.",
    retryable: true,
  },
  504: {
    message: "The request timed out. Please check your connection and try again.",
    retryable: true,
  },
};

/**
 * Known API error codes and their user-friendly messages
 */
const API_ERROR_MAP: Record<string, ErrorMapEntry> = {
  // Network errors
  NETWORK_ERROR: {
    message: "Unable to connect to the server. Please check your internet connection.",
    retryable: true,
  },
  // Image upload errors
  UPLOAD_NOT_CONFIGURED: {
    message: "Image upload is not available. Please contact support.",
    retryable: false,
  },
  NO_FILE: {
    message: "No file was selected for upload.",
    retryable: false,
  },
  INVALID_TYPE: {
    message: "Only PNG, JPEG, GIF, and WebP images are supported.",
    retryable: false,
  },
  FILE_TOO_LARGE: {
    message: "Image is too large. Maximum size is 5MB.",
    retryable: false,
  },
  UPLOAD_FAILED: {
    message: "Failed to upload image. Please try again.",
    retryable: true,
  },
  FETCH_ERROR: {
    message: "Failed to connect to the server. Please check your connection.",
    retryable: true,
  },
  VALIDATION_ERROR: {
    message: "Some of the provided information is invalid. Please check and try again.",
    retryable: false,
  },
  RATE_LIMITED: {
    message: "Too many requests. Please wait a moment before trying again.",
    retryable: true,
  },
  TIMEOUT: {
    message: "The request timed out. Please try again.",
    retryable: true,
  },
  PARSE_ERROR: {
    message: "Received an invalid response from the server. Please try again.",
    retryable: true,
  },
};

/**
 * API error patterns in raw messages
 */
const API_MESSAGE_PATTERNS: Array<{ pattern: RegExp; code: string }> = [
  { pattern: /network.*error|failed.*fetch|fetch.*failed/i, code: "NETWORK_ERROR" },
  { pattern: /timeout|timed out/i, code: "TIMEOUT" },
  { pattern: /rate.*limit|too many requests/i, code: "RATE_LIMITED" },
  { pattern: /validation.*error|invalid.*input/i, code: "VALIDATION_ERROR" },
  { pattern: /json.*parse|parse.*error|unexpected token/i, code: "PARSE_ERROR" },
];

/**
 * Check if an error is a GatewayError
 */
export function isGatewayError(error: unknown): error is GatewayError {
  return error instanceof GatewayError;
}

/**
 * Check if a message looks like an API error
 */
export function isApiError(message: string): boolean {
  // Check for Gateway API error pattern
  if (message.includes("Gateway API error")) return true;
  // Check API message patterns
  for (const { pattern } of API_MESSAGE_PATTERNS) {
    if (pattern.test(message)) return true;
  }
  // Check for HTTP status patterns
  if (/\b(4\d{2}|5\d{2})\b/.test(message)) return true;
  return false;
}

/**
 * Extract HTTP status code from an error
 */
function extractStatusCode(error: unknown): number | null {
  if (isGatewayError(error)) {
    return error.status;
  }
  if (error instanceof Error) {
    // Try to extract from message like "Gateway API error: 403"
    const match = /\b(4\d{2}|5\d{2})\b/.exec(error.message);
    if (match?.[1]) {
      return parseInt(match[1], 10);
    }
  }
  return null;
}

/**
 * Get a code string for the status
 */
function getStatusCode(status: number): string {
  return `HTTP_${status}`;
}

/**
 * Parse a raw API error into a user-friendly ParsedError
 *
 * @param error - The raw error (GatewayError, Error, or unknown)
 * @returns ParsedError with friendly message, or null if not parseable
 *
 * @example
 * ```ts
 * const error = new GatewayError("Gateway API error: 403", 403);
 * const parsed = parseApiErrorMessage(error);
 * // { message: "You don't have permission...", code: "HTTP_403", retryable: false, domain: "api" }
 * ```
 */
export function parseApiErrorMessage(error: unknown): ParsedError | null {
  if (!error) return null;

  // Handle GatewayError with status code
  if (isGatewayError(error)) {
    const statusEntry = HTTP_STATUS_MAP[error.status];
    if (statusEntry) {
      return {
        message: statusEntry.message,
        code: getStatusCode(error.status),
        retryable: statusEntry.retryable,
        domain: "api",
      };
    }
    // Unknown status, return generic message
    return {
      message: "An error occurred. Please try again.",
      code: getStatusCode(error.status),
      retryable: true,
      domain: "api",
    };
  }

  // Handle Error with message
  if (error instanceof Error) {
    const message = error.message;

    // Try to extract status code
    const status = extractStatusCode(error);
    if (status) {
      const statusEntry = HTTP_STATUS_MAP[status];
      if (statusEntry) {
        return {
          message: statusEntry.message,
          code: getStatusCode(status),
          retryable: statusEntry.retryable,
          domain: "api",
        };
      }
    }

    // Check for known error codes in message
    for (const [code, entry] of Object.entries(API_ERROR_MAP)) {
      if (message.includes(code)) {
        return {
          message: entry.message,
          code,
          retryable: entry.retryable,
          domain: "api",
        };
      }
    }

    // Check API message patterns
    for (const { pattern, code } of API_MESSAGE_PATTERNS) {
      if (pattern.test(message)) {
        const entry = API_ERROR_MAP[code];
        if (entry) {
          return {
            message: entry.message,
            code,
            retryable: entry.retryable,
            domain: "api",
          };
        }
      }
    }

    // Generic error fallback - don't expose raw message
    return {
      message: "An error occurred. Please try again.",
      retryable: true,
      domain: "api",
    };
  }

  // Handle string input
  if (typeof error === "string") {
    return parseApiErrorMessage(new Error(error));
  }

  return null;
}
