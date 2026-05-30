"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useHasPendingAccessTokenTx } from "~/hooks/tx/use-pending-access-token-tx";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioText } from "~/components/andamio/andamio-text";
import { BackIcon, LoadingIcon } from "~/components/icons";
import { getWalletAddressBech32 } from "~/lib/wallet-address";
import { SignInOptions } from "~/components/auth/sign-in-options";
import { env } from "~/env";
import { extractAliasFromUnit } from "~/lib/access-token-utils";

// Alias must contain only alphanumeric characters and underscores
const ALIAS_PATTERN = /^[a-zA-Z0-9_]+$/;

function isValidAlias(alias: string): boolean {
  return alias.length > 0 && ALIAS_PATTERN.test(alias);
}

interface RegistrationFlowProps {
  /** Called when mint transaction is submitted */
  onMinted?: (info: { alias: string; txHash: string }) => void;
  /** Called when user clicks back */
  onBack?: () => void;
  /** Full-screen brand-navy layout for the not-connected state (landing page only). */
  darkLayout?: boolean;
}

export function RegistrationFlow({ onMinted, onBack, darkLayout = false }: RegistrationFlowProps) {
  const [alias, setAlias] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletTokenAlias, setWalletTokenAlias] = useState<string | null>(null);
  const { wallet, connected } = useWallet();
  const {
    isAuthenticated,
    isAuthenticating,
    isWalletConnected,
    authError,
    popupBlocked,
    authenticate,
    logout,
  } = useAndamioAuth();
  const { state: txState, error: txError, execute, reset } = useTransaction();
  // True when an access-token tx is already in flight (this session). Guards
  // against minting a second token during the on-chain confirmation window,
  // which the wallet-balance check above cannot see yet.
  const hasPendingMint = useHasPendingAccessTokenTx();

  useEffect(() => {
    if (!connected || !wallet) {
      setWalletAddress(null);
      return;
    }

    void (async () => {
      try {
        // MeshSDK v2: getUsedAddressesBech32() can throw InvalidStringError
        // on some wallets, so use getWalletAddressBech32() as primary method
        let bech32Address: string | undefined;
        try {
          const addresses = await wallet.getUsedAddressesBech32();
          bech32Address = addresses[0];
        } catch {
          // Fallback: some wallet CIP-30 implementations return non-hex
          // from getUsedAddresses(), causing the bech32 conversion to fail
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
        console.error("[RegistrationFlow] Failed to get wallet address:", err);
        setWalletAddress(null);
      }
    })();
  }, [connected, wallet]);

  useEffect(() => {
    if (!connected || !wallet) {
      setWalletTokenAlias(null);
      return;
    }
    void (async () => {
      try {
        const assets = await wallet.getBalanceMesh();
        const policyId = env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID;
        const token = assets.find((a) => a.unit.startsWith(policyId));
        setWalletTokenAlias(token ? (extractAliasFromUnit(token.unit, policyId) ?? null) : null);
      } catch {
        setWalletTokenAlias(null);
      }
    })();
  }, [connected, wallet]);

  const aliasError =
    alias.trim() && !isValidAlias(alias.trim())
      ? "Alias can only contain letters, numbers, and underscores"
      : null;

  const handleMint = async () => {
    if (!walletAddress || !alias.trim() || aliasError) return;
    // Block a second mint while one is still confirming on-chain.
    if (hasPendingMint) return;

    await execute({
      txType: "GLOBAL_GENERAL_ACCESS_TOKEN_MINT",
      params: {
        initiator_data: walletAddress,
        alias: alias.trim(),
      },
      onSuccess: (txResult) => {
        onMinted?.({ alias: alias.trim(), txHash: txResult.txHash });
      },
      onError: (txError) => {
        console.error("[RegistrationFlow] Transaction error:", txError);
      },
    });
  };

  // Transaction in progress
  if (txState === "fetching" || txState === "signing" || txState === "submitting") {
    const isSigning = txState === "signing";

    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="pb-2">
            <AndamioText variant="overline" className="mb-1">Creating identity</AndamioText>
            <AndamioCardTitle className="text-xl">
              {isSigning ? "Approve in your wallet" : "One moment..."}
            </AndamioCardTitle>
            {isSigning && (
              <AndamioCardDescription>
                Sign the transaction to create your identity
              </AndamioCardDescription>
            )}
          </AndamioCardHeader>
          <AndamioCardContent className="flex flex-col items-center py-8 gap-4">
            <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
            {!isSigning && (
              <AndamioText variant="muted" className="text-sm">
                {txState === "fetching" ? "Building transaction..." : "Submitting to Cardano..."}
              </AndamioText>
            )}
          </AndamioCardContent>
        </AndamioCard>
      </div>
    );
  }

  // Transaction error (user declined or network issue)
  if (txState === "error") {
    const isAliasTaken = txError?.message.toLowerCase().includes("alias already in use");

    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="pb-2">
            <AndamioText variant="overline" className="mb-1">Creating identity</AndamioText>
            <AndamioCardTitle className="text-xl">
              {isAliasTaken ? "Alias already taken" : "That didn’t go through"}
            </AndamioCardTitle>
            <AndamioCardDescription>
              {isAliasTaken
                ? "Choose a different alias to continue. Nothing was charged."
                : "The transaction was cancelled. Nothing was charged."}
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            {!isAliasTaken && (
              <AndamioButton onClick={() => reset()} className="w-full">
                Try Again with &quot;{alias}&quot;
              </AndamioButton>
            )}
            <AndamioButton
              variant={isAliasTaken ? "default" : "outline"}
              onClick={() => {
                reset();
                setAlias("");
              }}
              className="w-full"
            >
              Choose Different Alias
            </AndamioButton>
            {onBack && (
              <AndamioButton variant="ghost" onClick={onBack} className="w-full" size="sm">
                <BackIcon className="mr-2 h-4 w-4" />
                Back to Home
              </AndamioButton>
            )}
          </AndamioCardContent>
        </AndamioCard>
      </div>
    );
  }

  // Step 1: Not connected — full-screen navy on landing, card layout elsewhere
  if (!isWalletConnected) {
    if (darkLayout) {
      return (
        <div className="mx-auto w-full max-w-3xl">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            {/* Left: branding */}
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                Get started
              </p>
              <h2 className="text-4xl font-bold leading-tight text-white">
                Sign in to Tracom Credentials
              </h2>
              <p className="text-base leading-relaxed text-white/60">
                No wallet or crypto experience needed. Connect with Google, Discord, or X to begin.
              </p>
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-sm text-white/40 transition-colors hover:text-white/70"
                >
                  ← Back
                </button>
              )}
            </div>

            {/* Right: sign-in options */}
            <div>
              <SignInOptions dark />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="pb-2">
            <AndamioText variant="overline" className="mb-1">Get started</AndamioText>
            <AndamioCardTitle className="text-xl">Sign in to Tracom Credentials</AndamioCardTitle>
            <AndamioCardDescription>
              No wallet or crypto experience needed.
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            <SignInOptions />
            {onBack && (
              <AndamioButton variant="ghost" onClick={onBack} className="w-full" size="sm">
                <BackIcon className="mr-2 h-4 w-4" />
                Back
              </AndamioButton>
            )}
          </AndamioCardContent>
        </AndamioCard>
      </div>
    );
  }

  // Step 2a: Auth error (user declined or something went wrong)
  if (isWalletConnected && authError && !isAuthenticated) {
    const isUserDeclined =
      authError.includes("rejected") ||
      authError.includes("declined") ||
      authError.includes("cancel");

    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="pb-2">
            <AndamioText variant="overline" className="mb-1">Verify ownership</AndamioText>
            <AndamioCardTitle className="text-xl">
              {isUserDeclined ? "Signature declined" : "Sign-in failed"}
            </AndamioCardTitle>
            <AndamioCardDescription>
              {isUserDeclined
                ? "You declined to sign the message."
                : "Something went wrong during sign-in."}
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            <AndamioText variant="small" className="text-center text-muted-foreground">
              {isUserDeclined
                ? "You need to sign a message to verify wallet ownership. No transaction is made."
                : authError}
            </AndamioText>
            <AndamioButton onClick={() => void authenticate()} className="w-full">
              Try Again
            </AndamioButton>
            <AndamioButton
              variant="outline"
              onClick={() => void logout("registration_cancel")}
              className="w-full"
            >
              Disconnect Wallet
            </AndamioButton>
            {onBack && (
              <AndamioButton variant="ghost" onClick={onBack} className="w-full" size="sm">
                <BackIcon className="mr-2 h-4 w-4" />
                Back
              </AndamioButton>
            )}
          </AndamioCardContent>
        </AndamioCard>
      </div>
    );
  }

  // Step 2b: Popup blocked (Web3Services wallets need popups for signing)
  if (isWalletConnected && popupBlocked && !isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="pb-2">
            <AndamioText variant="overline" className="mb-1">Verify ownership</AndamioText>
            <AndamioCardTitle className="text-xl">Sign to Continue</AndamioCardTitle>
            <AndamioCardDescription>
              Open your wallet to verify you own this address.
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            <AndamioText variant="small" className="text-center text-muted-foreground">
              Tap below to open your wallet and authorize.
            </AndamioText>
            <AndamioButton onClick={() => void authenticate()} className="w-full">
              Authorize
            </AndamioButton>
            {onBack && (
              <AndamioButton variant="ghost" onClick={onBack} className="w-full" size="sm">
                <BackIcon className="mr-2 h-4 w-4" />
                Back
              </AndamioButton>
            )}
          </AndamioCardContent>
        </AndamioCard>
      </div>
    );
  }

  // Step 2c: Connected and authenticating (waiting for signature)
  if (isAuthenticating || !isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="pb-2">
            <AndamioText variant="overline" className="mb-1">Verify ownership</AndamioText>
            <AndamioCardTitle className="text-xl">Sign the message</AndamioCardTitle>
            <AndamioCardDescription>Check your wallet to approve</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="flex flex-col items-center py-8">
            <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          </AndamioCardContent>
        </AndamioCard>
      </div>
    );
  }

  // Step 3 guard: wallet already has an access token — sign in instead of re-minting
  if (walletTokenAlias) {
    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="pb-2">
            <AndamioText variant="overline" className="mb-1">Access token found</AndamioText>
            <AndamioCardTitle className="text-xl">You already have an identity</AndamioCardTitle>
            <AndamioCardDescription>
              Your wallet has an access token for{" "}
              <span className="font-mono font-semibold text-foreground">{walletTokenAlias}</span>.
              Sign out and sign back in to activate it.
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-3">
            <AndamioText variant="small" className="text-muted-foreground">
              You do not need to mint again. Signing in will detect your existing token automatically.
            </AndamioText>
            {onBack && (
              <AndamioButton variant="outline" onClick={onBack} className="w-full">
                <BackIcon className="mr-2 h-4 w-4" />
                Back
              </AndamioButton>
            )}
          </AndamioCardContent>
        </AndamioCard>
      </div>
    );
  }

  // Guard: a mint is already in flight this session (submitted, not yet
  // confirmed on-chain). The wallet-balance check can't see it yet, so gate
  // the form here to prevent minting a second access token. Covers a fresh
  // remount where local txState has reset to idle.
  if (hasPendingMint) {
    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="pb-2">
            <AndamioText variant="overline" className="mb-1">Creating identity</AndamioText>
            <AndamioCardTitle className="text-xl">Almost there</AndamioCardTitle>
            <AndamioCardDescription>
              Your access token is being created on Cardano. This usually takes 20–60 seconds.
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="flex flex-col items-center py-8 gap-4">
            <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
            <AndamioText variant="muted" className="text-sm text-center">
              No need to create another — we&apos;ll sign you in automatically once it confirms.
            </AndamioText>
          </AndamioCardContent>
        </AndamioCard>
      </div>
    );
  }

  // Step 3: Authenticated — alias input and create identity
  return (
    <div className="w-full max-w-md mx-auto">
      <AndamioCard>
        <AndamioCardHeader className="pb-2">
          <AndamioText variant="overline" className="mb-1">Choose your alias</AndamioText>
          <AndamioCardTitle className="text-xl">Create your identity</AndamioCardTitle>
          <AndamioCardDescription>
            Your alias appears on all your credentials and cannot be changed.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="space-y-2">
            <AndamioLabel htmlFor="alias-input">Alias</AndamioLabel>
            <AndamioInput
              id="alias-input"
              type="text"
              placeholder="e.g. Alice99 or john_doe"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className={`font-mono ${aliasError ? "border-destructive" : ""}`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && alias.trim() && !aliasError && walletAddress) {
                  void handleMint();
                }
              }}
            />
            {aliasError ? (
              <AndamioText variant="small" className="text-xs text-destructive">
                {aliasError}
              </AndamioText>
            ) : (
              <AndamioText variant="small" className="text-xs text-muted-foreground">
                Letters, numbers, and underscores only.
              </AndamioText>
            )}
          </div>
          <AndamioButton
            onClick={() => void handleMint()}
            disabled={!alias.trim() || !!aliasError || !walletAddress}
            className="w-full"
            size="lg"
          >
            Create Identity
          </AndamioButton>
          {onBack && (
            <AndamioButton variant="ghost" onClick={onBack} className="w-full" size="sm">
              <BackIcon className="mr-2 h-4 w-4" />
              Back
            </AndamioButton>
          )}
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
