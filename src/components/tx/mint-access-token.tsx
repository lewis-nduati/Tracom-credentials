/**
 * MintAccessToken Component
 *
 * UI for minting a new Andamio Access Token NFT.
 * Uses the transaction hook with gateway auto-confirmation.
 *
 * ## TX Lifecycle
 *
 * 1. User enters alias and clicks "Mint"
 * 2. `useTransaction` builds, signs, submits, and registers TX
 * 3. `useTxStream` polls gateway for confirmation status
 * 4. When status is "updated", gateway has completed DB updates
 * 5. **Celebration flow begins** - session cleared, user re-authenticates
 * 6. User is welcomed with their new on-chain identity
 *
 * ## Post-Mint Ceremony
 *
 * After TX confirmation, the component transitions to a celebration state:
 * - Clears the session (forces re-auth with new access token)
 * - Shows celebration UI with confetti
 * - Guides user through re-authentication
 * - Welcomes them to Andamio with their new identity
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-stream.ts
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@meshsdk/react";
import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { useHasPendingAccessTokenTx } from "~/hooks/tx/use-pending-access-token-tx";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { parseTxErrorMessage } from "~/lib/tx-error-messages";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  AccessTokenIcon,
  ShieldIcon,
  LoadingIcon,
  SuccessIcon,
  InfoIcon,
  CelebrateIcon,
  ExternalLinkIcon,
  ErrorIcon,
} from "~/components/icons";
import { storeJWT, markAwaitingMintedToken, clearAwaitingMintedToken } from "~/lib/andamio-auth";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";
import { useUpdateAccessTokenAlias } from "~/hooks/api/use-user";
import { getTransactionExplorerUrl } from "~/lib/constants";
import { getWalletAddressBech32 } from "~/lib/wallet-address";
import { env } from "~/env";

export interface MintAccessTokenProps {
  /**
   * Callback fired when access token is successfully minted AND user has
   * re-authenticated with their new token. This is the final success state.
   */
  onSuccess?: () => void | Promise<void>;
  /**
   * Callback fired after TX is submitted, with the alias and txHash.
   * Useful for parent components that need to track the submission
   * (e.g., showing TX status or the first-login ceremony).
   */
  onSubmitted?: (info: { alias: string; txHash: string }) => void;
  /**
   * If true, skips the inline ceremony and just shows the mint form.
   * Parent component is responsible for handling the ceremony (e.g., FirstLoginCard).
   * Default: false (inline ceremony is shown)
   */
  skipCeremony?: boolean;
}

/**
 * Ceremony states for the post-mint flow
 */
type CeremonyState =
  | "minting"           // Default: user is filling out the form or TX in progress
  | "confirming"        // TX submitted, waiting for on-chain confirmation
  | "celebration"       // TX confirmed! Show celebration, then clear session
  | "reconnecting"      // Session cleared, waiting for wallet reconnect
  | "authenticating"    // Wallet connected, authenticating
  | "welcome";          // Re-authenticated with new token, welcome message

// Alias must contain only alphanumeric characters and underscores
const ALIAS_PATTERN = /^[a-zA-Z0-9_]+$/;

function isValidAlias(alias: string): boolean {
  return alias.length > 0 && ALIAS_PATTERN.test(alias);
}

/**
 * MintAccessToken - Mint an Andamio Access Token NFT
 *
 * @example
 * ```tsx
 * <MintAccessToken onSuccess={() => router.refresh()} />
 * ```
 */
