/**
 * Access Token Utilities
 *
 * Helper functions for working with Andamio Access Token NFTs
 */

import { env } from "~/env";

/** V2 access token policy ID (current). */
export const V2_ACCESS_TOKEN_POLICY_ID = env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID;

/**
 * V1 access token policy ID (legacy).
 * V1 tokens can be migrated to V2 via the registration flow.
 */
export const V1_ACCESS_TOKEN_POLICY_ID =
  "e760308d0c14096ff479ec5f2495455505feb790503903fe976c4fd2";

/** V1 token name prefix length — V1 uses a 3-character prefix (legacy format). */
export const V1_ACCESS_TOKEN_PREFIX_LENGTH = 3;

/**
 * Convert a string to hexadecimal.
 * Required for CIP-30 wallet.signData() which expects hex-encoded payloads.
 */
export function stringToHex(str: string): string {
  return str
    .split("")
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert hexadecimal to string
 */
export function hexToString(hex: string): string {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

/**
 * Build the full access token unit (policy ID + hex-encoded name)
 * Required for Andamioscan API requests
 *
 * @param alias - The user's access token alias (plain text)
 * @param policyId - The access token policy ID
 * @param prefix - Token name prefix (default: "u" for user tokens, "g" for group tokens)
 * @returns Full asset unit (policy ID + hex name)
 *
 * @example
 * ```typescript
 * const unit = buildAccessTokenUnit("CMI663VI", "c76c35088ac826c8...");
 * // Returns: "c76c35088ac826c8...75434d49363633564"
 * //          (policy ID + hex("uCMI663VI"))
 * ```
 */
export function buildAccessTokenUnit(
  alias: string,
  policyId: string,
  prefix = "u"
): string {
  // Build token name: prefix + alias
  const tokenName = prefix + alias;

  // Convert to hex
  const hexName = stringToHex(tokenName);

  // Return full unit
  return policyId + hexName;
}

/**
 * Extract the alias from a full access token unit
 *
 * @param unit - Full asset unit (policy ID + hex name)
 * @param policyId - The access token policy ID
 * @param prefixLength - Length of the prefix (default: 1 character for "u" or "g")
 * @returns The plain text alias
 *
 * @example
 * ```typescript
 * const alias = extractAliasFromUnit(
 *   "c76c35088ac826c8...75434d49363633564",
 *   "c76c35088ac826c8..."
 * );
 * // Returns: "CMI663VI"
 * ```
 */
export function extractAliasFromUnit(
  unit: string,
  policyId: string,
  prefixLength = 1
): string {
  // Remove policy ID to get hex name
  const hexName = unit.replace(policyId, "");

  // Convert hex to string
  const tokenName = hexToString(hexName);

  // Remove prefix (first character)
  const alias = tokenName.slice(prefixLength);

  return alias;
}
