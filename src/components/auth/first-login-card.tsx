"use client";

import React from "react";
import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import {
  LoadingIcon,
  ExternalLinkIcon,
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
   * Terminal message shown during the 2s delay before `onActivated` fires.
   */
  terminalMessage?: string;
}

/**
 * Shown after minting an access token.
 *
 * Flow:
 * 1. Tracks TX confirmation via SSE
 * 2. Once confirmed, auto-logouts after 2s
 * 3. Shows wallet connect button for re-connection
 * 4. Wallet connects → auto-auth picks up the new token → onActivated fires
 *
 * `onActivated` only fires when the re-authenticated wallet carries the same
 * alias the ceremony was initiated for, preventing a mid-ceremony identity swap.
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

  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    txHash,
    {
      onComplete: (status) => {
        if (status.state === "updated" && !hasLoggedOut) {
          setTimeout(() => {
            setHasLoggedOut(true);
            logout("access_token_mint");
          }, 2000);
        }
      },
    }
  );

  // Client-side stall fallback. The gateway's tx-watcher stall timeout (~30s)
  // is the primary signal, but a broken SSE stream could leave the user stuck.
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

  // Identity-bound terminal state: a mid-ceremony wallet swap will NOT satisfy
  // this predicate, so onActivated won't fire under the wrong alias.
  const isActivatedWithExpectedAlias =
    hasLoggedOut && isAuthenticated && user?.accessTokenAlias === alias;

  React.useEffect(() => {
    if (!isActivatedWithExpectedAlias) return;
    const timer = setTimeout(() => {
      onActivated();
    }, 2000);
    return () => clearTimeout(timer);
  }, [isActivatedWithExpectedAlias, onActivated]);

  // ── Re-authenticated with matching alias: activation handoff ──
  if (isActivatedWithExpectedAlias) {
    return (
      <AndamioCard className="w-full max-w-md mx-auto">
        <AndamioCardHeader className="pb-2">
          <AndamioText variant="overline" className="mb-1">Welcome</AndamioText>
          <AndamioCardTitle className="text-xl">
            Signed in as <span className="font-mono">{alias}</span>
          </AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex items-center gap-2 py-4">
            <LoadingIcon className="h-5 w-5 animate-spin text-muted-foreground" />
            <AndamioText variant="muted" className="text-sm">{terminalMessage}</AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── Logged out, wallet reconnecting / authenticating ──
  if (hasLoggedOut && isAuthenticating) {
    return (
      <AndamioCard className="w-full max-w-md mx-auto">
        <AndamioCardHeader className="pb-2">
          <AndamioText variant="overline" className="mb-1">Signing in</AndamioText>
          <AndamioCardTitle className="text-xl">One moment...</AndamioCardTitle>
          <AndamioCardDescription>Authenticating with your new access token</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex items-center justify-center py-6">
            <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── Auth error during re-auth ──
  if (hasLoggedOut && authError) {
    return (
      <AndamioCard className="w-full max-w-md mx-auto">
        <AndamioCardHeader className="pb-2">
          <AndamioText variant="overline" className="mb-1">Signing in</AndamioText>
          <AndamioCardTitle className="text-xl">Sign-in failed</AndamioCardTitle>
          <AndamioCardDescription>
            Your token may still be confirming on-chain.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <AndamioAlert variant="destructive">
            <AndamioAlertDescription>{authError}</AndamioAlertDescription>
          </AndamioAlert>
          <AndamioText variant="small" className="text-center">
            Wait for the transaction to confirm, then reconnect your wallet.
          </AndamioText>
          <ConnectWalletButton />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── Logged out, waiting for the correct wallet to reconnect ──
  // Also catches a mid-ceremony wallet swap: if a different wallet reconnects,
  // we keep the user on this card rather than falling through.
  if (
    hasLoggedOut &&
    (!isAuthenticated || user?.accessTokenAlias !== alias)
  ) {
    return (
      <AndamioCard className="w-full max-w-md mx-auto">
        <AndamioCardHeader className="pb-2">
          <AndamioText variant="overline" className="mb-1">Almost done</AndamioText>
          <AndamioCardTitle className="text-xl">One more step</AndamioCardTitle>
          <AndamioCardDescription>
            Sign in as{" "}
            <span className="font-mono font-semibold text-foreground">{alias}</span>{" "}
            to complete setup.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <ConnectWalletButton />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── Default: TX submitted, tracking confirmation ──
  return (
    <AndamioCard className="w-full max-w-md mx-auto">
      <AndamioCardHeader className="pb-2">
        <AndamioText variant="overline" className="mb-1">
          {txConfirmed ? "Confirmed" : "Submitting"}
        </AndamioText>
        <AndamioCardTitle className="text-xl">
          {txConfirmed ? "Your identity is live" : "Transaction submitted"}
        </AndamioCardTitle>
        <AndamioCardDescription>
          {txConfirmed ? (
            <>
              <span className="font-mono font-semibold text-foreground">{alias}</span> is now on-chain.
            </>
          ) : (
            <>
              Creating your identity as{" "}
              <span className="font-mono font-semibold text-foreground">{alias}</span>.
            </>
          )}
        </AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-5">
        {/* TX confirmation status */}
        {!txConfirmed && !txFailed && (
          <div className="rounded-sm border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <LoadingIcon className="h-5 w-5 animate-spin text-muted-foreground flex-shrink-0" />
              <div>
                <AndamioText className="font-medium text-sm">
                  {txStatus?.state === "confirmed" ? "Confirmed on blockchain" : "Waiting for confirmation..."}
                </AndamioText>
                <AndamioText variant="small" className="text-xs text-muted-foreground">
                  {txStatus?.state === "pending" && "Usually takes 1-2 minutes."}
                  {txStatus?.state === "confirmed" && "Finalizing..."}
                  {!txStatus && "Checking status..."}
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

        {/* Client-side stall fallback */}
        {!txConfirmed && !txFailed && confirmationStalled && (
          <AndamioAlert variant="destructive">
            <AndamioAlertDescription>
              We haven&apos;t heard confirmation for this transaction yet. It
              may still succeed — check the explorer. If it does, refresh
              this page to continue.
            </AndamioAlertDescription>
          </AndamioAlert>
        )}

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

        {/* TX confirmed: preparing session */}
        {txConfirmed && (
          <div className="rounded-sm border border-primary/20 bg-primary/5 p-4 space-y-2">
            <AndamioText className="font-semibold text-sm">
              Confirmed. Signing you in...
            </AndamioText>
            <div className="flex items-center gap-2">
              <LoadingIcon className="h-4 w-4 animate-spin text-primary" />
              <AndamioText variant="muted" className="text-sm">
                {terminalMessage}
              </AndamioText>
            </div>
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
