"use client";

import React from "react";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import {
  V1_ACCESS_TOKEN_POLICY_ID,
  V1_ACCESS_TOKEN_PREFIX_LENGTH,
  V2_ACCESS_TOKEN_POLICY_ID,
  extractAliasFromUnit,
} from "~/lib/access-token-utils";
import { withTimeout } from "~/lib/promise-utils";

/** Budget for each wallet balance scan. Matches existing wallet-query timeouts. */
const WALLET_SCAN_TIMEOUT_MS = 15_000;
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioText } from "~/components/andamio/andamio-text";
import { LoadingIcon } from "~/components/icons";
import { RegistrationFlow } from "~/components/auth/registration-flow";
import { V1MigrateCard } from "~/components/auth/v1-migrate-card";
import { FirstLoginCard } from "~/components/auth/first-login-card";

interface MintedInfo {
  alias: string;
  txHash: string;
}

/** Narrow Mesh wallet asset shape used for policy-ID matching. */
interface WalletAsset {
  unit: string;
}

export interface AccessTokenOnboardingProps {
  /**
   * Fired once when the post-mint ceremony completes and the new JWT carries
   * a matching accessTokenAlias. Required — call sites must declare what
   * happens next (e.g., navigate to dashboard, or no-op to stay in place).
   */
  onActivated: () => void;
  /**
   * Fired once when the initial V2 scan detects an existing access token on
   * the connected wallet. If omitted, the component renders a neutral waiting
   * state until the auth context's own sync populates `user.accessTokenAlias`
   * (at which point the consumer's surrounding gate naturally unmounts this
   * component).
   */
  onExistingTokenDetected?: () => void;
  /**
   * Terminal celebration copy passed through to FirstLoginCard. Defaults to
   * the landing copy; override on non-landing surfaces.
   */
  terminalMessage?: string;
}

/**
 * Shared onboarding UX for "wallet connected and authenticated, but no V2
 * access token" state.
 *
 * Flow:
 *  - Scan wallet for V2 token → if found, fire `onExistingTokenDetected`
 *    (or hold a neutral "checking..." state).
 *  - Else scan for V1 token → if found, render V1MigrateCard.
 *  - Else render RegistrationFlow (alias + mint TX).
 *  - After a successful mint, render FirstLoginCard (confirm → logout →
 *    reconnect → re-auth). On activation with the minted alias, fire
 *    `onActivated`.
 *
 * Consumed by:
 *  - LandingHero (passes /dashboard navigation for both callbacks)
 *  - AssignmentCommitment (passes no-op onActivated + overridden terminalMessage)
 */
