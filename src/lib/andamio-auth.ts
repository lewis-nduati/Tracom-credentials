import { env } from "~/env";
import { authLogger } from "~/lib/debug-logger";
import { extractAliasFromUnit } from "~/lib/access-token-utils";
import { withTimeout } from "~/lib/promise-utils";
import type { SecureLoginResponse } from "~/types/generated";

/**
 * Andamio Authentication Service (V2)
 *
 * Handles wallet-based authentication with Andamio APIs.
 *
 * Two auth flows are supported:
 *
 * 1. DEVELOPER AUTH (for users with access tokens):
 *    - POST /api/v2/auth/developer/account/login with {alias, wallet_address} → JWT
 *    - Requires alias from access token
 *    - Simpler, no nonce signing required
 *    - **SECURITY**: No cryptographic verification - just alias/address lookup
 *
 * 2. USER AUTH (fallback for users without access tokens):
 *    - POST /api/v2/auth/login/session → get nonce
 *    - Sign nonce with wallet
 *    - POST /api/v2/auth/login/validate → get JWT
 *    - Works for any wallet, no access token required
 *    - **SECURITY**: CIP-30 compliant with cryptographic proof of wallet ownership
 *
 * The authenticateWithWallet() function automatically chooses
 * the appropriate flow based on whether an access token is detected.
 *
 * **IMPORTANT FOR BROWSER APPS**: The hybrid approach is secure because:
 * - If developer auth fails (e.g., alias doesn't match address), we fall back to user auth
 * - User auth requires wallet signature, providing cryptographic verification
 * - An attacker cannot spoof another user's wallet by providing wrong alias/address
 */

export interface LoginSession {
  id: string;
  nonce: string;
  expires_at: string;
}

export interface WalletSignature {
  signature: string;
  key: string;
}

export interface AuthUser {
  id: string;
  cardanoBech32Addr: string | null;
  accessTokenAlias: string | null;
}

export interface AuthResponse {
  jwt: string;
  user: AuthUser;
}

/**
 * Reasons logout() can be invoked. Required at every call site so we can
 * distinguish user-initiated sign-out from automatic disconnects in the
 * field. Tracked under the JWT-expiry-wallet-disconnect investigation
 * (docs/plans/2026-04-28-002-fix-jwt-expiry-wallet-disconnect-plan.md, Unit A0).
 */
export type LogoutReason =
  | "sign_out"            // user clicked Sign Out
  | "jwt_expired"         // authenticatedFetch detected expired JWT (bug under investigation)
  | "wallet_switch"       // wallet-switch detection fired
  | "registration_cancel" // user cancelled registration flow
  | "access_token_mint";  // auto-logout after minting access token (forces wallet reconnect with new JWT)

/**
 * Retry-aware fetch for gateway calls.
 * Retries up to `maxRetries` times on 5xx responses with linear backoff.
 * Each attempt gets its own fresh timeout via `withTimeout`.
 * Does NOT retry on 4xx, timeout, or network errors.
 */
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

async function fetchWithRetry(
  input: string,
  init: RequestInit,
  timeoutMs: number,
  label: string,
  maxRetries = 2,
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await withTimeout(fetch(input, init), timeoutMs, label);
    if (response.ok || !RETRYABLE_STATUSES.has(response.status)) {
      return response;
    }
    authLogger.warn(`Retry ${attempt + 1}/${maxRetries} for ${label} after ${response.status}`);
    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
  }
  // Final attempt — return whatever we get, no more retries
  return withTimeout(fetch(input, init), timeoutMs, label);
}

// Use proxy for API calls to include the API key
// All auth requests go through the local proxy which adds X-API-Key header
const API_PROXY = "/api/gateway";

// The gateway returns errors in two shapes:
//   - Flat:   {message: "..."} or {error: "..."}
//   - Nested: {error: {code: "...", message: "..."}}
// Without handling the nested shape, `new Error(body.error)` coerces the inner
// object to "[object Object]" and the real message is lost.
function extractGatewayErrorMessage(body: unknown, fallback: string): string {
  if (body === null || typeof body !== "object") return fallback;
  const b = body as Record<string, unknown>;
  if (typeof b.message === "string") return b.message;
  if (typeof b.error === "string") return b.error;
  if (b.error !== null && typeof b.error === "object") {
    const inner = b.error as Record<string, unknown>;
    if (typeof inner.message === "string") return inner.message;
  }
  if (typeof b.details === "string") return b.details;
  return fallback;
}

// =============================================================================
// DEVELOPER AUTH (for API key management)
// =============================================================================

/**
 * Developer registration session response
 */
export interface DevRegisterSession {
  session_id: string;
  nonce: string;
  expires_at: string;
}

/**
 * Developer registration result (after completing with signature)
 */
export interface DevRegisterResult {
  user_id: string;
  alias: string;
  tier: string;
  subscription_expiration: string;
}

/**
 * Step 1: Create a developer registration session
 *
 * Returns a nonce that must be signed with the user's wallet to prove ownership.
 * The session expires after 5 minutes.
 *
 * **IMPORTANT**: Requires End User JWT authentication. Users must be signed in
 * via the standard wallet auth flow before registering as developers.
 *
 * @param alias - The desired username/alias (1-64 characters)
 * @param email - The user's email address
 * @param walletAddress - The user's wallet address in bech32 format (must match JWT)
 * @param endUserJwt - End User JWT from standard wallet authentication
 * @returns Session with nonce to sign
 */
