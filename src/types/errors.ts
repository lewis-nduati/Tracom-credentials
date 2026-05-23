/**
 * Unified Error Types
 *
 * Shared types for the error parsing system across all domains.
 *
 * @see ~/lib/error-messages.ts - Unified entry point
 * @see ~/lib/auth-error-messages.ts - Auth domain parser
 * @see ~/lib/api-error-messages.ts - API domain parser
 * @see ~/lib/tx-error-messages.ts - Transaction domain parser
 */

/**
 * Error domains for categorization
 */
export type ErrorDomain = "tx" | "auth" | "api" | "unknown";

/**
 * Parsed error with user-friendly message and metadata
 */
export interface ParsedError {
  /** User-friendly message to display */
  message: string;
  /** Error code for support/debugging (e.g., "AUTH_SESSION_EXPIRED") */
  code?: string;
  /** Whether the user should retry the action */
  retryable: boolean;
  /** Which parser handled this error */
  domain: ErrorDomain;
}

/**
 * Input types that can be parsed into a ParsedError
 */
export type ErrorInput = string | Error | null | undefined;

/**
 * Error map entry for domain-specific error codes
 */
export interface ErrorMapEntry {
  /** User-friendly message */
  message: string;
  /** Whether this error is retryable */
  retryable: boolean;
}
