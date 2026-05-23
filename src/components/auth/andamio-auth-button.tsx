"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { LoadingIcon } from "~/components/icons";

/**
 * Complete authentication interface for Andamio
 *
 * Handles:
 * - Wallet connection (via Mesh CardanoWallet)
 * - Wallet authentication (sign message)
 * - JWT storage and management
 * - Authenticated state display
 */
export function AndamioAuthButton() {
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    isAuthenticating,
    authError,
    isWalletConnected,
    popupBlocked,
    authenticate,
    logout,
  } = useAndamioAuth();

  const handleLogout = React.useCallback(() => {
    logout("sign_out");
    router.push("/");
  }, [logout, router]);

  // Authenticated state
  if (isAuthenticated && user) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Connected</AndamioCardTitle>
          <AndamioCardDescription>Your wallet is linked to Andamio</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Wallet:</span>
              <AndamioBadge variant="secondary" className="font-mono text-xs">
                {user.cardanoBech32Addr?.slice(0, 20)}...
              </AndamioBadge>
            </div>
            {user.accessTokenAlias && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Access Token:</span>
                <AndamioBadge variant="outline">{user.accessTokenAlias}</AndamioBadge>
              </div>
            )}
          </div>
          <AndamioButton onClick={handleLogout} variant="destructive" className="w-full">
            Sign Out
          </AndamioButton>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Wallet connected but not authenticated
  // Possible states: authenticating, error, popup blocked, or idle (waiting for user action)
  if (isWalletConnected) {
    // Determine the current state
    const isIdle = !isAuthenticating && !authError && !popupBlocked;

    let title = "Authenticating...";
    let description = "Please sign the message in your wallet";

    if (authError) {
      title = "Authentication Failed";
      description = "Please try again or reconnect your wallet";
    } else if (popupBlocked) {
      // Popup was blocked - show friendly message to retry
      title = "Sign to Continue";
      description = "Click below to sign with your wallet";
    } else if (isIdle) {
      title = "Sign to Continue";
      description = "Sign a message with your wallet to authenticate";
    }

    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>{title}</AndamioCardTitle>
          <AndamioCardDescription>{description}</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          {authError && (
            <AndamioAlert variant="destructive">
              <AndamioAlertDescription>{authError}</AndamioAlertDescription>
            </AndamioAlert>
          )}
          {isAuthenticating ? (
            <div className="flex items-center justify-center py-4">
              <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AndamioButton
              onClick={authenticate}
              disabled={isAuthenticating}
              className="w-full"
            >
              {authError ? "Try Again" : "Sign to Continue"}
            </AndamioButton>
          )}
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // No wallet connected
  return (
    <AndamioCard>
      <AndamioCardHeader>
        <AndamioCardTitle>Connect Wallet</AndamioCardTitle>
        <AndamioCardDescription>
          Connect your Cardano wallet to get started
        </AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent>
        <ConnectWalletButton />
      </AndamioCardContent>
    </AndamioCard>
  );
}
