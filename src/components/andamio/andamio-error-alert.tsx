"use client";

import * as React from "react";
import {
  AndamioAlert,
  AndamioAlertTitle,
  AndamioAlertDescription,
} from "./andamio-alert";
import { AndamioButton } from "./andamio-button";
import { AlertIcon } from "~/components/icons";
import { parseErrorMessage, type ParsedError } from "~/lib/error-messages";

export interface AndamioErrorAlertProps {
  /**
   * The error to display.
   * Can be a pre-parsed string, an Error object, GatewayError, or any unknown error.
   * Will be automatically parsed into a user-friendly message.
   */
  error: unknown;
  /** Optional title override (default: "Error") */
  title?: string;
  /** Optional retry handler - only shown for retryable errors */
  onRetry?: () => void;
  /** Show error code for support purposes (default: false) */
  showCode?: boolean;
  /** Optional className for the alert container */
  className?: string;
}

/**
 * AndamioErrorAlert - Standardized error alert with auto-parsing
 *
 * Automatically parses raw errors into user-friendly messages.
 * Supports retry actions for retryable errors.
 *
 * @example
 * // Basic usage with string (backward compatible)
 * {error && <AndamioErrorAlert error={error} />}
 *
 * @example
 * // With raw Error object (auto-parsed)
 * <AndamioErrorAlert error={apiError} />
 *
 * @example
 * // With retry handler
 * <AndamioErrorAlert error={error} onRetry={() => refetch()} />
 *
 * @example
 * // Show error code for support
 * <AndamioErrorAlert error={error} showCode />
 */
function AndamioErrorAlert({
  error,
  title = "Error",
  onRetry,
  showCode = false,
  className,
}: AndamioErrorAlertProps) {
  // Parse the error into a user-friendly message
  const parsed: ParsedError | null = React.useMemo(() => {
    if (!error) return null;

    // If already a string, wrap it as a parsed error
    if (typeof error === "string") {
      return {
        message: error,
        retryable: false,
        domain: "unknown" as const,
      };
    }

    // Parse other error types
    return parseErrorMessage(error);
  }, [error]);

  // Don't render if no error
  if (!parsed) return null;

  return (
    <AndamioAlert variant="destructive" className={className}>
      <AlertIcon className="h-4 w-4" />
      <div className="flex-1">
        <AndamioAlertTitle>{title}</AndamioAlertTitle>
        <AndamioAlertDescription>
          {parsed.message}
          {showCode && parsed.code && (
            <span className="block mt-1 text-xs opacity-70">
              Error code: {parsed.code}
            </span>
          )}
        </AndamioAlertDescription>
      </div>
      {onRetry && parsed.retryable && (
        <AndamioButton
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-auto shrink-0"
        >
          Try Again
        </AndamioButton>
      )}
    </AndamioAlert>
  );
}

export { AndamioErrorAlert };
