/**
 * Public credential verification helpers.
 *
 * A credential is identified the same way Andamio's badge renderer identifies
 * one: `<policy_id>.<asset_name_hex>`. Keeping the format identical means a
 * badge URL and a Tracom verification URL carry the same token, so a link can
 * be rewritten from one to the other without a lookup.
 *
 * Everything here is pure. Network calls live in `koios.ts`.
 */

/** A parsed reference to one on-chain credential. */
export interface CredentialRef {
  /** Minting policy, 56 lowercase hex characters. */
  policyId: string;
  /** Asset name as lowercase hex, 2 to 64 characters, even length. */
  assetNameHex: string;
}

/** Cardano policy IDs are Blake2b-224 hashes: 28 bytes, 56 hex characters. */
const POLICY_ID_LENGTH = 56;

/** Cardano asset names are 0 to 32 bytes. We reject empty ones. */
const ASSET_NAME_MAX_HEX = 64;

const HEX_ONLY = /^[0-9a-f]+$/;

function isHex(value: string): boolean {
  return HEX_ONLY.test(value);
}

/**
 * Pull a credential reference out of whatever an employer pasted.
 *
 * Accepts the bare `policyId.assetNameHex` token, a Tracom verification URL,
 * an Andamio badge URL (with or without the `.svg` suffix), and any of those
 * with surrounding whitespace or a trailing slash. Case is normalised.
 *
 * Returns null rather than throwing, because the caller is a form and the
 * user is a stranger who should get a message, not an error page.
 */
export function parseCredentialRef(input: string): CredentialRef | null {
  if (typeof input !== "string") return null;

  let text = input.trim().toLowerCase();
  if (text === "") return null;

  // Strip a query string or fragment before looking for the token.
  text = text.split(/[?#]/)[0] ?? "";

  // Drop a trailing slash so ".../verify/<token>/" still resolves.
  if (text.endsWith("/")) text = text.slice(0, -1);

  // A URL contributes only its last path segment.
  const lastSegment = text.includes("/")
    ? (text.split("/").pop() ?? "")
    : text;
  if (lastSegment === "") return null;

  // Andamio renders badges as `<policy>.<asset>.svg`. Drop a known image
  // extension, but only that — an unrecognised third part is a malformed
  // token, not something to guess at.
  const withoutExtension = lastSegment.endsWith(".svg")
    ? lastSegment.slice(0, -".svg".length)
    : lastSegment;

  const parts = withoutExtension.split(".");
  if (parts.length !== 2) return null;

  const [policyId, assetNameHex] = parts as [string, string];

  if (policyId.length !== POLICY_ID_LENGTH || !isHex(policyId)) return null;

  if (
    assetNameHex.length === 0 ||
    assetNameHex.length > ASSET_NAME_MAX_HEX ||
    assetNameHex.length % 2 !== 0 ||
    !isHex(assetNameHex)
  ) {
    return null;
  }

  return { policyId, assetNameHex };
}

/** The canonical `<policy>.<asset>` token for a reference. */
export function formatCredentialRef(ref: CredentialRef): string {
  return `${ref.policyId}.${ref.assetNameHex}`;
}

/** Path to this credential's verification page on our own domain. */
export function verifyPath(ref: CredentialRef): string {
  return `/verify/${formatCredentialRef(ref)}`;
}

/**
 * Andamio's rendered badge for this credential.
 *
 * This is a presentation surface on Andamio's infrastructure, not a proof we
 * generate. The UI should say so rather than implying we produced it.
 */
export function andamioBadgeUrl(ref: CredentialRef): string {
  return `https://credentials.andamio.io/badges/${formatCredentialRef(ref)}.svg`;
}

/**
 * Decode an asset name to text, when it is text.
 *
 * Andamio writes readable ASCII asset names for some token types and raw
 * hashes for others. Returns null when the bytes are not printable ASCII, so
 * the caller can fall back to showing hex instead of mojibake.
 */
export function decodeAssetName(assetNameHex: string): string | null {
  if (assetNameHex.length === 0 || assetNameHex.length % 2 !== 0) return null;
  if (!isHex(assetNameHex.toLowerCase())) return null;

  let out = "";
  for (let i = 0; i < assetNameHex.length; i += 2) {
    const byte = Number.parseInt(assetNameHex.slice(i, i + 2), 16);
    // Printable ASCII only. Anything else means this is a hash, not a name.
    if (byte < 0x20 || byte > 0x7e) return null;
    out += String.fromCharCode(byte);
  }
  return out;
}

/**
 * Shorten a long hex string for display: first and last `edge` characters
 * with an ellipsis between. Strings short enough to read are returned intact.
 */
export function shortenHex(value: string, edge = 8): string {
  if (edge <= 0) return value;
  if (value.length <= edge * 2 + 1) return value;
  return `${value.slice(0, edge)}…${value.slice(-edge)}`;
}
