"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
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
import {
  AccessTokenIcon,
  BackIcon,
  LoadingIcon,
  ShieldIcon,
} from "~/components/icons";
import { getWalletAddressBech32 } from "~/lib/wallet-address";

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
}

/**
 * Registration flow for new users.
 *
 * Flow:
 * 1. Connect wallet (triggers auto-auth)
 * 2. Enter alias + click "Mint Access Token"
 * 3. Sign transaction
 */
export function RegistrationFlow({ onMinted, onBack }: RegistrationFlowProps) {
  const [alias, setAlias] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
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
  const { state: txState, execute, reset } = useTransaction();

  // Get wallet address when connected (with bech32 conversion)
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

  const aliasError =
    alias.trim() && !isValidAlias(alias.trim())
      ? "Alias can only contain letters, numbers, and underscores"
      : null;

  const handleMint = async () => {
    if (!walletAddress || !alias.trim() || aliasError) return;

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
    const stateText = {
      fetching: "Building transaction...",
      signing: "Please sign in your wallet...",
      submitting: "Submitting to blockchain...",
    }[txState];

    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <AccessTokenIcon className="h-7 w-7 text-primary" />
              </div>
            </div>
            <AndamioCardTitle className="text-xl">Minting Access Token</AndamioCardTitle>
            <AndamioCardDescription>
              Alias: <span className="font-mono font-semibold text-foreground">{alias}</span>
            </AndamioCardDescription>
          </AndamioCardHeader>

          <AndamioCardContent className="flex flex-col items-center py-8 gap-4">
            <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
            <AndamioText variant="muted">{stateText}</AndamioText>
          </AndamioCardContent>
        </AndamioCard>
      </div>
    );
  }

  // Transaction error (user declined or network issue)
  if (txState === "error") {
    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AccessTokenIcon className="h-7 w-7 text-destructive" />
              </div>
            </div>
            <AndamioCardTitle className="text-xl">Transaction Cancelled</AndamioCardTitle>
            <AndamioCardDescription>
              The transaction was not completed.
            </AndamioCardDescription>
          </AndamioCardHeader>

          <AndamioCardContent className="space-y-4">
            <AndamioText variant="small" className="text-center text-muted-foreground">
              You can try again with the same alias or go back to choose a different one.
            </AndamioText>
            <AndamioButton
              onClick={() => reset()}
              className="w-full"
            >
              Try Again with &quot;{alias}&quot;
            </AndamioButton>
            <AndamioButton
              variant="outline"
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

  // Step 1: Not connected - show wallet connect
  if (!isWalletConnected) {
    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <AccessTokenIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <AndamioCardTitle className="text-xl">Connect Your Wallet</AndamioCardTitle>
            <AndamioCardDescription>
              Connect to create your on-chain identity
            </AndamioCardDescription>
          </AndamioCardHeader>

          <AndamioCardContent className="space-y-3">
            {/* What you're getting */}
            <div className="rounded-sm border bg-muted/30 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldIcon className="h-4 w-4 text-primary" />
                <AndamioText className="font-medium text-sm">Your Access Token</AndamioText>
              </div>
              <AndamioText variant="small" className="text-xs text-muted-foreground">
                An NFT that proves your identity on Cardano. Use it to earn credentials, join projects, and build your on-chain reputation.
              </AndamioText>
            </div>

            <div className="flex justify-center">
              <ConnectWalletButton />
            </div>

            {onBack && (
              <AndamioButton
                variant="ghost"
                onClick={onBack}
                className="w-full"
                size="sm"
              >
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
          <AndamioCardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AccessTokenIcon className="h-7 w-7 text-destructive" />
              </div>
            </div>
            <AndamioCardTitle className="text-xl">Sign-In Failed</AndamioCardTitle>
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
            <AndamioButton
              onClick={() => void authenticate()}
              className="w-full"
            >
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
          <AndamioCardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <AccessTokenIcon className="h-7 w-7 text-primary" />
              </div>
            </div>
            <AndamioCardTitle className="text-xl">Sign to Continue</AndamioCardTitle>
            <AndamioCardDescription>
              Next, sign a message to verify your wallet.
            </AndamioCardDescription>
          </AndamioCardHeader>

          <AndamioCardContent className="space-y-4">
            <AndamioText variant="small" className="text-center text-muted-foreground">
              Tap below to open your wallet and authorize.
            </AndamioText>
            <AndamioButton
              onClick={() => void authenticate()}
              className="w-full"
            >
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
          <AndamioCardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <AccessTokenIcon className="h-7 w-7 text-primary" />
              </div>
            </div>
            <AndamioCardTitle className="text-xl">Signing In...</AndamioCardTitle>
            <AndamioCardDescription>
              Please sign the message in your wallet
            </AndamioCardDescription>
          </AndamioCardHeader>

          <AndamioCardContent className="flex flex-col items-center py-8">
            <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          </AndamioCardContent>
        </AndamioCard>
      </div>
    );
  }

  // Step 3: Authenticated - show alias input + mint button
  return (
    <div className="w-full max-w-md mx-auto">
      <AndamioCard>
        <AndamioCardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <AccessTokenIcon className="h-7 w-7 text-primary" />
            </div>
          </div>
          <AndamioCardTitle className="text-xl">Create Your On-Chain Identity</AndamioCardTitle>
          <AndamioCardDescription>
            Choose an alias and mint your access token
          </AndamioCardDescription>
        </AndamioCardHeader>

        <AndamioCardContent className="space-y-4">
          {/* Alias input */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="alias-input">Choose Your Alias</AndamioLabel>
            <AndamioInput
              id="alias-input"
              type="text"
              placeholder="my_unique_alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className={`font-mono ${aliasError ? "border-destructive" : ""}`}
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
                Letters, numbers, and underscores only. This will be your unique identifier.
              </AndamioText>
            )}
          </div>

          {/* Mint button */}
          <AndamioButton
            onClick={() => void handleMint()}
            disabled={!alias.trim() || !!aliasError || !walletAddress}
            className="w-full"
            size="lg"
          >
            <AccessTokenIcon className="mr-2 h-5 w-5" />
            Mint Access Token
          </AndamioButton>

          {/* Back link */}
          {onBack && (
            <AndamioButton
              variant="ghost"
              onClick={onBack}
              className="w-full"
              size="sm"
            >
              <BackIcon className="mr-2 h-4 w-4" />
              Back
            </AndamioButton>
          )}
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
