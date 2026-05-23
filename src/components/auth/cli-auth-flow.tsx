"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@meshsdk/react";
import { authenticateWithWallet, type AuthResponse } from "~/lib/andamio-auth";
import { withTimeout } from "~/lib/promise-utils";
import { getWalletAddressBech32 } from "~/lib/wallet-address";
import { stringToHex } from "~/lib/access-token-utils";
import { authLogger } from "~/lib/debug-logger";
import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";
import {
  TerminalIcon,
  SuccessIcon,
  ErrorIcon,
  LoadingIcon,
  ShieldIcon,
  LinkIcon,
} from "~/components/icons";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioCardFooter,
} from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioButton } from "~/components/andamio/andamio-button";

// =============================================================================
// Types
// =============================================================================

type CliAuthState =
  | "invalid-request"
  | "ready"
  | "authenticating"
  | "error"
  | "redirecting";

type CliAuthErrorCode = "invalid_request" | "auth_failed" | "user_cancelled";

interface CliAuthError {
  code: CliAuthErrorCode;
  title: string;
  description: string;
}

// =============================================================================
// Validation
// =============================================================================

const ALLOWED_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

function parseCliParams(searchParams: URLSearchParams):
  | { valid: true; redirectUrl: URL; state: string }
  | { valid: false; error: CliAuthError } {
  const redirectUri = searchParams.get("redirect_uri");
  const state = searchParams.get("state");

  if (!redirectUri || !state) {
    return {
      valid: false,
      error: {
        code: "invalid_request",
        title: "Invalid Request",
        description:
          "Missing required parameters. Please run `andamio login` again.",
      },
    };
  }

  try {
    const url = new URL(redirectUri);

    if (!ALLOWED_HOSTNAMES.has(url.hostname)) {
      return {
        valid: false,
        error: {
          code: "invalid_request",
          title: "Invalid Redirect",
          description:
            "The callback URL must be localhost. Ensure the CLI is configured correctly.",
        },
      };
    }

    const port = parseInt(url.port) || 80;
    if (port < 1024 || port > 65535) {
      return {
        valid: false,
        error: {
          code: "invalid_request",
          title: "Invalid Port",
          description: "The callback port is outside the allowed range.",
        },
      };
    }

    return { valid: true, redirectUrl: url, state };
  } catch {
    return {
      valid: false,
      error: {
        code: "invalid_request",
        title: "Malformed URL",
        description:
          "The callback URL could not be parsed. Please run `andamio login` again.",
      },
    };
  }
}

function classifyAuthError(error: unknown): CliAuthError {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error);

  if (
    message.includes("user declined") ||
    message.includes("user rejected") ||
    message.includes("cancelled")
  ) {
    return {
      code: "user_cancelled",
      title: "Authentication Cancelled",
      description: "You cancelled the wallet signature request.",
    };
  }

  if (message.includes("timeout")) {
    return {
      code: "auth_failed",
      title: "Request Timed Out",
      description:
        "The wallet or server took too long to respond. Click retry to try again.",
    };
  }

  return {
    code: "auth_failed",
    title: "Authentication Failed",
    description:
      "Could not verify your wallet. Ensure it's connected and try `andamio login` again.",
  };
}

// =============================================================================
// Component
// =============================================================================

