/**
 * Unified Error Message Parser
 *
 * Central entry point for all error parsing across the application.
 * Auto-detects error domain (tx, auth, api) and routes to appropriate parser.
 *
 * Usage:
 * ```ts
 * import { parseErrorMessage } from "~/lib/error-messages";
 *
 * // Auto-detects domain and parses
 * const parsed = parseErrorMessage(error);
 * // { message: "Friendly message", code: "ERROR_CODE", retryable: true, domain: "auth" }
 * ```
 *
 * @see ~/lib/tx-error-messages.ts - Transaction domain
 * @see ~/lib/auth-error-messages.ts - Auth domain
 * @see ~/lib/api-error-messages.ts - API/Gateway domain
 */

import type { ParsedError } from "~/types/errors";
import { parseTxErrorMessage, isTxError } from "~/lib/tx-error-messages";
import { parseAuthErrorMessage, isAuthError } from "~/lib/auth-error-messages";
import { parseApiErrorMessage, isGatewayError } from "~/lib/api-error-messages";
import { GatewayError } from "~/lib/gateway";
import { ApiValidationError, isApiValidationError } from "~/lib/api-validation";

// Re-export domain-specific parsers for direct use
export { parseTxErrorMessage, isTxError } from "~/lib/tx-error-messages";
export { parseAuthErrorMessage, isAuthError } from "~/lib/auth-error-messages";
export { parseApiErrorMessage, isGatewayError } from "~/lib/api-error-messages";
export { ApiValidationError, isApiValidationError } from "~/lib/api-validation";

// Re-export types
export type { ParsedError, ErrorDomain, ErrorInput, ErrorMapEntry } from "~/types/errors";

/**
 * Unified error parser that auto-detects domain
 *
 * Domain detection order:
 * 1. GatewayError → API domain
 * 2. TX error patterns → TX domain
 * 3. Auth error patterns → Auth domain
 * 4. Fallback → API domain (generic handling)
 *
 * @param error - The raw error (string, Error, GatewayError, or unknown)
 * @returns ParsedError with friendly message, or null if not parseable
 *
 * @example
 * ```ts
 * // GatewayError (API domain)
 * const gatewayErr = new GatewayError("Gateway API error: 403", 403);
 * parseErrorMessage(gatewayErr);
 * // { message: "You don't have permission...", domain: "api" }
 *
 * // Auth error (wallet declined)
 * parseErrorMessage(new Error("user declined to sign"));
 * // { message: "You declined to sign...", domain: "auth" }
 *
 * // TX error
 * parseErrorMessage(new Error("INSUFFICIENT_FUNDS"));
 * // { message: "Insufficient funds...", domain: "tx" }
 * ```
 */
export function parseErrorMessage(error: unknown): ParsedError | null {
  if (!error) return null;

  // Check for ApiValidationError (API domain - malformed response data)
  if (error instanceof ApiValidationError) {
    return error.toParsedError();
  }

  // Check for GatewayError (API domain)
  if (error instanceof GatewayError) {
    return parseApiErrorMessage(error);
  }

  // Check for Error with message
  if (error instanceof Error) {
    const message = error.message;

    // Detect TX errors by known patterns
    if (isTxError(message)) {
      const parsed = parseTxErrorMessage(message);
      if (parsed) {
        return {
          message: parsed,
          retryable: false,
          domain: "tx",
        };
      }
    }

    // Detect auth errors by patterns
    if (isAuthError(message)) {
      const parsed = parseAuthErrorMessage(message);
      if (parsed) {
        return parsed;
      }
    }

    // Default to API error parsing (catches generic errors)
    return parseApiErrorMessage(error);
  }

  // Handle string input
  if (typeof error === "string") {
    // Detect TX errors
    if (isTxError(error)) {
      const parsed = parseTxErrorMessage(error);
      if (parsed) {
        return {
          message: parsed,
          retryable: false,
          domain: "tx",
        };
      }
    }

    // Detect auth errors
    if (isAuthError(error)) {
      const parsed = parseAuthErrorMessage(error);
      if (parsed) {
        return parsed;
      }
    }

    // Wrap in Error and parse as API
    return parseApiErrorMessage(new Error(error));
  }

  // Unknown error type - return generic message
  return {
    message: "An unexpected error occurred. Please try again.",
    retryable: true,
    domain: "unknown",
  };
}

/**
 * Get just the message from an error (convenience function)
 *
 * @param error - The raw error
 * @returns User-friendly message string, or null
 */
export function getErrorMessage(error: unknown): string | null {
  const parsed = parseErrorMessage(error);
  return parsed?.message ?? null;
}

/**
 * Check if an error is retryable
 *
 * @param error - The raw error
 * @returns true if user should retry, false otherwise
 */
export function isRetryableError(error: unknown): boolean {
  const parsed = parseErrorMessage(error);
  return parsed?.retryable ?? false;
}
