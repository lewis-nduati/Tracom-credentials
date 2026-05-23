/**
 * Auth Error Message Parser
 *
 * Translates authentication error codes and wallet SDK errors into
 * user-friendly messages. Handles errors from:
 * - Session management (JWT expiry, invalid sessions)
 * - Wallet interactions (signing declined, popup blocked)
 * - Registration (alias taken, wallet already registered)
 */

import type { ParsedError, ErrorMapEntry } from "~/types/errors";

/**
 * Known auth error codes and their user-friendly messages
 */
const AUTH_ERROR_MAP: Record<string, ErrorMapEntry> = {
  // Session errors
  SESSION_EXPIRED: {
    message: "Your session has expired. Please sign in again.",
    retryable: true,
  },
  SESSION_INVALID: {
    message: "Your session is invalid. Please reconnect your wallet.",
    retryable: true,
  },
  LOGIN_FAILED: {
    message: "Sign in failed. Please try again.",
    retryable: true,
  },

  // Wallet errors
  USER_DECLINED: {
    message: "You declined to sign. Click to try again when ready.",
    retryable: true,
  },
  POPUP_BLOCKED: {
    message: "Wallet popup was blocked. Please allow popups and try again.",
    retryable: true,
  },
  WALLET_DISCONNECTED: {
    message: "Your wallet was disconnected. Please reconnect to continue.",
    retryable: true,
  },
  WALLET_TIMEOUT: {
    message: "Wallet request timed out. Please try again.",
    retryable: true,
  },
  WALLET_NOT_FOUND: {
    message: "No wallet found. Please install a Cardano wallet extension.",
    retryable: false,
  },

  // Registration errors
  ALIAS_TAKEN: {
    message: "This alias is already taken. Please choose a different one.",
    retryable: false,
  },
  WALLET_REGISTERED: {
    message: "This wallet is already registered with a different alias.",
    retryable: false,
  },
  INVALID_ALIAS: {
    message: "Please enter a valid alias (letters, numbers, and underscores only).",
    retryable: false,
  },

  // JWT errors
  JWT_EXPIRED: {
    message: "Your authentication has expired. Please sign in again.",
    retryable: true,
  },
  JWT_INVALID: {
    message: "Authentication failed. Please reconnect your wallet.",
    retryable: true,
  },

  // Nonce/signature errors
  NONCE_EXPIRED: {
    message: "The signing request expired. Please try again.",
    retryable: true,
  },
  SIGNATURE_INVALID: {
    message: "Wallet signature verification failed. Please try again.",
    retryable: true,
  },
};

/**
 * Wallet SDK error patterns (Nami, Eternl, Lace, Flint, etc.)
 * Each wallet may format errors differently - these patterns normalize them
 */
const WALLET_ERROR_PATTERNS: Array<{ pattern: RegExp; code: string }> = [
  // User declined signing
  { pattern: /user declined|user rejected|declined to sign|user cancel/i, code: "USER_DECLINED" },
  // Popup blocked
  { pattern: /popup.*blocked|blocked.*popup/i, code: "POPUP_BLOCKED" },
  // Wallet disconnected
  { pattern: /no account|wallet.*disconnected|not connected/i, code: "WALLET_DISCONNECTED" },
  // Timeout
  { pattern: /timeout|timed out/i, code: "WALLET_TIMEOUT" },
  // No wallet
  { pattern: /no wallet|wallet not found|extension not found/i, code: "WALLET_NOT_FOUND" },
];

/**
 * Auth-specific error patterns in raw messages
 */
const AUTH_MESSAGE_PATTERNS: Array<{ pattern: RegExp; code: string }> = [
  // Session errors
  { pattern: /session.*expired|expired.*session/i, code: "SESSION_EXPIRED" },
  { pattern: /session.*invalid|invalid.*session/i, code: "SESSION_INVALID" },
  { pattern: /login.*failed|failed.*login/i, code: "LOGIN_FAILED" },
  // JWT errors
  { pattern: /jwt.*expired|token.*expired/i, code: "JWT_EXPIRED" },
  { pattern: /jwt.*invalid|invalid.*token/i, code: "JWT_INVALID" },
  // Registration errors
  { pattern: /alias.*taken|already.*taken/i, code: "ALIAS_TAKEN" },
  { pattern: /wallet.*registered|already.*registered/i, code: "WALLET_REGISTERED" },
  // Signature errors
  { pattern: /nonce.*expired/i, code: "NONCE_EXPIRED" },
  { pattern: /signature.*invalid|invalid.*signature/i, code: "SIGNATURE_INVALID" },
];

/**
 * Check if a message looks like an auth error
 */
export function isAuthError(message: string): boolean {
  // Check wallet patterns
  for (const { pattern } of WALLET_ERROR_PATTERNS) {
    if (pattern.test(message)) return true;
  }
  // Check auth message patterns
  for (const { pattern } of AUTH_MESSAGE_PATTERNS) {
    if (pattern.test(message)) return true;
  }
  // Check for known error codes in the message
  for (const code of Object.keys(AUTH_ERROR_MAP)) {
    if (message.includes(code)) return true;
  }
  return false;
}

/**
 * Parse a raw auth error message into a user-friendly ParsedError
 *
 * @param raw - The raw error message
 * @returns ParsedError with friendly message, or null if not an auth error
 *
 * @example
 * ```ts
 * const parsed = parseAuthErrorMessage("user declined to sign");
 * // { message: "You declined to sign...", code: "USER_DECLINED", retryable: true, domain: "auth" }
 * ```
 */
export function parseAuthErrorMessage(raw: string | null | undefined): ParsedError | null {
  if (!raw) return null;

  // First, check for known error codes in the message
  for (const [code, entry] of Object.entries(AUTH_ERROR_MAP)) {
    if (raw.includes(code)) {
      return {
        message: entry.message,
        code,
        retryable: entry.retryable,
        domain: "auth",
      };
    }
  }

  // Check wallet SDK error patterns
  for (const { pattern, code } of WALLET_ERROR_PATTERNS) {
    if (pattern.test(raw)) {
      const entry = AUTH_ERROR_MAP[code];
      if (entry) {
        return {
          message: entry.message,
          code,
          retryable: entry.retryable,
          domain: "auth",
        };
      }
    }
  }

  // Check auth message patterns
  for (const { pattern, code } of AUTH_MESSAGE_PATTERNS) {
    if (pattern.test(raw)) {
      const entry = AUTH_ERROR_MAP[code];
      if (entry) {
        return {
          message: entry.message,
          code,
          retryable: entry.retryable,
          domain: "auth",
        };
      }
    }
  }

  // Not a recognized auth error
  return null;
}
