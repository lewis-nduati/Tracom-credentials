"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { WalletIcon, SuccessIcon, LoadingIcon, ForwardIcon } from "~/components/icons";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { MARKETING } from "~/config/marketing";

/**
 * Landing page card for returning users.
 * Connect wallet -> auto-auth -> redirect to dashboard.
 */
export function LoginCard() {
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    isAuthenticating,
    authError,
    isWalletConnected,
    authenticate,
  } = useAndamioAuth();

  const copy = MARKETING.landingCards.signIn;

  // Auto-redirect when authenticated with an access token
  React.useEffect(() => {
    if (isAuthenticated && user?.accessTokenAlias) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user?.accessTokenAlias, router]);

  // Authenticated with access token — redirecting
  if (isAuthenticated && user?.accessTokenAlias) {
    return (
      <AndamioCard className="flex flex-col">
        <AndamioCardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <SuccessIcon className="h-5 w-5 text-primary" />
          </div>
          <AndamioCardTitle>Welcome back!</AndamioCardTitle>
          <AndamioCardDescription>Redirecting to your dashboard...</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="mt-auto">
          <div className="flex items-center justify-center py-4">
            <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Authenticated but no access token — suggest Get Started
  if (isAuthenticated && !user?.accessTokenAlias) {
    return (
      <AndamioCard className="flex flex-col">
        <AndamioCardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
            <WalletIcon className="h-5 w-5 text-secondary" />
          </div>
          <AndamioCardTitle>No Access Token</AndamioCardTitle>
          <AndamioCardDescription>
            You&apos;re signed in but don&apos;t have an access token yet. Use the Get Started card to mint one, or go directly to the dashboard.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="mt-auto">
          <AndamioButton asChild className="w-full">
            <a href="/dashboard">
              <span>Go to Dashboard</span>
              <ForwardIcon className="ml-auto h-4 w-4" />
            </a>
          </AndamioButton>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Wallet connected but not authenticated — show sign button or spinner
  if (isWalletConnected && !isAuthenticated) {
    return (
      <AndamioCard className="flex flex-col">
        <AndamioCardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <WalletIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <AndamioCardTitle>
            {isAuthenticating ? "Signing in..." : "Sign to Continue"}
          </AndamioCardTitle>
          <AndamioCardDescription>
            {isAuthenticating
              ? "Please sign the message in your wallet"
              : "Click below to sign with your wallet"}
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="mt-auto space-y-3">
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
            <AndamioButton onClick={authenticate} className="w-full">
              {authError ? "Try Again" : "Sign In"}
            </AndamioButton>
          )}
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Default: no wallet connected
  return (
    <AndamioCard className="flex flex-col">
      <AndamioCardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <WalletIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <AndamioCardTitle>{copy.title}</AndamioCardTitle>
        <AndamioCardDescription>{copy.description}</AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="mt-auto">
        <ConnectWalletButton />
      </AndamioCardContent>
    </AndamioCard>
  );
}
