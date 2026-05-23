"use client";

import { OnChainIcon, LoadingIcon, SecurityAlertIcon, SignatureIcon } from "~/components/icons";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { ConnectWalletPrompt } from "~/components/auth/connect-wallet-prompt";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";

interface ConnectWalletGateProps {
  /** Title displayed below the icon */
  title?: string;
  /** Subtitle displayed below the title */
  description?: string;
}

/**
 * Full-page centered "Connect your wallet" screen.
 *
 * Use this as the standard auth gate for any page that requires
 * wallet connection. Renders a centered icon, title, description,
 * and the CardanoWallet button.
 *
 * Also handles post-connect states: signing prompt (UTXOS/SDK wallets),
 * auth errors, and authenticating spinner.
 */
export function ConnectWalletGate({
  title = "Connect your wallet",
  description = "Sign in to continue",
}: ConnectWalletGateProps) {
  const { isWalletConnected, isAuthenticating, authError, popupBlocked, authenticate } =
    useAndamioAuth();

  // Wallet connected but signing window didn't open — prompt user to authorize
  if (isWalletConnected && popupBlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <SignatureIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <AndamioText className="text-lg font-medium">Sign to Continue</AndamioText>
        <AndamioText variant="small" className="mt-1 mb-6 max-w-sm">
          Next, sign a message with your wallet to verify ownership.
        </AndamioText>
        <AndamioButton onClick={() => void authenticate()}>
          Authorize
        </AndamioButton>
      </div>
    );
  }

  // Wallet connected but auth error — show retry
  if (isWalletConnected && authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <SecurityAlertIcon className="h-12 w-12 text-destructive/50 mb-4" />
        <AndamioText className="text-lg font-medium">Sign-In Failed</AndamioText>
        <AndamioText variant="small" className="mt-1 mb-6 max-w-sm">
          {authError}
        </AndamioText>
        <AndamioButton onClick={() => void authenticate()}>
          Try Again
        </AndamioButton>
      </div>
    );
  }

  // Wallet connected and authenticating — show spinner
  if (isWalletConnected && isAuthenticating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <OnChainIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <AndamioText className="text-lg font-medium">Signing In...</AndamioText>
        <AndamioText variant="small" className="mt-1 mb-6">
          Please sign the message in your wallet
        </AndamioText>
        <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not connected — show wallet connect button
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <OnChainIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <AndamioText className="text-lg font-medium">{title}</AndamioText>
      <AndamioText variant="small" className="mt-1 mb-6">
        {description}
      </AndamioText>
      <ConnectWalletPrompt />
    </div>
  );
}