export function CliAuthFlow() {
  const searchParams = useSearchParams();
  const { wallet, connected, name: walletName } = useWallet();

  // Parse and validate params once
  const parsed = React.useMemo(
    () => parseCliParams(searchParams),
    [searchParams],
  );

  const [state, setState] = React.useState<CliAuthState>(
    parsed.valid ? "ready" : "invalid-request",
  );
  const [authError, setAuthError] = React.useState<CliAuthError | null>(
    parsed.valid ? null : parsed.error,
  );
  const [authResult, setAuthResult] = React.useState<AuthResponse | null>(
    null,
  );

  // Race condition prevention refs
  const mountedRef = React.useRef(true);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const redirectTimeoutRef = React.useRef<number | null>(null);
  const authAttemptedRef = React.useRef(false);

  // Cleanup on unmount
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const redirectToCli = React.useCallback(
    (response: AuthResponse) => {
      if (!parsed.valid) return;

      const callbackUrl = new URL(parsed.redirectUrl.toString());
      callbackUrl.searchParams.set("jwt", response.jwt);
      callbackUrl.searchParams.set("state", parsed.state);
      if (response.user.accessTokenAlias) {
        callbackUrl.searchParams.set("alias", response.user.accessTokenAlias);
      }
      callbackUrl.searchParams.set("user_id", response.user.id);

      authLogger.info("CLI authentication successful, redirecting");
      window.location.href = callbackUrl.toString();
    },
    [parsed],
  );

  const redirectWithError = React.useCallback(
    (errorCode: CliAuthErrorCode) => {
      if (!parsed.valid) return;

      const callbackUrl = new URL(parsed.redirectUrl.toString());
      callbackUrl.searchParams.set("error", errorCode);
      callbackUrl.searchParams.set("state", parsed.state);

      window.location.href = callbackUrl.toString();
    },
    [parsed],
  );

  const handleAuthenticate = React.useCallback(async () => {
    if (!wallet || !parsed.valid) return;

    // Abort any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState("authenticating");

    try {
      // Capture starting address for wallet switch detection
      // Timeout protects against wallet extension not being fully ready
      const startAddress = await withTimeout(
        getWalletAddressBech32(wallet), 10_000, "Wallet address request"
      );

      if (signal.aborted) return;

      const authResponse = await authenticateWithWallet({
        signMessage: async (nonce: string) => {
          if (signal.aborted)
            throw new DOMException("Aborted", "AbortError");
          const nonceHex = stringToHex(nonce);
          return wallet.signData(startAddress, nonceHex);
        },
        address: startAddress,
        walletName: walletName ?? undefined,
        convertUTF8: false,
        getAssets: async () => {
          if (signal.aborted)
            throw new DOMException("Aborted", "AbortError");
          return wallet.getBalanceMesh();
        },
      });

      // Verify wallet hasn't changed during auth
      if (!mountedRef.current || signal.aborted) return;

      try {
        const currentAddress = await getWalletAddressBech32(wallet);
        if (currentAddress !== startAddress) {
          throw new Error("Wallet changed during authentication");
        }
      } catch {
        throw new Error("Wallet disconnected during authentication");
      }

      setState("redirecting");
      setAuthResult(authResponse);

      // Brief delay so user sees success before redirect
      redirectTimeoutRef.current = window.setTimeout(() => {
        if (mountedRef.current) {
          redirectToCli(authResponse);
        }
      }, 300);
    } catch (error) {
      if (signal.aborted || !mountedRef.current) return;

      // AbortError means we cancelled intentionally
      if (error instanceof DOMException && error.name === "AbortError") return;

      const classified = classifyAuthError(error);
      setState("error");
      setAuthError(classified);
    }
  }, [wallet, walletName, parsed, redirectToCli]);

  // Auto-authenticate when wallet connects (with StrictMode dedup)
  // Short delay lets the wallet extension fully initialize its CIP-30 API
  React.useEffect(() => {
    if (authAttemptedRef.current) return;
    if (state === "ready" && connected && wallet) {
      const timer = setTimeout(() => {
        if (!mountedRef.current || authAttemptedRef.current) return;
        authAttemptedRef.current = true;
        void handleAuthenticate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state, connected, wallet, handleAuthenticate]);

  const handleRetry = React.useCallback(() => {
    authAttemptedRef.current = false;
    setAuthError(null);
    setState("ready");
  }, []);

  const handleCancel = React.useCallback(() => {
    if (parsed.valid) {
      redirectWithError("user_cancelled");
    }
  }, [parsed, redirectWithError]);

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="flex min-h-screen items-center justify-center overflow-auto bg-background p-4">
      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Terminal-style accent line */}
        <div className="absolute -left-4 bottom-8 top-8 hidden w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent sm:block" />

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-border/50 bg-muted">
              <TerminalIcon className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <AndamioHeading level={1} size="xl">
                CLI Authentication
              </AndamioHeading>
              <AndamioText variant="muted" className="text-sm font-mono">
                andamio-cli
              </AndamioText>
            </div>
          </div>

          {/* State: Invalid Request */}
          {state === "invalid-request" && authError && (
            <AndamioCard>
              <AndamioCardHeader>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <LinkIcon className="h-5 w-5 text-destructive" />
                </div>
                <AndamioCardTitle className="text-center">
                  {authError.title}
                </AndamioCardTitle>
                <AndamioCardDescription className="mx-auto max-w-sm text-center">
                  {authError.description}
                </AndamioCardDescription>
              </AndamioCardHeader>
              <AndamioCardContent>
                <div className="rounded-sm border bg-muted/30 p-4 space-y-2">
                  <AndamioText variant="small" className="font-medium">
                    How to fix
                  </AndamioText>
                  <AndamioText
                    variant="small"
                    className="text-muted-foreground"
                  >
                    Run{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      andamio login
                    </code>{" "}
                    from your terminal to start a new authentication session.
                  </AndamioText>
                </div>
              </AndamioCardContent>
              <AndamioCardFooter>
                <AndamioButton
                  variant="outline"
                  className="w-full"
                  onClick={() => window.close()}
                >
                  Close Window
                </AndamioButton>
              </AndamioCardFooter>
            </AndamioCard>
          )}

          {/* State: Ready (waiting for wallet) */}
          {state === "ready" && (
            <AndamioCard className="border-primary/20">
              <AndamioCardHeader>
                <AndamioCardTitle>Connect Your Wallet</AndamioCardTitle>
                <AndamioCardDescription>
                  The Andamio CLI is requesting access to your account. Connect
                  your wallet and sign to authenticate.
                </AndamioCardDescription>
              </AndamioCardHeader>
              <AndamioCardContent className="space-y-4">
                {/* Permissions info */}
                <div className="rounded-sm border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldIcon className="h-4 w-4 text-muted-foreground" />
                    <AndamioText variant="small" className="font-medium">
                      This will allow the CLI to:
                    </AndamioText>
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                      Access your courses and learning progress
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                      Manage content on your behalf
                    </li>
                  </ul>
                </div>

                {/* Session ID */}
                {parsed.valid && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Session</span>
                    <code className="font-mono">
                      {parsed.state.slice(0, 8)}...
                    </code>
                  </div>
                )}

                <div className="flex justify-center">
                  <ConnectWalletButton />
                </div>
              </AndamioCardContent>
              <AndamioCardFooter className="justify-center">
                <button
                  onClick={handleCancel}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
              </AndamioCardFooter>
            </AndamioCard>
          )}

          {/* State: Authenticating */}
          {state === "authenticating" && (
            <AndamioCard className="border-primary/20">
              <AndamioCardContent className="py-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <LoadingIcon className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <div className="text-center space-y-1">
                    <AndamioText className="font-medium">
                      Awaiting wallet signature
                    </AndamioText>
                    <AndamioText
                      variant="small"
                      className="text-muted-foreground"
                    >
                      Check your wallet extension for a signing prompt
                    </AndamioText>
                  </div>
                </div>
              </AndamioCardContent>
            </AndamioCard>
          )}

          {/* State: Redirecting (success) */}
          {state === "redirecting" && authResult && (
            <AndamioCard>
              <AndamioCardHeader className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <SuccessIcon className="h-8 w-8 text-primary" />
                </div>
                <AndamioCardTitle className="text-2xl">
                  Authenticated
                </AndamioCardTitle>
                <AndamioCardDescription className="mx-auto max-w-sm text-center text-base">
                  Redirecting back to CLI...
                </AndamioCardDescription>
              </AndamioCardHeader>
              {authResult.user.accessTokenAlias && (
                <AndamioCardContent>
                  <div className="rounded-sm border border-primary/20 bg-primary/5 p-4 text-center">
                    <AndamioText
                      variant="small"
                      className="text-muted-foreground"
                    >
                      Signed in as
                    </AndamioText>
                    <p className="mt-1 font-mono text-lg font-semibold text-primary">
                      {authResult.user.accessTokenAlias}
                    </p>
                  </div>
                </AndamioCardContent>
              )}
            </AndamioCard>
          )}

          {/* State: Error */}
          {state === "error" && authError && (
            <AndamioCard>
              <AndamioCardHeader>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <ErrorIcon className="h-5 w-5 text-destructive" />
                </div>
                <AndamioCardTitle className="text-center">
                  {authError.title}
                </AndamioCardTitle>
                <AndamioCardDescription className="mx-auto max-w-sm text-center">
                  {authError.description}
                </AndamioCardDescription>
              </AndamioCardHeader>
              <AndamioCardContent className="space-y-4">
                <div className="rounded-sm border bg-muted/30 p-4 space-y-2">
                  <AndamioText variant="small" className="font-medium">
                    What to do next
                  </AndamioText>
                  <AndamioText
                    variant="small"
                    className="text-muted-foreground"
                  >
                    {authError.code === "user_cancelled"
                      ? "Click retry to try again, or close this window."
                      : "Check your wallet connection and try again. If the problem persists, run `andamio login` to start over."}
                  </AndamioText>
                </div>

                <div className="flex gap-3">
                  <AndamioButton
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancel}
                  >
                    Cancel
                  </AndamioButton>
                  <AndamioButton className="flex-1" onClick={handleRetry}>
                    Retry
                  </AndamioButton>
                </div>

                {/* Error code for debugging */}
                <div className="flex items-center justify-center">
                  <code className="text-xs text-muted-foreground font-mono">
                    {authError.code}
                  </code>
                </div>
              </AndamioCardContent>
            </AndamioCard>
          )}
        </div>
      </div>
    </div>
  );
}
