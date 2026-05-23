"use client";

import React from "react";
import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import {
  AccessTokenIcon,
  SuccessIcon,
  LoadingIcon,
  ExternalLinkIcon,
  InfoIcon,
} from "~/components/icons";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioText } from "~/components/andamio/andamio-text";
import { getTransactionExplorerUrl } from "~/lib/constants";
import { env } from "~/env";

interface FirstLoginCardProps {
  alias: string;
  txHash: string | null;
  /**
   * Fires once, ~2s after the new JWT carries an accessTokenAlias matching
   * `alias`. Required — call sites must state where the user goes next.
   */
  onActivated: () => void;
  /**
   * Terminal celebration description shown during the 2s delay before
   * `onActivated` fires. Defaults to the landing copy.
   */
  terminalMessage?: string;
}

/**
 * Celebration card shown after minting an access token.
 *
 * Flow:
 * 1. Shows TX submitted with real-time confirmation status via SSE
 * 2. Once confirmed, shows celebration and auto-logouts after 2s
 * 3. Card shows wallet connect button for re-connection
 * 4. Wallet connects → auto-auth picks up the new token → onActivated fires
 *
 * `onActivated` only fires when the re-authenticated wallet carries the same
 * alias the ceremony was initiated for. This prevents a mid-ceremony identity
 * swap (different wallet reconnects) from revealing the success state.
 */
