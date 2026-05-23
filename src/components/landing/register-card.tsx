"use client";

import React from "react";
import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AccessTokenIcon, SuccessIcon, LoadingIcon, ForwardIcon } from "~/components/icons";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { MintAccessToken } from "~/components/tx/mint-access-token";
import { MARKETING } from "~/config/marketing";

/**
 * Landing page card for new users (grid column version).
 * Shows wallet connect or status indicators.
 */
export function RegisterCard() {
  const {
    isAuthenticated,
    user,
    isAuthenticating,
    isWalletConnected,
  } = useAndamioAuth();

  const copy = MARKETING.landingCards.getStarted;

  // Already has an access token
  if (isAuthenticated && user?.accessTokenAlias) {
    return (
      <AndamioCard className="flex flex-col">
        <AndamioCardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <SuccessIcon className="h-5 w-5 text-primary" />
          </div>
          <AndamioCardTitle>You&apos;re all set!</AndamioCardTitle>
          <AndamioCardDescription>
            You already have an access token: {user.accessTokenAlias}
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

  // Wallet connected, authenticating
  if (isWalletConnected && isAuthenticating) {
    return (
      <AndamioCard className="flex flex-col">
        <AndamioCardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <AccessTokenIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <AndamioCardTitle>Signing in...</AndamioCardTitle>
          <AndamioCardDescription>Please sign the message in your wallet</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="mt-auto">
          <div className="flex items-center justify-center py-4">
            <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Default: no wallet connected
  return (
    <AndamioCard className="flex flex-col">
      <AndamioCardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <AccessTokenIcon className="h-5 w-5 text-muted-foreground" />
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

export interface MintCardProps {
  /** Called after the mint TX is successfully submitted */
  onMinted: (info: { alias: string; txHash: string }) => void;
}

/**
 * Full-width mint card rendered when the user is authenticated
 * but has no access token. On submission, notifies the parent
 * so it can show the first-login ceremony.
 */
export function MintCard({ onMinted }: MintCardProps) {
  const { isAuthenticated, user } = useAndamioAuth();

  // Only render when authenticated without a token
  if (!isAuthenticated || user?.accessTokenAlias) {
    return null;
  }

  return (
    <AndamioCard className="w-full max-w-xl">
      <AndamioCardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <AccessTokenIcon className="h-6 w-6 text-primary" />
        </div>
        <AndamioCardTitle className="text-2xl">Mint Your Access Token</AndamioCardTitle>
        <AndamioCardDescription className="mx-auto max-w-sm text-center">
          Choose an alias and mint your on-chain access token to get started.
        </AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent>
        <MintAccessToken onSubmitted={onMinted} skipCeremony />
      </AndamioCardContent>
    </AndamioCard>
  );
}
