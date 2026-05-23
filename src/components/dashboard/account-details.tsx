"use client";

import { useCopyFeedback } from "~/hooks/ui/use-success-notification";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { WalletIcon, AccessTokenIcon, ShieldIcon, CopyIcon, CompletedIcon } from "~/components/icons";

interface AccountDetailsProps {
  cardanoBech32Addr: string | null | undefined;
  accessTokenAlias: string | null | undefined;
  jwtExpiration: Date | null;
}

/**
 * AccountDetailsCard - Displays wallet address, access token, and session status
 *
 * Extracted from dashboard page to follow style rule:
 * "Top level page components should never apply custom tailwind properties to Andamio Components"
 */
export function AccountDetailsCard({
  cardanoBech32Addr,
  accessTokenAlias,
  jwtExpiration,
}: AccountDetailsProps) {
  const { isCopied: addressCopied, copy: copyAddress } = useCopyFeedback();
  const hasAccessToken = !!accessTokenAlias;

  return (
    <AndamioCard>
      <AndamioCardIconHeader icon={WalletIcon} title="Account Details" />
      <AndamioCardContent className="space-y-4">
        {/* Wallet Address */}
        <div className="space-y-1.5">
          <AndamioText variant="overline">Wallet Address</AndamioText>
          <div className="flex items-center gap-2 min-w-0">
            <code className="flex-1 min-w-0 text-xs font-mono bg-muted rounded px-2 py-1.5 truncate">
              {cardanoBech32Addr}
            </code>
            <AndamioButton
              variant="ghost"
              size="icon-sm"
              onClick={() => cardanoBech32Addr && copyAddress(cardanoBech32Addr)}
            >
              {addressCopied ? (
                <CompletedIcon className="h-3.5 w-3.5 text-primary" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5" />
              )}
            </AndamioButton>
          </div>
        </div>

        {/* Access Token */}
        <div className="space-y-1.5">
          <AndamioText variant="overline">Access Token</AndamioText>
          {hasAccessToken ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-primary/10 rounded px-2 py-1.5">
                <AccessTokenIcon className="h-3.5 w-3.5 text-primary" />
                <code className="text-xs font-mono font-semibold text-primary">
                  {accessTokenAlias}
                </code>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-muted rounded px-2 py-1.5">
              <AccessTokenIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Not minted</span>
            </div>
          )}
        </div>

        {/* Session Status */}
        <div className="space-y-1.5">
          <AndamioText variant="overline">Session</AndamioText>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldIcon className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs">Active</span>
            </div>
            {jwtExpiration && (
              <span className="text-xs text-muted-foreground">
                Expires {jwtExpiration.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
