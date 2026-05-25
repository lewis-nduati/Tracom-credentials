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
import { BackIcon, LoadingIcon } from "~/components/icons";
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
    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="pb-2">
            <AndamioText variant="overline" className="mb-1">Creating identity</AndamioText>
            <AndamioCardTitle className="text-xl">That didn&apos;t go through</AndamioCardTitle>
            <AndamioCardDescription>
              The transaction was cancelled. Nothing was charged.
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            <AndamioButton onClick={() => reset()} className="w-full">
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

  // Step 1: Not connected
  if (!isWalletConnected) {
    return (
      <div className="w-full max-w-md mx-auto">
        <AndamioCard>
          <AndamioCardHeader className="pb-2">
            <AndamioText variant="overline" className="mb-1">Get started</AndamioText>
            <AndamioCardTitle className="text-xl">Connect Your Wallet</AndamioCardTitle>
            <AndamioCardDescription>
              You need a Cardano wallet to create your Tracom identity.
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-3">
            <div className="rounded-sm border bg-muted/30 p-3 space-y-1">
              <AndamioText className="font-medium text-sm">Your Access Token</AndamioText>
              <AndamioText variant="small" className="text-xs text-muted-foreground">
                An NFT that proves your identity on Cardano. Use it to earn credentials, join projects, and build your on-chain reputation.
              </AndamioText>
            </div>
            <div className="flex justify-center">
              <ConnectWalletButton />
            </div>
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
              placeholder="e.g. LewisN or lewis_nduati"
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