export async function createDevRegisterSession(params: {
  alias: string;
  email: string;
  walletAddress: string;
  endUserJwt: string;
}): Promise<DevRegisterSession> {
  authLogger.info("Creating developer registration session for alias:", params.alias);

  const response = await withTimeout(
    fetch(`${API_PROXY}/api/v2/auth/developer/register/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${params.endUserJwt}`,
      },
      body: JSON.stringify({
        alias: params.alias,
        email: params.email,
        wallet_address: params.walletAddress,
      }),
    }),
    15_000,
    "Developer registration session",
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { code?: string } & Record<string, unknown>;
    authLogger.error("Developer registration session failed:", {
      status: response.status,
      error,
    });

    // Provide user-friendly error messages for known error codes
    if (error.code === "alias_already_exists") {
      throw new Error("This alias is already taken. Please choose a different one.");
    }
    if (error.code === "wallet_address_already_registered") {
      throw new Error("This wallet is already registered. Try logging in instead.");
    }

    throw new Error(extractGatewayErrorMessage(error, "Failed to create registration session"));
  }

  const apiResponse = (await response.json()) as {
    session_id: string;
    nonce: string;
    expires_at: string;
  };

  authLogger.info("Developer registration session created, nonce received");

  return {
    session_id: apiResponse.session_id,
    nonce: apiResponse.nonce,
    expires_at: apiResponse.expires_at,
  };
}

/**
 * Step 2: Complete developer registration with wallet signature
 *
 * Verifies the CIP-30 signature and creates the developer account.
 *
 * **IMPORTANT**: Requires End User JWT authentication (same as step 1).
 *
 * @param sessionId - The session ID from createDevRegisterSession
 * @param signature - The CIP-30 wallet signature of the nonce
 * @param endUserJwt - End User JWT from standard wallet authentication
 * @returns Registration result with user info
 */
export async function completeDevRegistration(params: {
  sessionId: string;
  signature: WalletSignature;
  endUserJwt: string;
}): Promise<DevRegisterResult> {
  authLogger.info("Completing developer registration with signature");

  const response = await withTimeout(
    fetch(`${API_PROXY}/api/v2/auth/developer/register/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${params.endUserJwt}`,
      },
      body: JSON.stringify({
        session_id: params.sessionId,
        signature: {
          signature: params.signature.signature,
          key: params.signature.key,
        },
      }),
    }),
    15_000,
    "Developer registration completion",
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { code?: string } & Record<string, unknown>;
    authLogger.error("Developer registration completion failed:", {
      status: response.status,
      error,
    });

    // Provide user-friendly error messages for known error codes
    if (error.code === "session_expired") {
      throw new Error("Registration session expired. Please start again.");
    }
    if (error.code === "signature_verification_failed") {
      throw new Error("Wallet signature verification failed. Please try again.");
    }

    throw new Error(extractGatewayErrorMessage(error, "Failed to complete registration"));
  }

  const apiResponse = (await response.json()) as {
    user_id: string;
    alias: string;
    tier: string;
    subscription_expiration: string;
  };

  authLogger.info("Developer registration completed for alias:", apiResponse.alias);

  return {
    user_id: apiResponse.user_id,
    alias: apiResponse.alias,
    tier: apiResponse.tier,
    subscription_expiration: apiResponse.subscription_expiration,
  };
}

// =============================================================================
// DEVELOPER LOGIN (CIP-30 signature flow, replaces legacy /account/login)
// =============================================================================

/**
 * Developer login session response (Step 1 of CIP-30 login flow)
 */
export interface DevLoginSession {
  session_id: string;
  nonce: string;
  expires_at: string;
}

/**
 * Developer login result (Step 2 — after completing with CIP-30 signature)
 *
 * Includes the access JWT (60 min) and refresh token (30 days, single-use
 * rotation) per andamio-api#410.
 */
export interface DevLoginResult {
  jwt: string;
  jwt_expires_at: string;
  refresh_token: string;
  refresh_token_expires_at: string;
  user_id: string;
  alias: string;
  tier: string;
}

/**
 * Validate a SecureLoginResponse from the gateway and flatten to DevLoginResult.
 *
 * Used by completeDevLogin and performDevRefresh, which both consume the same
 * response envelope (per andamio-api auth_viewmodels: SecureLoginResponse is
 * the response shape for both /v2/auth/developer/login/complete and
 * /v2/auth/developer/token/refresh). The generated SecureLoginResponse type
 * marks all fields as optional, so runtime validation is required regardless.
 *
 * @param apiResponse - Parsed JSON from the gateway response
 * @param context - "login" or "refresh", used in error messages and logs
 * @returns Flattened DevLoginResult ready for storage / consumer use
 * @throws Error with a context-specific message if any required field is missing
 */