export function FirstLoginCard({
  alias,
  txHash,
  onActivated,
  terminalMessage = "Redirecting to your dashboard...",
}: FirstLoginCardProps) {
  const {
    isAuthenticated,
    user,
    isAuthenticating,
    authError,
    logout,
  } = useAndamioAuth();

  const [hasLoggedOut, setHasLoggedOut] = React.useState(false);
  const [confirmationStalled, setConfirmationStalled] = React.useState(false);

  // Track on-chain confirmation via gateway SSE
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    txHash,
    {
      onComplete: (status) => {
        // Auto-transition to reconnect flow when TX is confirmed
        if (status.state === "updated" && !hasLoggedOut) {
          console.log("[FirstLoginCard] TX confirmed - auto-transitioning to reconnect flow");
          // Show celebration for 2 seconds, then auto-logout
          setTimeout(() => {
            setHasLoggedOut(true);
            logout("access_token_mint");
          }, 2000);
        }
      },
    }
  );

  // Client-side stall fallback. The gateway's tx-watcher stall timeout (~30s)
  // is the primary signal, but a broken SSE stream or a buggy watcher could
  // leave the user staring at "Access Token Submitted!" indefinitely. Flip
  // to a recoverable error state after 2 minutes.
  React.useEffect(() => {
    if (txConfirmed || txFailed || hasLoggedOut) return;
    const stallTimer = setTimeout(() => {
      setConfirmationStalled(true);
    }, 120_000);
    return () => clearTimeout(stallTimer);
  }, [txConfirmed, txFailed, hasLoggedOut, txHash]);

  const explorerUrl = txHash
    ? getTransactionExplorerUrl(txHash, env.NEXT_PUBLIC_CARDANO_NETWORK)
    : null;

  // Identity-bound terminal state: a mid-ceremony wallet swap will NOT
  // satisfy this predicate, so onActivated won't fire under the wrong alias.
  const isActivatedWithExpectedAlias =
    hasLoggedOut && isAuthenticated && user?.accessTokenAlias === alias;

  // After re-authenticating with the matching alias, fire onActivated.
  React.useEffect(() => {
    if (!isActivatedWithExpectedAlias) return;
    const timer = setTimeout(() => {
      onActivated();
    }, 2000);
    return () => clearTimeout(timer);
  }, [isActivatedWithExpectedAlias, onActivated]);

  // ── Re-authenticated with matching alias: celebration + onActivated handoff ──
  if (isActivatedWithExpectedAlias) {
    return (
      <AndamioCard className="w-full max-w-lg">
        <AndamioCardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <SuccessIcon className="h-8 w-8 text-primary" />
          </div>
          <AndamioCardTitle className="text-2xl">Welcome to Andamio!</AndamioCardTitle>
          <AndamioCardDescription className="mx-auto max-w-sm text-center">
            Signed in as <span className="font-mono font-semibold text-foreground">{alias}</span>. {terminalMessage}
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex items-center justify-center py-4">
            <LoadingIcon className="h-6 w-6 animate-spin text-primary" />
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── Logged out, wallet reconnecting / authenticating ──
  if (hasLoggedOut && isAuthenticating) {
    return (
      <AndamioCard className="w-full max-w-lg">
        <AndamioCardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <AccessTokenIcon className="h-8 w-8 text-primary" />
          </div>
          <AndamioCardTitle className="text-2xl">Signing In...</AndamioCardTitle>
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

  // ── Auth error during re-auth ──
  if (hasLoggedOut && authError) {
    return (
      <AndamioCard className="w-full max-w-lg">
        <AndamioCardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <AccessTokenIcon className="h-8 w-8 text-primary" />
          </div>
          <AndamioCardTitle className="text-2xl">Almost There</AndamioCardTitle>
          <AndamioCardDescription className="mx-auto max-w-sm text-center">
            There was a problem signing in. Your token may still be confirming on-chain.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <AndamioAlert variant="destructive">
            <AndamioAlertDescription>{authError}</AndamioAlertDescription>
          </AndamioAlert>
          <AndamioText variant="small" className="text-center">
            Wait a moment for the transaction to confirm, then reconnect your wallet.
          </AndamioText>
          <ConnectWalletButton />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── Logged out, waiting for the correct wallet to reconnect ──
  // Matches both "not authenticated yet" AND "authenticated but the alias
  // doesn't match the mint". The latter catches a mid-ceremony wallet swap:
  // if a different wallet reconnects, we keep the user on the reconnect card
  // rather than falling through to a stale "TX submitted" render.
  if (
    hasLoggedOut &&
    (!isAuthenticated || user?.accessTokenAlias !== alias)
  ) {
    return (
      <AndamioCard className="w-full max-w-lg">
        <AndamioCardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <AccessTokenIcon className="h-8 w-8 text-primary" />
          </div>
          <AndamioCardTitle className="text-2xl">
            Almost Done!
          </AndamioCardTitle>
          <AndamioCardDescription className="mx-auto max-w-sm text-center">
            Connect your wallet to activate your access token.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <ConnectWalletButton />
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <InfoIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <AndamioText variant="small" className="text-muted-foreground">
              This creates a fresh session with your new on-chain identity as{" "}
              <span className="font-mono font-semibold">{alias}</span>.
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── Default: TX submitted, tracking confirmation, then ceremony ──
  return (
    <AndamioCard className="w-full max-w-lg">
      <AndamioCardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {txConfirmed ? (
            <SuccessIcon className="h-8 w-8 text-primary" />
          ) : (
            <AccessTokenIcon className="h-8 w-8 text-primary" />
          )}
        </div>
        <AndamioCardTitle className="text-2xl">
          {txConfirmed ? "Access Token Confirmed" : "Access Token Submitted!"}
        </AndamioCardTitle>
        <AndamioCardDescription className="mx-auto max-w-sm text-center text-base">
          {txConfirmed ? (
            <>Your alias <span className="font-mono font-semibold text-foreground">{alias}</span> is now live on-chain.</>
          ) : (
            <>Your alias <span className="font-mono font-semibold text-foreground">{alias}</span> is being minted on-chain.</>
          )}
        </AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-5">
        {/* TX confirmation status */}
        {!txConfirmed && !txFailed && (
          <div className="rounded-sm border bg-muted/30 p-4">
            <div className="flex items-center justify-center gap-3">
              <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
              <div>
                <AndamioText className="font-medium">
                  {txStatus?.state === "confirmed" ? "Confirmed on blockchain" : "Waiting for block confirmation"}
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {txStatus?.state === "pending" && "Transaction is in the mempool..."}
                  {txStatus?.state === "confirmed" && "Finalizing..."}
                  {!txStatus && "Registering transaction with gateway..."}
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* TX failed */}
        {txFailed && (
          <AndamioAlert variant="destructive">
            <AndamioAlertDescription>
              {txStatus?.last_error ?? "Transaction failed. Please try again."}
            </AndamioAlertDescription>
          </AndamioAlert>
        )}

        {/* Client-side stall fallback — primary signal is the gateway watcher,
            this catches SSE breakage / watcher bugs that would otherwise hang
            the user here indefinitely. */}
        {!txConfirmed && !txFailed && confirmationStalled && (
          <AndamioAlert variant="destructive">
            <AndamioAlertDescription>
              We haven&apos;t heard confirmation for this transaction yet. It
              may still succeed — check the explorer. If it does, refresh
              this page to continue.
            </AndamioAlertDescription>
          </AndamioAlert>
        )}

        {/* TX explorer link */}
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

        {/* The ceremony — shown once TX is confirmed, auto-transitions after 2 seconds */}
        {txConfirmed && (
          <div className="rounded-sm border border-primary/20 bg-primary/5 p-5 text-center space-y-3">
            <AndamioText className="font-semibold text-lg">
              Welcome to Andamio!
            </AndamioText>
            <div className="flex items-center justify-center gap-2">
              <LoadingIcon className="h-4 w-4 animate-spin text-primary" />
              <AndamioText variant="muted">
                Preparing your session...
              </AndamioText>
            </div>
          </div>
        )}

      </AndamioCardContent>
    </AndamioCard>
  );
}
