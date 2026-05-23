"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@meshsdk/react";
import {
  authenticateWithWallet,
  storeJWT,
  getStoredJWT,
  clearStoredJWT,
  isJWTExpired,
  type AuthUser,
} from "~/lib/andamio-auth";
import { withTimeout } from "~/lib/promise-utils";
import { extractAliasFromUnit, stringToHex } from "~/lib/access-token-utils";
import { authLogger } from "~/lib/debug-logger";
import { parseAuthErrorMessage } from "~/lib/auth-error-messages";
import { env } from "~/env";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import { getWalletAddressBech32 } from "~/lib/wallet-address";
import { pendingProject } from "~/lib/pending-project";

/**
 * Detect and sync access token from wallet to database
 * Called when wallet is connected and we have a valid JWT
 *
 * NOTE: With the unified Gateway auth model, this sync is typically not needed
 * because users register their alias during gateway registration. This function
 * exists for legacy DB API compatibility but will silently skip if:
 * - User already has an alias (from gateway auth)
 * - The legacy endpoint doesn't exist (404)
 */
async function syncAccessTokenFromWallet(
  wallet: {
    getBalanceMesh: () => Promise<Array<{ unit: string; quantity: string }>>;
  },
  currentUser: AuthUser | null,
  jwt: string,
  updateUser: (user: AuthUser) => void
): Promise<void> {
  if (!currentUser || !wallet) return;

  // Check if we need to update the database
  // If user already has this alias (from gateway auth), skip entirely
  if (currentUser.accessTokenAlias) {
    authLogger.info("Access token already set (gateway auth):", currentUser.accessTokenAlias);
    return;
  }

  // First, detect the access token in wallet (outside try-catch for API call)
  let alias: string | undefined;
  try {
    const assets = await wallet.getBalanceMesh();
    const ACCESS_TOKEN_POLICY_ID = env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID;

    // Find access token in wallet
    const accessToken = assets.find((asset) => asset.unit.startsWith(ACCESS_TOKEN_POLICY_ID));

    if (!accessToken) {
      authLogger.info("No access token found in wallet");
      return;
    }

    // Extract alias from token unit (policy ID + hex-encoded name)
    alias = extractAliasFromUnit(accessToken.unit, ACCESS_TOKEN_POLICY_ID);
    authLogger.info("Detected access token in wallet:", { unit: accessToken.unit, alias });
  } catch (error) {
    authLogger.warn("Failed to detect access token in wallet:", error);
    return;
  }

  // Now try to sync with API
  try {
    authLogger.info("Syncing access token alias to database:", alias);

    const response = await fetch(`${GATEWAY_API_BASE}/user/access-token-alias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        access_token_alias: alias,
      }),
    });

    // Handle 404 gracefully - endpoint may not exist in new unified gateway
    if (response.status === 404) {
      authLogger.info("Sync endpoint not available, updating local state only");
      updateUser({
        ...currentUser,
        accessTokenAlias: alias,
      });
      return;
    }

    if (response.ok) {
      const data = (await response.json()) as { success: boolean; user: AuthUser; jwt: string };
      authLogger.info("Access token alias synced to database:", alias);

      // Store the new JWT
      storeJWT(data.jwt);

      // Update local user state
      updateUser(data.user);
    } else {
      // API failed, but we still detected the alias from wallet - update local state
      authLogger.warn("Access token sync API failed (non-critical):", response.status);
      authLogger.info("Updating local user state with detected alias:", alias);
      updateUser({
        ...currentUser,
        accessTokenAlias: alias,
      });
    }
  } catch (error) {
    // Log but don't throw - sync failures shouldn't break the app
    authLogger.warn("Access token sync error (non-critical):", error);
    // Still update local state with detected alias
    authLogger.info("Updating local user state with detected alias despite error:", alias);
    updateUser({
      ...currentUser,
      accessTokenAlias: alias,
    });
  }
}

interface AndamioAuthContextType {
  // State
  isAuthenticated: boolean;
  user: AuthUser | null;
  jwt: string | null;
  isAuthenticating: boolean;
  authError: string | null;
  isWalletConnected: boolean;
  popupBlocked: boolean;

  // Actions
  authenticate: () => Promise<void>;
  logout: (reason: LogoutReason) => void;
  refreshAuth: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
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

const AndamioAuthContext = createContext<AndamioAuthContextType | undefined>(undefined);

/**
 * AndamioAuthProvider - Global authentication state provider
 *
 * Provides a single source of truth for authentication state across the entire app.
 * Manages JWT storage, wallet authentication, and authenticated API requests.
 */
export function AndamioAuthProvider({ children }: { children: React.ReactNode }) {
  const { connected, wallet, name: walletName, disconnect: disconnectWallet } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  // Track if JWT validation is in progress
  const isValidatingJWTRef = useRef(false);

  // Helper to update ref
  const setValidatingJWT = useCallback((value: boolean) => {
    isValidatingJWTRef.current = value;
  }, []);

  // Validate stored JWT against connected wallet
  // Only authenticate if wallet is connected AND JWT matches the wallet
  // NOTE: We intentionally exclude `wallet` from deps - it changes reference on every render
  // We only react to `connected` changing, and access wallet via closure
  useEffect(() => {
    authLogger.debug("[Effect: validateJWT] Running - connected:", connected);

    // Check synchronously if there's a stored JWT to validate
    const storedJWT = getStoredJWT();
    if (!storedJWT) {
      setValidatingJWT(false);
      return;
    }

    isValidatingJWTRef.current = true;

    const validateStoredJWT = async () => {

      // JWT expired - clear it silently
      if (isJWTExpired(storedJWT)) {
        authLogger.info("Stored JWT expired, clearing");
        clearStoredJWT();
        setValidatingJWT(false);
        return;
      }

      // Wallet not connected - don't authenticate, but keep JWT for later validation
      if (!connected || !wallet) {
        authLogger.debug("Wallet not connected, not restoring session from stored JWT");
        setValidatingJWT(false);
        return;
      }

      // Wallet is connected - validate JWT against wallet
      try {
        const payload = JSON.parse(atob(storedJWT.split(".")[1]!)) as {
          userId: string;
          cardanoBech32Addr?: string;
          accessTokenAlias?: string;
        };
        authLogger.debug("Validating stored JWT against connected wallet");

        // Fetch wallet data in parallel for performance
        // If JWT has accessTokenAlias, we need both address and assets
        // Otherwise, just fetch the address
        // Timeout protects against wallet extension not being fully ready on first page load
        const [walletAddress, assets] = await withTimeout(
          Promise.all([
            getWalletAddressBech32(wallet),
            payload.accessTokenAlias ? wallet.getBalanceMesh() : Promise.resolve(null),
          ]),
          15_000,
          "JWT validation wallet queries",
        );

        // Check address match
        if (payload.cardanoBech32Addr && payload.cardanoBech32Addr !== walletAddress) {
          authLogger.info("Stored JWT address doesn't match connected wallet, clearing JWT");
          clearStoredJWT();
          setValidatingJWT(false);
          return;
        }

        // Check access token alias match (if JWT has one)
        if (payload.accessTokenAlias && assets) {
          const ACCESS_TOKEN_POLICY_ID = env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID;
          const walletAccessToken = assets.find((asset) =>
            asset.unit.startsWith(ACCESS_TOKEN_POLICY_ID)
          );

          if (walletAccessToken) {
            const walletAlias = extractAliasFromUnit(walletAccessToken.unit, ACCESS_TOKEN_POLICY_ID);
            if (walletAlias !== payload.accessTokenAlias) {
              authLogger.info("Stored JWT access token alias doesn't match wallet, clearing JWT");
              clearStoredJWT();
              setValidatingJWT(false);
              return;
            }
          }
          // If wallet doesn't have an access token but JWT does, that's okay - token might have been transferred
        }

        // JWT matches wallet - restore session
        authLogger.info("Stored JWT matches connected wallet, restoring session");
        setJwt(storedJWT);
        setIsAuthenticated(true);

        const userData: AuthUser = {
          id: payload.userId,
          cardanoBech32Addr: payload.cardanoBech32Addr ?? null,
          accessTokenAlias: payload.accessTokenAlias ?? null,
        };
        setUser(userData);
        authLogger.info("User data loaded from stored JWT:", userData);

        authLogger.debug("Session restored for user:", userData.id);

        // Sync access token from wallet (in case wallet has a new one)
        void syncAccessTokenFromWallet(wallet, userData, storedJWT, setUser);
        setValidatingJWT(false);
      } catch (error) {
        authLogger.error("Failed to validate stored JWT:", error);
        clearStoredJWT();
        setValidatingJWT(false);
      }
    };

    void validateStoredJWT();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, setValidatingJWT]);

  // Clear authenticated state when wallet disconnects
  // Keep JWT in storage for potential reconnection with same wallet
  useEffect(() => {
    authLogger.debug("[Effect: walletDisconnect] Running - connected:", connected, "isAuthenticated:", isAuthenticated);
    if (!connected) {
      setPopupBlocked(false);
      setAuthError(null); // Clear any previous auth errors so reconnecting starts fresh
      // Clear auth state but keep JWT for reconnection validation
      if (isAuthenticated) {
        authLogger.info("Wallet disconnected, clearing authenticated state (JWT kept for reconnection)");
        setIsAuthenticated(false);
        setUser(null);
        setJwt(null);
      }
    }
  }, [connected, isAuthenticated]);

  // Auto-authenticate when wallet connects without a valid stored JWT
  // This triggers the sign message flow for new connections
  useEffect(() => {
    authLogger.debug("[Effect: autoAuth] Running - connected:", connected, "isAuthenticated:", isAuthenticated, "isAuthenticating:", isAuthenticating, "isValidatingJWT:", isValidatingJWTRef.current);

    // Skip if wallet not connected
    if (!connected || !wallet) {
      return;
    }

    // Skip if already authenticated or authenticating
    if (isAuthenticated || isAuthenticating) {
      return;
    }

    // Skip if there was an auth error (user declined, etc.)
    // Without this check, declining to sign causes an infinite loop of wallet popups
    if (authError) {
      return;
    }

    // Skip if popup was blocked - user needs to click retry manually
    // Without this check, autoAuth re-triggers and creates an infinite loop
    if (popupBlocked) {
      return;
    }

    // Skip if we're still validating a stored JWT
    if (isValidatingJWTRef.current) {
      return;
    }

    // Check if there's a stored JWT that might be valid
    const storedJWT = getStoredJWT();
    if (storedJWT && !isJWTExpired(storedJWT)) {
      // Let the validateJWT effect handle this
      authLogger.debug("[Effect: autoAuth] Stored JWT exists, skipping auto-auth");
      return;
    }

    // No valid JWT - trigger authentication after a short delay
    // The delay gives the wallet extension time to fully initialize its CIP-30 API
    // (on first page load, `connected` can fire before signData/getBalance are ready)
    authLogger.info("[Effect: autoAuth] Wallet connected without valid JWT, scheduling authentication");
    const timer = setTimeout(() => {
      authLogger.info("[Effect: autoAuth] Triggering authentication");
      void authenticate();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, isAuthenticated, isAuthenticating, authError, popupBlocked]);

  /**
   * Authenticate with connected wallet
   */
  const authenticate = useCallback(async () => {
    authLogger.info("authenticate() called", { connected, hasWallet: !!wallet });

    if (!connected || !wallet) {
      setAuthError("Please connect your wallet first");
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);
    setPopupBlocked(false);

    try {
      // Get wallet address in bech32 format (v2 provides explicit bech32 method)
      // Timeout protects against wallet extension not being fully ready
      const bech32Address = await withTimeout(
        getWalletAddressBech32(wallet), 10_000, "Wallet address request"
      );

      if (!bech32Address || bech32Address.length < 10) {
        authLogger.error("Invalid wallet address received (length check failed)");
        throw new Error("Invalid wallet address received from wallet");
      }

      // Debug logging
      authLogger.debug("Authentication addresses:", {
        bech32Address,
        walletName,
      });

      // Authenticate
      const authResponse = await authenticateWithWallet({
        signMessage: async (nonce: string) => {
          authLogger.debug("Signing nonce:", { nonce: nonce.slice(0, 20) + "...", length: nonce.length });
          authLogger.debug("Using bech32 address for signing:", bech32Address);

          // Mesh SDK v2: signData(address: string, payload: string)
          // Note: address comes FIRST, payload second (swapped from v1)
          // CIP-30 requires hex-encoded payload - see GitHub issue #394
          const nonceHex = stringToHex(nonce);
          const signature = await wallet.signData(bech32Address, nonceHex);
          return signature;
        },
        address: bech32Address, // Always send bech32 to the API
        walletName: walletName ?? undefined,
        convertUTF8: false, // Try false first, can be made configurable
        getAssets: async () => {
          // Get wallet assets to detect access token
          const assets = await wallet.getBalanceMesh();
          return assets;
        },
      });

      // Store JWT and update state
      authLogger.info("Auth response received:", {
        hasJwt: !!authResponse.jwt,
        user: authResponse.user,
      });
      storeJWT(authResponse.jwt);
      setJwt(authResponse.jwt);
      setUser(authResponse.user);
      setIsAuthenticated(true);
      setPopupBlocked(false);
      authLogger.info("Auth state updated: isAuthenticated=true");

      // Sync access token from wallet to database (in case it wasn't detected during auth)
      await syncAccessTokenFromWallet(wallet, authResponse.user, authResponse.jwt, setUser);

      authLogger.debug("Authentication successful for user:", authResponse.user.id);
    } catch (error) {
      authLogger.error("Authentication failed:", error);
      const rawMessage = error instanceof Error ? error.message : "Authentication failed";

      // Detect popup blocked error (Web3Services wallets use popups for signing)
      if (
        rawMessage.includes("Failed to open window") ||
        rawMessage.includes("popup")
      ) {
        // Set popupBlocked instead of authError - user can click to retry
        setPopupBlocked(true);
      } else {
        // Parse the error into a user-friendly message
        const parsed = parseAuthErrorMessage(rawMessage);
        setAuthError(parsed?.message ?? "Authentication failed. Please try again.");
      }
      setIsAuthenticated(false);
    } finally {
      setIsAuthenticating(false);
    }
  }, [connected, wallet, walletName]);

  /**
   * Logout and clear auth state
   * Also disconnects the wallet to complete the logout flow
   *
   * The `reason` parameter is required for instrumentation — see
   * docs/plans/2026-04-28-002-fix-jwt-expiry-wallet-disconnect-plan.md
   * Unit A0. We need to distinguish user-initiated sign-out from
   * automatic disconnects in field reports.
   */
  const logout = useCallback((reason: LogoutReason) => {
    // authLogger.error (not .warn) is intentional: only `error` is unconditional
    // in debug-logger.ts; `warn` is gated behind NEXT_PUBLIC_DEBUG_LOGGING and
    // would be silent in production, defeating the A0 spike's purpose.
    authLogger.error("[logout] fired", { reason });
    clearStoredJWT();
    setJwt(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    // Clear pending project creation state
    pendingProject.clear();
    // Disconnect the wallet as well
    disconnectWallet();
  }, [disconnectWallet]);

  // Detect wallet switch during active session and logout
  // If user switches to a different wallet while authenticated, we need to log them out
  // to prevent session hijacking or data leakage
  // NOTE: This effect must be defined AFTER logout callback to avoid scope issues
  useEffect(() => {
    authLogger.debug("[Effect: detectWalletSwitch] Running");

    // Only check if user is authenticated and wallet is connected
    if (!isAuthenticated || !connected || !wallet || !user?.cardanoBech32Addr) {
      return;
    }

    const checkWalletMatch = async () => {
      try {
        // Get current wallet address in bech32 format
        const currentWalletAddress = await getWalletAddressBech32(wallet);

        // Compare with authenticated user's address
        if (currentWalletAddress !== user.cardanoBech32Addr) {
          authLogger.warn("Wallet address mismatch detected - user switched wallets during active session", {
            authenticatedAddress: user.cardanoBech32Addr,
            currentWalletAddress,
          });
          authLogger.info("Logging out user due to wallet switch");

          // Log out the user to prevent session issues
          logout("wallet_switch");
        }
      } catch (error) {
        authLogger.error("Error checking wallet address during switch detection:", error);
        // Don't logout on errors - might be a temporary wallet API issue
      }
    };

    // Check immediately on mount and whenever dependencies change
    void checkWalletMatch();

    // Also set up polling to detect switches that happen without React re-renders
    // Some wallet extensions don't trigger re-renders when switching accounts
    const intervalId = setInterval(() => {
      void checkWalletMatch();
    }, 10_000); // Check every 10 seconds

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, connected, user?.cardanoBech32Addr, logout]);

  /**
   * Refresh auth state from stored JWT
   * Useful after operations that update the JWT (e.g., minting access token)
   * Updates context state without requiring re-authentication
   */
  const refreshAuth = useCallback(() => {
    const storedJWT = getStoredJWT();

    if (!storedJWT) {
      authLogger.warn("refreshAuth called but no JWT in storage");
      return;
    }

    if (isJWTExpired(storedJWT)) {
      authLogger.warn("refreshAuth called but stored JWT is expired");
      clearStoredJWT();
      setJwt(null);
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(storedJWT.split(".")[1]!)) as {
        userId: string;
        cardanoBech32Addr?: string;
        accessTokenAlias?: string;
      };

      const updatedUser: AuthUser = {
        id: payload.userId,
        cardanoBech32Addr: payload.cardanoBech32Addr ?? null,
        accessTokenAlias: payload.accessTokenAlias ?? null,
      };

      authLogger.info("Refreshing auth state from stored JWT:", updatedUser);

      setJwt(storedJWT);
      setUser(updatedUser);
      setIsAuthenticated(true);
    } catch (error) {
      authLogger.error("Failed to parse JWT during refresh:", error);
    }
  }, []);

  /**
   * Make authenticated API request
   */
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!jwt) {
        throw new Error("Not authenticated");
      }

      if (isJWTExpired(jwt)) {
        logout("jwt_expired");
        throw new Error("JWT expired, please re-authenticate");
      }

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${jwt}`,
        },
      });
    },
    [jwt, logout],
  );

  return (
    <AndamioAuthContext.Provider
      value={{
        isAuthenticated,
        user,
        jwt,
        isAuthenticating,
        authError,
        isWalletConnected: connected,
        popupBlocked,
        authenticate,
        logout,
        refreshAuth,
        authenticatedFetch,
      }}
    >
      {children}
    </AndamioAuthContext.Provider>
  );
}

/**
 * Default context value for when provider hasn't loaded yet (during dynamic import)
 */
const defaultContextValue: AndamioAuthContextType = {
  isAuthenticated: false,
  user: null,
  jwt: null,
  isAuthenticating: false,
  authError: null,
  isWalletConnected: false,
  popupBlocked: false,
  authenticate: async () => {
    console.warn("[Auth] Provider not loaded yet");
  },
  logout: (_reason: LogoutReason) => {
    console.warn("[Auth] Provider not loaded yet");
  },
  refreshAuth: () => {
    console.warn("[Auth] Provider not loaded yet");
  },
  authenticatedFetch: async () => {
    console.warn("[Auth] Provider not loaded yet");
    return new Response(null, { status: 503 });
  },
};

/**
 * Hook for accessing Andamio authentication state
 *
 * Returns a loading state if provider hasn't loaded yet (during dynamic import)
 */
export function useAndamioAuth() {
  const context = useContext(AndamioAuthContext);
  // Return default loading state if provider hasn't loaded yet
  // This handles the brief period during dynamic import of AuthProvider
  if (context === undefined) {
    return defaultContextValue;
  }
  return context;
}