function validateSecureLoginResponse(
  apiResponse: SecureLoginResponse,
  context: "login" | "refresh",
): DevLoginResult {
  if (!apiResponse.jwt?.token) {
    authLogger.error(`Unexpected ${context} response: missing jwt.token`, apiResponse);
    throw new Error(`Invalid ${context} response: missing JWT`);
  }
  if (!apiResponse.refresh_token?.token) {
    authLogger.error(`Unexpected ${context} response: missing refresh_token.token`, apiResponse);
    throw new Error(`Invalid ${context} response: missing refresh token`);
  }
  if (!apiResponse.user_id || !apiResponse.alias) {
    authLogger.error(`Unexpected ${context} response: missing user metadata`, apiResponse);
    throw new Error(`Invalid ${context} response: missing user metadata`);
  }
  return {
    jwt: apiResponse.jwt.token,
    jwt_expires_at: apiResponse.jwt.expires_at ?? "",
    refresh_token: apiResponse.refresh_token.token,
    refresh_token_expires_at: apiResponse.refresh_token.expires_at ?? "",
    user_id: apiResponse.user_id,
    alias: apiResponse.alias,
    tier: apiResponse.tier ?? "",
  };
}

/**
 * Step 1: Create a developer login session (CIP-30 signature flow)
 *
 * Returns a nonce that must be signed with the user's wallet to prove
 * ownership. The session expires after 5 minutes. Unlike the register flow,
 * login does NOT require an end-user JWT — the CIP-30 signature alone proves
 * wallet ownership (per andamio-api#410, plan §3.1).
 *
 * Replaces the legacy alias+wallet-only `/account/login` path that returned
 * 410 Gone once `wallet_signature_verification_enabled` shipped (per
 * andamio-api#410). CIP-30 signature ownership is the new contract.
 *
 * @param alias - The developer's registered alias
 * @param walletAddress - Wallet address in bech32 format; must match the
 *   wallet registered for this alias
 * @returns Session with nonce to sign
 */
export async function createDevLoginSession(params: {
  alias: string;
  walletAddress: string;
}): Promise<DevLoginSession> {
  authLogger.info("Creating developer login session for alias:", params.alias);

  const response = await withTimeout(
    fetch(`${API_PROXY}/api/v2/auth/developer/login/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        alias: params.alias,
        wallet_address: params.walletAddress,
      }),
    }),
    15_000,
    "Developer login session",
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { code?: string } & Record<string, unknown>;
    authLogger.error("Developer login session failed:", {
      status: response.status,
      error,
    });

    if (error.code === "user_not_found") {
      throw new Error("No developer account found for that alias and wallet. Register first or check your wallet.");
    }

    throw new Error(extractGatewayErrorMessage(error, "Failed to create login session"));
  }

  const apiResponse = (await response.json()) as {
    session_id: string;
    nonce: string;
    expires_at: string;
  };

  authLogger.info("Developer login session created, nonce received");

  return {
    session_id: apiResponse.session_id,
    nonce: apiResponse.nonce,
    expires_at: apiResponse.expires_at,
  };
}

/**
 * Step 2: Complete developer login with wallet signature
 *
 * Verifies the CIP-30 signature server-side (via DB API
 * `/auth/login/validate`). On success, returns a 60-minute dev JWT plus a
 * 30-day refresh token. The refresh token is single-use rotated — every call
 * to /token/refresh consumes the old token and issues a new one.
 *
 * The caller is responsible for persisting the result via `storeDevJWT()`
 * and `storeDevRefreshToken()`. `devFetch` (added in a follow-up commit)
 * handles transparent rotation on 401.
 *
 * @param sessionId - The session ID from createDevLoginSession
 * @param signature - CIP-30 wallet signature of the nonce
 * @returns Login result with JWT, refresh token, and user metadata
 */
export async function completeDevLogin(params: {
  sessionId: string;
  signature: WalletSignature;
}): Promise<DevLoginResult> {
  authLogger.info("Completing developer login with signature");

  const response = await withTimeout(
    fetch(`${API_PROXY}/api/v2/auth/developer/login/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: params.sessionId,
        signature: {
          signature: params.signature.signature,
          key: params.signature.key,
        },
      }),
    }),
    15_000,
    "Developer login completion",
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { code?: string } & Record<string, unknown>;
    authLogger.error("Developer login completion failed:", {
      status: response.status,
      error,
    });

    if (error.code === "session_expired") {
      throw new Error("Login session expired. Please start again.");
    }
    if (error.code === "session_already_used") {
      throw new Error("Login session already used. Please start a new login.");
    }
    if (error.code === "signature_verification_failed") {
      throw new Error("Wallet signature verification failed. Please try again.");
    }
    if (error.code === "wallet_mismatch") {
      throw new Error("Wallet address does not match this account.");
    }

    throw new Error(extractGatewayErrorMessage(error, "Failed to complete login"));
  }

  const apiResponse = (await response.json()) as SecureLoginResponse;
  const result = validateSecureLoginResponse(apiResponse, "login");
  authLogger.info("Developer login completed for alias:", result.alias);
  return result;
}

// =============================================================================
// DEV JWT REFRESH + AUTHENTICATED DEV FETCH
// =============================================================================