export function MintAccessToken({ onSuccess, onSubmitted, skipCeremony = false }: MintAccessTokenProps) {
  const router = useRouter();
  const { wallet, connected } = useWallet();
  const {
    user,
    isAuthenticated,
    isAuthenticating,
    authError,
    refreshAuth,
    logout,
  } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();
  const updateAlias = useUpdateAccessTokenAlias();
  const [alias, setAlias] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Ceremony state management
  const [ceremonyState, setCeremonyState] = useState<CeremonyState>("minting");
  const [confirmedAlias, setConfirmedAlias] = useState<string>("");
  const [confirmedTxHash, setConfirmedTxHash] = useState<string | null>(null);

  // Detect existing access token in wallet — prevents duplicate mints.
  // "checking" is the initial sentinel (scan not yet complete); null means no
  // token found; a string is the existing alias.
  const [walletTokenAlias, setWalletTokenAlias] = useState<string | null>("checking");

  // True when an access-token tx is already in flight (this session). The
  // wallet check above only sees *confirmed* tokens, so this guards the
  // 20–90s on-chain confirmation window against a second mint.
  const hasPendingMint = useHasPendingAccessTokenTx();

  useEffect(() => {
    if (!connected || !wallet) {
      setWalletTokenAlias(null);
      return;
    }
    void (async () => {
      try {
        const assets = await wallet.getBalanceMesh();
        const ACCESS_TOKEN_POLICY_ID = env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID;
        const token = assets.find((a) => a.unit.startsWith(ACCESS_TOKEN_POLICY_ID));
        if (token) {
          const { extractAliasFromUnit } = await import("~/lib/access-token-utils");
          setWalletTokenAlias(extractAliasFromUnit(token.unit, ACCESS_TOKEN_POLICY_ID) ?? "unknown");
        } else {
          setWalletTokenAlias(null);
        }
      } catch {
        setWalletTokenAlias(null);
      }
    })();
  }, [connected, wallet]);

  // Alias availability check (debounced)
  const [aliasAvailability, setAliasAvailability] = useState<
    "idle" | "checking" | "available" | "taken" | "error"
  >("idle");
  const availabilityTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const checkAliasAvailability = React.useCallback((value: string) => {
    if (availabilityTimerRef.current) clearTimeout(availabilityTimerRef.current);
    const trimmed = value.trim();
    if (!trimmed || !isValidAlias(trimmed)) {
      setAliasAvailability("idle");
      return;
    }
    setAliasAvailability("checking");
    availabilityTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/gateway/api/v2/user/exists/${encodeURIComponent(trimmed)}`);
          if (!res.ok) { setAliasAvailability("error"); return; }
          const data = (await res.json()) as { exists?: boolean };
          setAliasAvailability(data.exists ? "taken" : "available");
        } catch {
          setAliasAvailability("error");
        }
      })();
    }, 500);
  }, []);

  React.useEffect(() => {
    return () => { if (availabilityTimerRef.current) clearTimeout(availabilityTimerRef.current); };
  }, []);

  // Check for pending alias from registration flow (stored in localStorage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pendingAlias = localStorage.getItem("andamio_pending_alias");
      if (pendingAlias) {
        setAlias(pendingAlias);
        localStorage.removeItem("andamio_pending_alias");
      }
    }
  }, []);

  // Get wallet address from connected wallet
  useEffect(() => {
    if (!connected || !wallet) {
      setWalletAddress(null);
      return;
    }

    void (async () => {
      try {
        // MeshSDK v2: use Bech32 variants directly (no manual conversion needed)
        let bech32Address: string | undefined;
        try {
          const addresses = await wallet.getUsedAddressesBech32();
          bech32Address = addresses[0];
        } catch {
          // Fallback: some wallet CIP-30 implementations return non-hex
        }

        if (!bech32Address) {
          bech32Address = await getWalletAddressBech32(wallet);
        }

        if (!bech32Address) {
          setWalletAddress(null);
          return;
        }

        setWalletAddress(bech32Address);
      } catch (err) {
        console.error("[MintAccessToken] Failed to get wallet address:", err);
        setWalletAddress(null);
      }
    })();
  }, [connected, wallet]);

  // Track if we've already handled the success to prevent double-triggering.
  // Shared between the onComplete callback and the confirmed-state watcher below.
  const hasHandledSuccessRef = React.useRef(false);

  // Watch for gateway confirmation after TX submission
  // Tracks on-chain confirmation via SSE (pending → confirmed → updated)
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    (result?.requiresDBUpdate || result?.requiresOnChainConfirmation) ? result.txHash : null,
    {
      onComplete: (status) => {
        // "updated" = gateway confirmed TX AND updated DB.
        // "confirmed" = on-chain confirmed; may arrive here as the stall-timeout
        // terminal for no-DB-update TXs (requiresDBUpdate: false) where the
        // gateway never transitions past "confirmed".
        if (status.state === "updated" || status.state === "confirmed") {
          if (hasHandledSuccessRef.current) return;
          hasHandledSuccessRef.current = true;

          // Tell the auth layer to wait for the freshly minted token to show up
          // in the wallet (indexer can lag behind on-chain confirmation).
          markAwaitingMintedToken();

          if (skipCeremony) {
            refreshAuth();
            toast.success("Access token created", {
              description: `Your alias ${alias} is now live on Cardano.`,
            });
            void onSuccess?.();
          } else {
            setCeremonyState("celebration");
            setTimeout(() => {
              logout("access_token_mint");
              setCeremonyState("reconnecting");
            }, 2000);
          }
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Transaction Processing Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  // For pure on-chain TXs with no tracking at all, treat submission as success
  // TXs with requiresOnChainConfirmation wait for gateway confirmation instead
  const isPureOnChainSuccess = state === "success" && result && !result.requiresDBUpdate && !result.requiresOnChainConfirmation;

  // Handle pure on-chain TX success (e.g., Access Token Mint)
  useEffect(() => {
    if (isPureOnChainSuccess && !hasHandledSuccessRef.current) {
      hasHandledSuccessRef.current = true;
      markAwaitingMintedToken();

      if (skipCeremony) {
        refreshAuth();
        void onSuccess?.();
      } else {
        setCeremonyState("celebration");
        setTimeout(() => {
          logout("access_token_mint");
          setCeremonyState("reconnecting");
        }, 2000);
      }
    }
  }, [isPureOnChainSuccess, refreshAuth, onSuccess, skipCeremony, logout]);

  // Immediate ceremony trigger when gateway says "confirmed".
  // For access token mints (requiresDBUpdate: false) the gateway may never
  // transition to "updated" — "confirmed" is the success signal.
  // This avoids waiting for the 30s stall timeout before the ceremony starts.
  useEffect(() => {
    if (
      txStatus?.state === "confirmed" &&
      result?.requiresOnChainConfirmation &&
      !result?.requiresDBUpdate &&
      !hasHandledSuccessRef.current
    ) {
      hasHandledSuccessRef.current = true;
      markAwaitingMintedToken();

      if (skipCeremony) {
        refreshAuth();
        toast.success("Access token created", {
          description: `Your alias ${alias} is now live on Cardano.`,
        });
        void onSuccess?.();
      } else {
        setCeremonyState("celebration");
        setTimeout(() => {
          logout("access_token_mint");
          setCeremonyState("reconnecting");
        }, 2000);
      }
    }
  }, [
    txStatus?.state,
    result?.requiresOnChainConfirmation,
    result?.requiresDBUpdate,
    skipCeremony,
    refreshAuth,
    alias,
    onSuccess,
    logout,
  ]);

  // Reset the ref when state goes back to idle (for subsequent mints)
  useEffect(() => {
    if (state === "idle") {
      hasHandledSuccessRef.current = false;
    }
  }, [state]);

  // Track ceremony state transitions based on auth state
  useEffect(() => {
    if (ceremonyState === "reconnecting") {
      if (isAuthenticating) {
        setCeremonyState("authenticating");
      } else if (isAuthenticated && user?.accessTokenAlias) {
        setCeremonyState("welcome");
      }
    } else if (ceremonyState === "authenticating") {
      if (isAuthenticated && user?.accessTokenAlias) {
        setCeremonyState("welcome");
      } else if (!isAuthenticating && (authError || isAuthenticated)) {
        // Either auth failed, or it succeeded but the freshly minted token still
        // wasn't in the wallet after the bounded wait. Drop back to reconnecting
        // so the user can retry connecting (the token is on-chain; it shows up
        // shortly). This screen is user-gated, so it won't loop on its own.
        setCeremonyState("reconnecting");
      }
    }
  }, [ceremonyState, isAuthenticating, isAuthenticated, user?.accessTokenAlias, authError]);

  // After welcome state, redirect to dashboard after a delay
  useEffect(() => {
    if (ceremonyState === "welcome") {
      clearAwaitingMintedToken();
      const timer = setTimeout(() => {
        void onSuccess?.();
        router.push("/dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [ceremonyState, onSuccess, router]);

  // Get explorer URL for the transaction
  const explorerUrl = confirmedTxHash
    ? getTransactionExplorerUrl(confirmedTxHash, env.NEXT_PUBLIC_CARDANO_NETWORK)
    : null;

  // Get UI config from centralized config
  const ui = TRANSACTION_UI.GLOBAL_GENERAL_ACCESS_TOKEN_MINT;

  const aliasError =
    alias.trim() && !isValidAlias(alias.trim())
      ? "Alias can only contain letters, numbers, and underscores"
      : null;

  const handleMint = async () => {
    if (!walletAddress || !alias.trim()) {
      // Early return - wallet or alias not ready
      return;
    }
    // Block a second mint while one is still confirming on-chain.
    if (hasPendingMint) {
      return;
    }

    // Store the alias for the ceremony
    const mintingAlias = alias.trim();
    setConfirmedAlias(mintingAlias);
    setCeremonyState("minting");

    await execute({
      txType: "GLOBAL_GENERAL_ACCESS_TOKEN_MINT",
      params: {
        initiator_data: walletAddress,
        alias: mintingAlias,
      },
      onSuccess: async (txResult) => {
        // Store TX hash for ceremony (explorer link)
        setConfirmedTxHash(txResult.txHash);

        // Notify parent of submission (for TX tracking / first-login ceremony)
        onSubmitted?.({ alias: mintingAlias, txHash: txResult.txHash });

        // Transition to confirming state
        setCeremonyState("confirming");

        // Optimistically update the alias in the database for immediate use
        // The gateway will also update it on confirmation, but this gives instant feedback
        try {
          const aliasResult = await updateAlias.mutateAsync({ alias: mintingAlias });
          if (aliasResult) {
            // Store the new JWT with updated alias
            storeJWT(aliasResult.jwt);
            refreshAuth();
          }
        } catch (dbError) {
          console.error("[MintAccessToken] Optimistic update failed:", dbError);
          // Non-critical - gateway will handle on confirmation
        }
      },
      onError: (txError) => {
        console.error("[MintAccessToken] Transaction error:", txError);
        // Error toast already shown by hook
      },
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CEREMONY STATES - Show celebration flow after TX confirmation
  // ═══════════════════════════════════════════════════════════════════════════

  // ── WELCOME: Re-authenticated with new token ──
  if (ceremonyState === "welcome" && user?.accessTokenAlias) {
    return (
      <AndamioCard className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <AndamioCardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <SuccessIcon className="h-10 w-10 text-primary" />
          </div>
          <AndamioCardTitle className="text-2xl">Welcome to Tracom Academy!</AndamioCardTitle>
          <AndamioCardDescription className="mx-auto max-w-sm text-center text-base">
            You&apos;re now signed in as{" "}
            <span className="font-mono font-semibold text-foreground">{user.accessTokenAlias}</span>
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-4 gap-3">
            <LoadingIcon className="h-6 w-6 animate-spin text-primary" />
            <AndamioText variant="muted">Redirecting to your dashboard...</AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── AUTHENTICATING: Wallet connected, signing in ──
  if (ceremonyState === "authenticating") {
    return (
      <AndamioCard>
        <AndamioCardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <AccessTokenIcon className="h-8 w-8 text-primary" />
          </div>
          <AndamioCardTitle className="text-xl">Signing In...</AndamioCardTitle>
          <AndamioCardDescription className="mx-auto max-w-sm text-center">
            Authenticating with your new access token
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex items-center justify-center py-4">
            <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── RECONNECTING: Session cleared, waiting for wallet ──
  if (ceremonyState === "reconnecting") {
    return (
      <AndamioCard>
        <AndamioCardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <AccessTokenIcon className="h-8 w-8 text-primary" />
          </div>
          <AndamioCardTitle className="text-xl">
            Almost Done!
          </AndamioCardTitle>
          <AndamioCardDescription className="mx-auto max-w-sm text-center">
            Connect your wallet to activate your access token.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          {authError && (
            <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-3">
              <AndamioText variant="small" className="text-destructive">
                {authError}
              </AndamioText>
            </div>
          )}
          <ConnectWalletButton />
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <InfoIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <AndamioText variant="small" className="text-muted-foreground">
              This creates a fresh session with your new on-chain identity as{" "}
              <span className="font-mono font-semibold">{confirmedAlias}</span>.
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── CELEBRATION: TX confirmed! Show the special moment ──
  if (ceremonyState === "celebration") {
    return (
      <AndamioCard className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        <AndamioCardHeader className="text-center pb-2 relative">
          {/* Celebration confetti effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div className="absolute top-0 left-1/4 text-2xl animate-pulse" style={{ animationDelay: "0ms" }}>🎉</div>
            <div className="absolute top-2 right-1/4 text-2xl animate-pulse" style={{ animationDelay: "200ms" }}>✨</div>
            <div className="absolute top-4 left-1/3 text-xl animate-pulse" style={{ animationDelay: "400ms" }}>🎊</div>
            <div className="absolute top-1 right-1/3 text-xl animate-pulse" style={{ animationDelay: "600ms" }}>⭐</div>
          </div>

          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 relative z-10">
            <CelebrateIcon className="h-10 w-10 text-primary" />
          </div>
          <AndamioCardTitle className="text-2xl">
            Access token created
          </AndamioCardTitle>
          <AndamioCardDescription className="mx-auto max-w-sm text-center text-base">
            Your alias{" "}
            <span className="font-mono font-semibold text-foreground">{confirmedAlias}</span>{" "}
            is now live on Cardano.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-5">
          {/* The ceremony message with auto-progress indicator */}
          <div className="rounded-sm border border-primary/20 bg-primary/5 p-5 text-center space-y-3">
            <AndamioText className="font-semibold text-lg">
              Welcome to Tracom Academy!
            </AndamioText>
            <div className="flex items-center justify-center gap-2">
              <LoadingIcon className="h-4 w-4 animate-spin text-primary" />
              <AndamioText variant="muted">
                Preparing your session...
              </AndamioText>
            </div>
          </div>

          {/* Explorer link */}
          {explorerUrl && (
            <div className="flex items-center justify-center">
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View transaction on explorer
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT: Minting form and TX progress
  // ═══════════════════════════════════════════════════════════════════════════

  if (!isAuthenticated || !user) {
    return null;
  }

  // Guard: wallet already has an access token — block duplicate mints
  if (walletTokenAlias && walletTokenAlias !== "checking") {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <AccessTokenIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <AndamioCardTitle>Access token detected</AndamioCardTitle>
              <AndamioCardDescription>
                Your wallet already has an access token for{" "}
                <span className="font-mono font-semibold text-foreground">{walletTokenAlias}</span>.
              </AndamioCardDescription>
            </div>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-3">
          <AndamioText variant="small" className="text-muted-foreground">
            Sign out and sign back in to activate your existing identity. You do not need to mint again.
          </AndamioText>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Guard: an access-token mint is already in flight this session but this
  // instance hasn't started its own ceremony (e.g. a fresh remount). The
  // wallet check can't see the unconfirmed token yet, so block the form to
  // prevent a second mint. Scoped to "minting" so it never overrides this
  // instance's own confirming/celebration UI.
  if (ceremonyState === "minting" && hasPendingMint) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <LoadingIcon className="h-5 w-5 animate-spin text-primary" />
            </div>
            <div className="flex-1">
              <AndamioCardTitle>Creating your access token</AndamioCardTitle>
              <AndamioCardDescription>
                This usually takes 20–60 seconds to confirm on Cardano.
              </AndamioCardDescription>
            </div>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioText variant="small" className="text-muted-foreground">
            No need to mint again — you&apos;ll be signed in automatically once it confirms.
          </AndamioText>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <AccessTokenIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>Mint your unique on-chain identity</AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* What You're Getting */}
        <div className="rounded-sm border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-4 w-4 text-primary" />
            <AndamioText className="font-medium">On-Chain Identity</AndamioText>
          </div>
          <AndamioText variant="small" className="text-xs">
            {ui.description[0]}
          </AndamioText>
        </div>

        {/* Alias Input */}
        <div className="space-y-2">
          <AndamioLabel htmlFor="alias-simple">Choose Your Alias</AndamioLabel>
          <AndamioInput
            id="alias-simple"
            type="text"
            placeholder="my_unique_alias"
            value={alias}
            onChange={(e) => { setAlias(e.target.value); checkAliasAvailability(e.target.value); }}
            disabled={state !== "idle" && state !== "error"}
            className={`font-mono ${aliasError || aliasAvailability === "taken" ? "border-destructive" : aliasAvailability === "available" ? "border-primary" : ""}`}
          />
          {aliasError ? (
            <AndamioText variant="small" className="text-xs text-destructive">
              {aliasError}
            </AndamioText>
          ) : aliasAvailability === "taken" ? (
            <div className="flex items-center gap-1.5">
              <ErrorIcon className="h-3.5 w-3.5 shrink-0 text-destructive" />
              <AndamioText variant="small" className="text-xs text-destructive">
                This alias is already taken. Choose a different one.
              </AndamioText>
            </div>
          ) : aliasAvailability === "available" ? (
            <div className="flex items-center gap-1.5">
              <SuccessIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
              <AndamioText variant="small" className="text-xs text-primary">
                Available!
              </AndamioText>
            </div>
          ) : aliasAvailability === "checking" ? (
            <div className="flex items-center gap-1.5">
              <LoadingIcon className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
              <AndamioText variant="small" className="text-xs">
                Checking availability...
              </AndamioText>
            </div>
          ) : (
            <AndamioText variant="small" className="text-xs">
              Letters, numbers, and underscores only. This will be your unique identifier.
            </AndamioText>
          )}
        </div>

        {/* Transaction Status (only show during processing) */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={parseTxErrorMessage(error?.message)}
            onRetry={() => reset()}
            messages={{
              success: (result?.requiresDBUpdate || result?.requiresOnChainConfirmation)
                ? "Transaction submitted! Waiting for confirmation..."
                : "Transaction submitted to blockchain!",
            }}
          />
        )}

        {/* Gateway Confirmation Status */}
        {state === "success" && (result?.requiresDBUpdate || result?.requiresOnChainConfirmation) && !txConfirmed && !txFailed && (
          <div className="rounded-sm border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
              <div className="flex-1">
                <AndamioText className="font-medium">Confirming on blockchain...</AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {txStatus?.state === "pending" && "Waiting for block confirmation"}
                  {txStatus?.state === "confirmed" && "Finalizing..."}
                  {!txStatus && "Registering transaction..."}
                </AndamioText>
                <AndamioText variant="small" className="text-xs text-muted-foreground">
                  This usually takes 20–60 seconds.
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* TX Failed */}
        {txFailed && (
          <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <AndamioText className="font-medium text-destructive">
                  Transaction Failed
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {txStatus?.last_error ?? "Please try again."}
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Mint Button */}
        {state !== "success" && !txConfirmed && ceremonyState === "minting" && (
          <TransactionButton
            txState={state}
            onClick={handleMint}
            disabled={!walletAddress || !alias.trim() || !!aliasError || aliasAvailability === "taken" || aliasAvailability === "checking" || state === "error"}
            stateText={{
              idle: !walletAddress ? "Loading wallet..." : ui.buttonText,
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Creating...",
            }}
            leftIcon={state === "idle" ? <AccessTokenIcon className="h-5 w-5" /> : undefined}
            size="lg"
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
