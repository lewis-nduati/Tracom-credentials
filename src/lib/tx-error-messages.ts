/**
 * Transaction Error Message Parser
 *
 * Translates known API error codes into user-friendly messages.
 * Raw TX errors often contain nested JSON and technical details
 * that are confusing for end users.
 */

/**
 * Known transaction error codes and their user-friendly messages.
 * Add new error codes as they are discovered.
 */
export const TX_ERROR_CODES = [
  "ACCESS_TOKEN_ERROR",
  "INSUFFICIENT_FUNDS",
  "INSUFFICIENT_COLLATERAL",
  "UTXO_BALANCE_INSUFFICIENT",
  "SCRIPT_FAILURE",
  "Transaction API error",
] as const;

/**
 * Check if a message looks like a transaction error
 */
export function isTxError(message: string): boolean {
  for (const code of TX_ERROR_CODES) {
    if (message.includes(code)) return true;
  }
  return false;
}

export const TX_ERROR_MAP: Record<string, string> = {
  ACCESS_TOKEN_ERROR:
    "One or more aliases could not be found on-chain. Verify each alias has an active Andamio access token.",
  INSUFFICIENT_FUNDS: "Insufficient funds in your wallet to complete this transaction.",
  INSUFFICIENT_COLLATERAL:
    "No suitable collateral UTxO found in your wallet. Your wallet needs a small UTxO set aside as collateral to submit smart contract transactions.",
  UTXO_BALANCE_INSUFFICIENT:
    "Your wallet doesn't have enough ADA to cover this transaction. Please add funds.",
  SCRIPT_FAILURE: "The transaction script validation failed. Please try again or contact support.",
  NETWORK_ERROR: "Unable to connect to the blockchain network. Please check your connection.",
  TIMEOUT: "The transaction timed out. Please try again.",
};

/**
 * Check if an error message is about insufficient collateral.
 * Used by UI components to show contextual help links.
 */
export function isCollateralError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("collateral") && (
    lower.includes("no suitable") ||
    lower.includes("insufficient") ||
    lower.includes("not found")
  );
}

/**
 * Parse a raw transaction error message into a user-friendly string.
 *
 * @param raw - The raw error message from the transaction API
 * @returns A user-friendly error message, or the original if no mapping exists
 *
 * @example
 * ```ts
 * const friendly = parseTxErrorMessage(error?.message);
 * // "One or more aliases could not be found on-chain..."
 * ```
 */
export function parseTxErrorMessage(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // First, try to extract a human-readable message from embedded JSON.
  // The gateway returns ErrorEnvelope: {error: {code, message, details}}.
  // After proxy forwarding and use-transaction.ts parsing, the raw string
  // may be a plain sentence (already extracted) or still contain JSON.
  let extractedMessage: string | null = null;

  try {
    const jsonMatch = /\{.*\}/s.exec(raw);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

      // ErrorEnvelope shape: {error: {code, message, details}}
      if (
        parsed.error != null &&
        typeof parsed.error === "object" &&
        "message" in parsed.error &&
        typeof (parsed.error as { message?: unknown }).message === "string"
      ) {
        extractedMessage = (parsed.error as { message: string }).message;
      }

      // Flat shape: {message, details, error}
      if (!extractedMessage) {
        const flat = parsed as { message?: string; details?: string; error?: string };
        if (flat.details && typeof flat.details === "string") {
          // Check if details is nested JSON with a message
          try {
            const nested = JSON.parse(flat.details) as { message?: string };
            if (nested.message) {
              extractedMessage = nested.message;
            }
          } catch {
            extractedMessage = flat.details;
          }
        }
        if (!extractedMessage && typeof flat.message === "string") {
          extractedMessage = flat.message;
        }
        if (!extractedMessage && typeof flat.error === "string") {
          extractedMessage = flat.error;
        }
      }
    }
  } catch {
    // JSON parsing failed, continue to fallbacks
  }

  // If we extracted a gateway message, check for collateral errors before returning
  if (extractedMessage) {
    if (isCollateralError(extractedMessage)) {
      return TX_ERROR_MAP.INSUFFICIENT_COLLATERAL!;
    }
    return extractedMessage;
  }

  // Check for collateral errors in raw string (e.g., "422 - No suitable collateral UTxO found")
  if (isCollateralError(raw)) {
    return TX_ERROR_MAP.INSUFFICIENT_COLLATERAL!;
  }

  // Fall back to TX_ERROR_MAP for raw strings that contain known codes
  // but had no extractable gateway message (e.g., older gateway responses)
  for (const [code, message] of Object.entries(TX_ERROR_MAP)) {
    if (raw.includes(code)) {
      return message;
    }
  }

  return raw;
}