// Module-level singleton so concurrent 401-token-expired retries share one
// refresh round (refresh tokens are single-use; parallel rotations would
// have all-but-one fail with already-rotated). Client-only by construction:
// devFetch and refreshDevJWT short-circuit before this is touched in SSR.
let inflightRefresh: Promise<DevLoginResult> | null = null;

/**
 * Refresh the dev JWT using the stored refresh token.
 *
 * On success: rotates the refresh token (single-use per andamio-api#410),
 * persists the new JWT + new refresh token, returns the new pair.
 * On 401 (refresh token invalid/expired/revoked/already-used): clears the
 * dev session (dev JWT + dev refresh token) and throws — user must log in.
 * On network or other transient failure: does NOT clear tokens; throws.
 *
 * Concurrent calls are deduplicated to a single in-flight request.
 */
export async function refreshDevJWT(): Promise<DevLoginResult> {
  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = (async () => {
    try {
      return await performDevRefresh();
    } finally {
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}

async function performDevRefresh(): Promise<DevLoginResult> {
  // Snapshot the refresh token at the start; if it changes in storage during
  // the in-flight refresh (concurrent logout, another tab refresh), we must
  // NOT persist new tokens — that would silently re-login a user who logged
  // out, or trample another tab's rotation.
  const refreshTokenAtStart = getStoredDevRefreshToken();
  if (!refreshTokenAtStart) {
    throw new Error("No refresh token available — please log in.");
  }

  let response: Response;
  try {
    response = await withTimeout(
      fetch(`${API_PROXY}/api/v2/auth/developer/token/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshTokenAtStart }),
      }),
      15_000,
      "Developer token refresh",
    );
  } catch (networkError) {
    authLogger.error("Network error during dev JWT refresh:", networkError);
    throw new Error("Network error during refresh. Please check your connection.");
  }

  if (response.status === 401) {
    authLogger.warn("Dev refresh token rejected by gateway, clearing dev session");
    clearStoredDevJWT();
    clearStoredDevRefreshToken();
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    authLogger.error("Dev JWT refresh failed:", { status: response.status, error });
    throw new Error(extractGatewayErrorMessage(error, "Failed to refresh session"));
  }

  const apiResponse = (await response.json()) as SecureLoginResponse;
  const result = validateSecureLoginResponse(apiResponse, "refresh");

  // Logout-race guard: if storage was cleared (or another tab rotated) during
  // our in-flight refresh, do NOT persist. The gateway has already rotated
  // server-side; from the user's perspective, their logout takes precedence
  // and they'll be asked to log in again on next interaction.
  const refreshTokenNow = getStoredDevRefreshToken();
  if (refreshTokenNow !== refreshTokenAtStart) {
    authLogger.warn(
      "Dev refresh token in storage changed during refresh — aborting persistence (concurrent logout or other-tab rotation)",
    );
    // Belt-and-braces: ensure the dev session is fully cleared if the user's
    // intent was logout. If another tab rotated, their fresh tokens already
    // overwrote ours — clearing won't hurt because their next refresh will work.
    clearStoredDevJWT();
    clearStoredDevRefreshToken();
    throw new Error("Session was cleared during refresh. Please log in again.");
  }

  // Atomic write: new pair persists before any retry sees it.
  storeDevJWT(result.jwt);
  storeDevRefreshToken(result.refresh_token);

  authLogger.info("Dev JWT refreshed for alias:", result.alias);
  return result;
}

/**
 * Authenticated fetch for developer-scoped gateway routes.
 *
 * Reads the dev JWT from localStorage, attaches it as `Authorization: Bearer <jwt>`,
 * and on a 401 indicating expired/invalid dev JWT (see `isExpiredDevJwtError`)
 * transparently refreshes once and retries. Concurrent refreshes are
 * deduplicated via refreshDevJWT. Both fetch calls are wrapped in withTimeout
 * for parity with the rest of the auth surface.
 *
 * On any other failure (non-401, or 401 not matching the JWT-expiry pattern),
 * returns the original response so the caller decides how to handle it.
 *
 * Body must be replayable: only `string` bodies (or absent body) are accepted.
 * Non-replayable bodies (Blob, FormData, ReadableStream, BufferSource) are
 * rejected up front — the retry-after-refresh path cannot honor them, and
 * silently sending an empty body on retry would be worse than failing fast.
 * Use `fetch()` directly with manual retry handling for streaming payloads.
 */
export async function devFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  if (
    options.body !== undefined &&
    options.body !== null &&
    typeof options.body !== "string"
  ) {
    throw new Error(
      "devFetch only supports string bodies (or no body). Non-replayable bodies (Blob, FormData, ReadableStream, BufferSource) cannot be safely retried after refresh — use fetch() directly with manual retry handling.",
    );
  }

  const jwt = getStoredDevJWT();
  if (!jwt) {
    throw new Error("Not authenticated as developer. Please log in.");
  }

  const initial = await withTimeout(
    fetch(url, attachDevAuth(options, jwt)),
    15_000,
    `devFetch ${url}`,
  );

  if (initial.status === 401 && (await isExpiredDevJwtError(initial))) {
    await refreshDevJWT();

    const refreshedJwt = getStoredDevJWT();
    if (!refreshedJwt) {
      // refreshDevJWT wrote the new JWT on success; if it's gone, storage
      // was cleared between calls (logout, manual clear, etc.).
      throw new Error("Refresh succeeded but JWT not available. Please log in.");
    }

    return withTimeout(
      fetch(url, attachDevAuth(options, refreshedJwt)),
      15_000,
      `devFetch ${url} (retry)`,
    );
  }

  return initial;
}

function attachDevAuth(options: RequestInit, jwt: string): RequestInit {
  // Use the Headers constructor so we correctly merge regardless of the input
  // shape (plain object, string[][], or Headers instance). Naive object spread
  // would silently drop entries when options.headers is a Headers instance.
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${jwt}`);
  return { ...options, headers };
}

async function isExpiredDevJwtError(response: Response): Promise<boolean> {
  // The gateway does NOT currently emit a structured `code` field on dev-JWT
  // expiry/invalidity (see andamio-api/internal/middleware/developer_jwt_middleware.go:50,
  // which calls UnauthorizedError("Invalid or expired Developer JWT") via the
  // generic error helper that omits `code`). We match on `details`/`message`
  // substrings, plus accept a future structured code if the gateway adds one.
  // Tracked as a coordination follow-up to add `code: "developer_jwt_expired"`.
  // Clone so the caller can still read the body if we return the original.
  try {
    const body = (await response.clone().json()) as {
      code?: string;
      details?: string;
      message?: string;
    };
    if (body.code === "developer_jwt_expired" || body.code === "token_expired") {
      return true;
    }
    const haystack = `${body.details ?? ""} ${body.message ?? ""}`.toLowerCase();
    return haystack.includes("expired") || haystack.includes("developer jwt");
  } catch {
    return false;
  }
}

/**
 * @deprecated Use createDevRegisterSession + completeDevRegistration instead.
 * This function will fail as the old endpoint returns 410 Gone.
 */
export async function registerWithGateway(_params: {
  alias: string;
  email: string;
  walletAddress: string;
}): Promise<AuthResponse> {
  throw new Error(
    "registerWithGateway is deprecated. Use createDevRegisterSession + completeDevRegistration instead."
  );
}

// =============================================================================
// USER AUTH (fallback for users without access tokens)
// =============================================================================

/**
 * Step 1: Create a login session
 * Returns a nonce that must be signed with the user's wallet
 */
export async function createLoginSession(): Promise<LoginSession> {
  const response = await fetchWithRetry(
    `${API_PROXY}/api/v2/auth/login/session`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
    15_000,
    "Login session request",
  );

  if (!response.ok) {
    const fallback = `Login session failed (${response.status})`;
    const error = (await response.json().catch(() => ({}))) as unknown;
    const errorMessage = extractGatewayErrorMessage(error, fallback);
    authLogger.error("createLoginSession failed:", { status: response.status, errorMessage });
    throw new Error(errorMessage);
  }

  return response.json() as Promise<LoginSession>;
}

/**
 * API response format from /api/v2/auth/login/validate
 */
interface ValidateSignatureApiResponse {
  jwt: string;
  user: {
    id: string;
    cardano_bech32_addr: string;
    access_token_alias: string | null;
    created_at?: string;
    updated_at?: string;
  };
}

/**
 * Step 2: Validate signature and get JWT
 * Verifies the wallet signature and returns a JWT token
 *
 * API expects: { id, signature: { signature, key }, address }
 * Optional: andamio_access_token_unit, convert_utf8, wallet_preference
 */
export async function validateSignature(params: {
  sessionId: string;
  signature: WalletSignature;
  address: string;
  convertUTF8?: boolean;
  walletPreference?: string;
  andamioAccessTokenUnit?: string | null;
}): Promise<AuthResponse> {
  const response = await fetchWithRetry(
    `${API_PROXY}/api/v2/auth/login/validate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: params.sessionId,
        signature: params.signature,
        address: params.address,
        convert_utf8: params.convertUTF8 ?? false,
        wallet_preference: params.walletPreference,
        andamio_access_token_unit: params.andamioAccessTokenUnit,
      }),
    },
    15_000,
    "Signature validation request",
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as unknown;
    authLogger.error("Validate signature failed:", {
      status: response.status,
      statusText: response.statusText,
      error,
    });
    throw new Error(extractGatewayErrorMessage(error, "Failed to validate signature"));
  }

  // Transform API response to internal format
  const apiResponse = (await response.json()) as ValidateSignatureApiResponse;
  return {
    jwt: apiResponse.jwt,
    user: {
      id: apiResponse.user.id,
      cardanoBech32Addr: apiResponse.user.cardano_bech32_addr,
      accessTokenAlias: apiResponse.user.access_token_alias,
    },
  };
}

/**
 * Complete authentication flow using CIP-30 wallet signing
 *
 * For browser-based end users, we ALWAYS use wallet signing (User Auth):
 * 1. Get nonce from /api/v2/auth/login/session
 * 2. User signs nonce with CIP-30 wallet
 * 3. Validate signature at /api/v2/auth/login/validate
 * 4. Receive JWT for authenticated API access
 *
 * This provides cryptographic proof of wallet ownership - essential for security.
 *
 * Note: Developer Auth (no signing) is available separately for programmatic/API access
 * but should NOT be used for end-user authentication in browsers.
 *
 * @param signMessage - Function to sign a message with wallet (CIP-30)
 * @param address - Wallet address in bech32 format
 * @param walletName - Optional wallet name for preference tracking
 * @param convertUTF8 - Whether to convert nonce to UTF8 before signing
 * @param getAssets - Function to get wallet assets (for access token detection)
 */
export async function authenticateWithWallet(params: {
  signMessage: (nonce: string) => Promise<WalletSignature>;
  address: string;
  walletName?: string;
  convertUTF8?: boolean;
  getAssets?: () => Promise<Array<{ unit: string; quantity: string }>>;
}): Promise<AuthResponse> {
  const ACCESS_TOKEN_POLICY_ID = env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID;

  // Step 1: Detect access token in wallet (to include in validation request)
  let accessTokenUnit: string | undefined;

  if (params.getAssets) {
    try {
      const assets = await withTimeout(params.getAssets(), 15_000, "Wallet asset query");

      // Find access token in wallet assets
      const accessToken = assets.find((asset) =>
        asset.unit.startsWith(ACCESS_TOKEN_POLICY_ID)
      );

      if (accessToken) {
        accessTokenUnit = accessToken.unit;
        const alias = extractAliasFromUnit(accessToken.unit, ACCESS_TOKEN_POLICY_ID);
        authLogger.info("Access token detected for alias:", alias);
      } else {
        authLogger.debug("No access token found in wallet assets");
      }
    } catch (error) {
      authLogger.warn("Failed to detect access token:", error);
      // Continue with auth - access token is optional
    }
  }

  // Step 2: Create login session (get nonce to sign)
  authLogger.info("Creating login session...");
  const session = await createLoginSession();
  authLogger.info("Login session created, nonce received");

  // Step 3: Sign nonce with wallet (CIP-30)
  // 60s timeout: user needs time to interact with the wallet popup
  authLogger.info("Requesting wallet signature...");
  const signature = await withTimeout(params.signMessage(session.nonce), 60_000, "Wallet signature request");
  authLogger.info("Wallet signature obtained");

  // Step 4: Validate signature and get JWT
  authLogger.info("Validating signature...");
  const authResponse = await validateSignature({
    sessionId: session.id,
    signature,
    address: params.address,
    convertUTF8: params.convertUTF8,
    walletPreference: params.walletName,
    andamioAccessTokenUnit: accessTokenUnit ?? null,
  });

  authLogger.info("Authentication successful");
  return authResponse;
}

/**
 * JWT Storage helpers
 *
 * Two separate JWTs are tracked:
 * 1. User JWT (andamio_jwt) - From wallet signing, for app features
 * 2. Developer JWT (andamio_dev_jwt) - From gateway login, for API key management
 */
export const JWT_STORAGE_KEY = "andamio_jwt";
export const DEV_JWT_STORAGE_KEY = "andamio_dev_jwt";
export const DEV_REFRESH_TOKEN_STORAGE_KEY = "andamio_dev_refresh_token";

// User JWT helpers (for app features, requires wallet signing)
export function storeJWT(jwt: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(JWT_STORAGE_KEY, jwt);
    } catch {
      // localStorage may be unavailable (private browsing, quota exceeded)
      authLogger.warn("Failed to store JWT in localStorage");
    }
  }
}

export function getStoredJWT(): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(JWT_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
      return null;
    }
  }
  return null;
}

export function clearStoredJWT(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(JWT_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
    }
  }
}

// Developer JWT helpers (for API key management, no wallet signing)
export function storeDevJWT(jwt: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DEV_JWT_STORAGE_KEY, jwt);
    } catch {
      // localStorage may be unavailable (private browsing, quota exceeded)
      authLogger.warn("Failed to store dev JWT in localStorage");
    }
  }
}

export function getStoredDevJWT(): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(DEV_JWT_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
      return null;
    }
  }
  return null;
}

export function clearStoredDevJWT(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(DEV_JWT_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
    }
  }
}

// Developer refresh token helpers (for transparent rotation of short-lived dev JWT)
export function storeDevRefreshToken(token: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DEV_REFRESH_TOKEN_STORAGE_KEY, token);
    } catch {
      authLogger.warn("Failed to store dev refresh token in localStorage");
    }
  }
}

export function getStoredDevRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(DEV_REFRESH_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

export function clearStoredDevRefreshToken(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(DEV_REFRESH_TOKEN_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
    }
  }
}

// Clear all stored auth tokens (full logout): user JWT, dev JWT, dev refresh token
export function clearAllAuthTokens(): void {
  clearStoredJWT();
  clearStoredDevJWT();
  clearStoredDevRefreshToken();
}

/**
 * Check if JWT is expired (basic check, doesn't verify signature)
 */
export function isJWTExpired(jwt: string): boolean {
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]!)) as { exp?: number };
    if (!payload.exp) {
      return true;
    }
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true;
  }
}

// =============================================================================
// API KEY MANAGEMENT (requires Developer JWT)
// =============================================================================

/**
 * API Key response from gateway
 */
export interface ApiKeyResponse {
  apiKey: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  expiresInDays: number;
  isActive: boolean;
}

/**
 * Developer profile response
 */
export interface DeveloperProfile {
  userId: string;
  alias: string;
  tier: string;
  createdAt: string;
  activeKeys: ApiKeyResponse[];
}

/**
 * Developer usage response
 */
export interface DeveloperUsage {
  dailyQuotaConsumed: number;
  dailyQuotaLimit: number;
}

/**
 * Request a new API key from the gateway.
 *
 * Reads the developer JWT from storage (via devFetch) and transparently
 * refreshes on 401. Caller no longer passes a JWT.
 *
 * @param name - Name/label for the API key (for identification, 3-64 chars)
 * @param expiresInDays - Optional expiration in days (default varies by tier)
 * @returns API key details
 */
export async function requestApiKey(
  name: string,
  expiresInDays?: number
): Promise<ApiKeyResponse> {
  const requestBody: { api_key_name: string; expires_in_days?: number } = {
    api_key_name: name,
  };
  if (expiresInDays !== undefined) {
    requestBody.expires_in_days = expiresInDays;
  }
  authLogger.info("Requesting API key from gateway:", { name });

  const response = await devFetch(`${API_PROXY}/api/v2/apikey/developer/key/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as unknown;
    authLogger.error("API key request failed:", {
      status: response.status,
      error,
    });
    throw new Error(extractGatewayErrorMessage(error, "Failed to request API key"));
  }

  const data = (await response.json()) as {
    api_key?: string;
    api_key_name?: string;
    created_at?: string;
    expires_at?: string;
    expires_in_days?: number;
    is_active?: boolean;
  };

  if (!data.api_key) {
    authLogger.error("API key response missing key field:", data);
    throw new Error("API key response missing api_key field");
  }

  authLogger.info("API key generated successfully");

  return {
    apiKey: data.api_key,
    name: data.api_key_name ?? name,
    createdAt: data.created_at ?? "",
    expiresAt: data.expires_at ?? "",
    expiresInDays: data.expires_in_days ?? 0,
    isActive: data.is_active ?? true,
  };
}

/**
 * Rotate (extend) an existing API key.
 *
 * Reads the developer JWT from storage (via devFetch) and transparently
 * refreshes on 401.
 *
 * @param name - Name of the API key to rotate
 * @param expiresInDays - Optional new expiration in days
 * @returns Confirmation message
 */
export async function rotateApiKey(
  name: string,
  expiresInDays?: number
): Promise<{ confirmation: string }> {
  if (!name) {
    throw new Error("API key name is required for rotation");
  }

  authLogger.info("Rotating API key:", name);

  const requestBody: { api_key_name: string; expires_in_days?: number } = {
    api_key_name: name,
  };
  if (expiresInDays !== undefined) {
    requestBody.expires_in_days = expiresInDays;
  }

  const response = await devFetch(`${API_PROXY}/api/v2/apikey/developer/key/rotate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as unknown;
    authLogger.error("API key rotation failed:", {
      status: response.status,
      error,
    });
    throw new Error(extractGatewayErrorMessage(error, "Failed to rotate API key"));
  }

  const data = (await response.json()) as { confirmation?: string };
  authLogger.info("API key rotated successfully");

  return {
    confirmation: data.confirmation ?? "API key rotated successfully",
  };
}

/**
 * Delete an API key
 *
 * **IMPORTANT**: Requires a DEVELOPER JWT, not the end-user JWT.
 *
 * @param jwt - Developer JWT from gateway auth (use getStoredDevJWT())
 * @param name - Name of the API key to delete
 * @returns Confirmation message
 */
export async function deleteApiKey(
  name: string
): Promise<{ confirmation: string }> {
  if (!name) {
    throw new Error("API key name is required for deletion");
  }

  authLogger.info("Deleting API key:", name);

  const response = await devFetch(`${API_PROXY}/api/v2/apikey/developer/key/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ api_key_name: name }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as unknown;
    authLogger.error("API key deletion failed:", {
      status: response.status,
      error,
    });
    throw new Error(extractGatewayErrorMessage(error, "Failed to delete API key"));
  }

  const data = (await response.json()) as { confirmation?: string };
  authLogger.info("API key deleted successfully");

  return {
    confirmation: data.confirmation ?? "API key deleted successfully",
  };
}

/**
 * Get developer profile.
 *
 * Reads the developer JWT from storage (via devFetch) and transparently
 * refreshes on 401.
 *
 * @returns Developer profile with active API keys
 */
export async function getDeveloperProfile(): Promise<DeveloperProfile> {
  authLogger.info("Fetching developer profile");

  const response = await devFetch(`${API_PROXY}/api/v2/apikey/developer/profile/get`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as unknown;
    authLogger.error("Failed to get developer profile:", {
      status: response.status,
      error,
    });
    throw new Error(extractGatewayErrorMessage(error, "Failed to get developer profile"));
  }

  const data = (await response.json()) as {
    user_id?: string;
    alias?: string;
    tier?: string;
    created_at?: string;
    active_keys?: Array<{
      api_key?: string;
      name?: string;
      created_at?: string;
      expires_at?: string;
      expires_in_days?: number;
      is_active?: boolean;
    }>;
  };

  authLogger.info("Developer profile fetched successfully");

  return {
    userId: data.user_id ?? "",
    alias: data.alias ?? "",
    tier: data.tier ?? "",
    createdAt: data.created_at ?? "",
    activeKeys: (data.active_keys ?? []).map((key) => ({
      apiKey: key.api_key ?? "",
      name: key.name ?? "",
      createdAt: key.created_at ?? "",
      expiresAt: key.expires_at ?? "",
      expiresInDays: key.expires_in_days ?? 0,
      isActive: key.is_active ?? true,
    })),
  };
}

/**
 * Get developer usage statistics.
 *
 * Reads the developer JWT from storage (via devFetch) and transparently
 * refreshes on 401.
 *
 * @returns Usage statistics
 */
export async function getDeveloperUsage(): Promise<DeveloperUsage> {
  authLogger.info("Fetching developer usage");

  const response = await devFetch(`${API_PROXY}/api/v2/apikey/developer/usage/get`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as unknown;
    authLogger.error("Failed to get developer usage:", {
      status: response.status,
      error,
    });
    throw new Error(extractGatewayErrorMessage(error, "Failed to get developer usage"));
  }

  const data = (await response.json()) as {
    daily_quota_consumed?: number;
    daily_quota_limit?: number;
  };

  authLogger.info("Developer usage fetched successfully");

  return {
    dailyQuotaConsumed: data.daily_quota_consumed ?? 0,
    dailyQuotaLimit: data.daily_quota_limit ?? 0,
  };
}

/**
 * Delete developer account.
 *
 * **WARNING**: This permanently deletes the developer account and all
 * associated API keys. Reads the developer JWT from storage (via devFetch).
 *
 * @returns Confirmation message
 */
export async function deleteDeveloperAccount(): Promise<{ confirmation: string }> {
  authLogger.info("Deleting developer account");

  const response = await devFetch(`${API_PROXY}/api/v2/apikey/developer/account/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as unknown;
    authLogger.error("Failed to delete developer account:", {
      status: response.status,
      error,
    });
    throw new Error(extractGatewayErrorMessage(error, "Failed to delete developer account"));
  }

  const data = (await response.json()) as { message?: string };
  authLogger.info("Developer account deleted successfully");

  // Clear stored JWT since account is gone
  clearStoredDevJWT();

  return {
    confirmation: data.message ?? "Developer account deleted successfully",
  };
}

// =============================================================================
// EMAIL VERIFICATION (requires Developer JWT)
// =============================================================================

/**
 * Email verification status response
 */
export interface EmailVerificationStatus {
  emailVerified: boolean;
  canResend: boolean;
  remainingAttempts: number;
  verificationEmailSentAt: string | null;
  waitDurationSeconds: number;
}

/**
 * Resend verification email response
 */
export interface ResendVerificationResponse {
  message: string;
  nextResendAvailableAt: string | null;
  remainingAttempts: number;
}

/**
 * Get email verification status for the current developer.
 *
 * Reads the developer JWT from storage (via devFetch) and transparently
 * refreshes on 401.
 *
 * @returns Email verification status
 */
export async function getEmailVerificationStatus(): Promise<EmailVerificationStatus> {
  authLogger.info("Fetching email verification status");

  const response = await devFetch(`${API_PROXY}/api/v2/auth/developer/email-status`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as unknown;
    authLogger.error("Failed to get email verification status:", {
      status: response.status,
      error,
    });
    throw new Error(extractGatewayErrorMessage(error, "Failed to get email verification status"));
  }

  const data = (await response.json()) as {
    email_verified?: boolean;
    can_resend?: boolean;
    remaining_attempts?: number;
    verification_email_sent_at?: string;
    wait_duration_seconds?: number;
  };

  authLogger.info("Email verification status fetched:", { verified: data.email_verified });

  return {
    emailVerified: data.email_verified ?? false,
    canResend: data.can_resend ?? false,
    remainingAttempts: data.remaining_attempts ?? 0,
    verificationEmailSentAt: data.verification_email_sent_at ?? null,
    waitDurationSeconds: data.wait_duration_seconds ?? 0,
  };
}

/**
 * Resend verification email.
 *
 * Reads the developer JWT from storage (via devFetch) and transparently
 * refreshes on 401.
 *
 * @returns Confirmation with next available resend time
 */
export async function resendVerificationEmail(): Promise<ResendVerificationResponse> {
  authLogger.info("Requesting verification email resend");

  const response = await devFetch(`${API_PROXY}/api/v2/auth/developer/resend-verification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as unknown;
    authLogger.error("Failed to resend verification email:", {
      status: response.status,
      error,
    });
    throw new Error(extractGatewayErrorMessage(error, "Failed to resend verification email"));
  }

  const data = (await response.json()) as {
    message?: string;
    next_resend_available_at?: string;
    remaining_attempts?: number;
  };

  authLogger.info("Verification email resend requested successfully");

  return {
    message: data.message ?? "Verification email sent",
    nextResendAvailableAt: data.next_resend_available_at ?? null,
    remainingAttempts: data.remaining_attempts ?? 0,
  };
}