export function AccessTokenOnboarding({
  onActivated,
  onExistingTokenDetected,
  terminalMessage,
}: AccessTokenOnboardingProps) {
  const [mintedInfo, setMintedInfo] = React.useState<MintedInfo | null>(null);
  const [v1Alias, setV1Alias] = React.useState<string | null>(null);
  const [v1Scanning, setV1Scanning] = React.useState(false);
  const [v2Scanning, setV2Scanning] = React.useState(false);
  const [v2ScanComplete, setV2ScanComplete] = React.useState(false);
  const [existingV2Detected, setExistingV2Detected] = React.useState(false);

  // Stable ref to onExistingTokenDetected so the callback firing logic
  // doesn't re-run when callers pass an inline (unstable) callback.
  const onExistingTokenDetectedRef = React.useRef(onExistingTokenDetected);
  React.useEffect(() => {
    onExistingTokenDetectedRef.current = onExistingTokenDetected;
  }, [onExistingTokenDetected]);

  // Ensures the existing-token callback fires exactly once per component lifetime,
  // regardless of scan re-runs or parent re-renders.
  const hasFiredExistingTokenRef = React.useRef(false);

  const { wallet } = useWallet();
  const { isAuthenticated, user, isAuthenticating, isWalletConnected } =
    useAndamioAuth();

  // Scan for V2 token when authenticated but accessTokenAlias not yet set.
  // This catches the case where the auth context sync hasn't completed yet.
  React.useEffect(() => {
    if (
      !isAuthenticated ||
      user?.accessTokenAlias ||
      !isWalletConnected ||
      !wallet ||
      mintedInfo
    ) {
      setV2Scanning(false);
      setV2ScanComplete(false);
      // Reset existingV2Detected if the guard condition changes (e.g., auth
      // sync populated accessTokenAlias out-of-band). Otherwise a previously
      // detected flag could keep the component stuck on the waiting state.
      setExistingV2Detected(false);
      return;
    }

    let cancelled = false;

    async function scanForV2Token() {
      setV2Scanning(true);
      try {
        const assets = await withTimeout(
          wallet.getBalanceMesh(),
          WALLET_SCAN_TIMEOUT_MS,
          "V2 access-token scan"
        );
        const v2Asset = assets.find((asset: WalletAsset) =>
          asset.unit.startsWith(V2_ACCESS_TOKEN_POLICY_ID)
        );

        if (cancelled) return;

        if (v2Asset) {
          setExistingV2Detected(true);
          if (!hasFiredExistingTokenRef.current) {
            hasFiredExistingTokenRef.current = true;
            onExistingTokenDetectedRef.current?.();
          }
        }
      } catch (err) {
        console.error("[AccessTokenOnboarding] Failed to scan for V2 token:", err);
      } finally {
        if (!cancelled) {
          setV2Scanning(false);
          setV2ScanComplete(true);
        }
      }
    }

    void scanForV2Token();
    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    user?.accessTokenAlias,
    isWalletConnected,
    wallet,
    mintedInfo,
  ]);

  // Scan for V1 token when V2 scan completes with no token found.
  React.useEffect(() => {
    if (
      !isAuthenticated ||
      user?.accessTokenAlias ||
      !isWalletConnected ||
      !wallet ||
      !v2ScanComplete ||
      existingV2Detected ||
      mintedInfo
    ) {
      setV1Alias(null);
      setV1Scanning(false);
      return;
    }

    let cancelled = false;

    async function scanForV1Token() {
      setV1Scanning(true);
      try {
        const assets = await withTimeout(
          wallet.getBalanceMesh(),
          WALLET_SCAN_TIMEOUT_MS,
          "V1 access-token scan"
        );
        const v1Asset = assets.find((asset: WalletAsset) =>
          asset.unit.startsWith(V1_ACCESS_TOKEN_POLICY_ID)
        );

        if (cancelled) return;

        if (v1Asset) {
          const alias = extractAliasFromUnit(
            v1Asset.unit,
            V1_ACCESS_TOKEN_POLICY_ID,
            V1_ACCESS_TOKEN_PREFIX_LENGTH
          );
          setV1Alias(alias);
        } else {
          setV1Alias(null);
        }
      } catch (err) {
        console.error("[AccessTokenOnboarding] Failed to scan for V1 token:", err);
        if (!cancelled) {
          setV1Alias(null);
        }
      } finally {
        if (!cancelled) {
          setV1Scanning(false);
        }
      }
    }

    void scanForV1Token();
    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    user?.accessTokenAlias,
    isWalletConnected,
    wallet,
    v2ScanComplete,
    existingV2Detected,
    mintedInfo,
  ]);

  const handleMinted = React.useCallback((info: MintedInfo) => {
    setMintedInfo(info);
  }, []);

  // Post-mint ceremony
  if (mintedInfo) {
    return (
      <FirstLoginCard
        alias={mintedInfo.alias}
        txHash={mintedInfo.txHash}
        onActivated={onActivated}
        terminalMessage={terminalMessage}
      />
    );
  }

  // Authenticating (wallet signing the session nonce)
  if (isWalletConnected && isAuthenticating) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <AndamioHeading level={2} size="2xl">
          Signing In...
        </AndamioHeading>
        <div className="flex flex-col items-center gap-4">
          <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          <AndamioText variant="muted">
            Please sign the message in your wallet
          </AndamioText>
        </div>
      </div>
    );
  }

  // V2 scanning in progress
  if (v2Scanning) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <AndamioHeading level={2} size="2xl">
          Checking Your Wallet...
        </AndamioHeading>
        <div className="flex flex-col items-center gap-4">
          <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          <AndamioText variant="muted">Scanning for existing access tokens</AndamioText>
        </div>
      </div>
    );
  }

  // Existing V2 token was detected. If the consumer provided a callback,
  // they've already been notified. Otherwise hold a neutral waiting state
  // while the auth context picks up the alias and the surrounding gate
  // naturally unmounts this component.
  if (existingV2Detected) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <AndamioHeading level={2} size="2xl">
          Almost There...
        </AndamioHeading>
        <div className="flex flex-col items-center gap-4">
          <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          <AndamioText variant="muted">Finalizing your session</AndamioText>
        </div>
      </div>
    );
  }

  // V1 scanning in progress
  if (v1Scanning) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <AndamioHeading level={2} size="2xl">
          Checking Your Wallet...
        </AndamioHeading>
        <div className="flex flex-col items-center gap-4">
          <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          <AndamioText variant="muted">Scanning for existing access tokens</AndamioText>
        </div>
      </div>
    );
  }

  // V1 token detected — show migrate card
  if (v1Alias) {
    return (
      <V1MigrateCard
        detectedAlias={v1Alias}
        onMinted={handleMinted}
        onBack={() => setV1Alias(null)}
      />
    );
  }

  // Default: registration flow (connect/authenticate/alias/mint)
  return <RegistrationFlow onMinted={handleMinted} />;
}
