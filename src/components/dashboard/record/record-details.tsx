"use client";

import React from "react";
import { AndamioRecordSection } from "~/components/andamio";
import { CompletedIcon, CopyIcon } from "~/components/icons";
import { useCopyFeedback } from "~/hooks/ui/use-success-notification";
import { useSessionExpiry } from "~/hooks/auth/use-session-expiry";

/** Wallet, access token and session. Replaces AccountDetailsCard and the old status bar timer. */
export function RecordDetails({
  walletAddress,
  accessTokenAlias,
}: {
  walletAddress: string | null | undefined;
  accessTokenAlias: string | null | undefined;
}) {
  const { isCopied, copy } = useCopyFeedback();
  const session = useSessionExpiry();

  return (
    <AndamioRecordSection label="Record details">
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Wallet</dt>
          <dd className="mt-0.5 flex items-center gap-2">
            <code className="min-w-0 truncate font-mono text-xs">{walletAddress ?? "Not connected"}</code>
            {walletAddress && (
              <button
                type="button"
                onClick={() => void copy(walletAddress)}
                aria-label="Copy wallet address"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {isCopied ? <CompletedIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
              </button>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Access token</dt>
          <dd className="mt-0.5 font-serif text-base font-medium">{accessTokenAlias ?? "Not created"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Session</dt>
          <dd className={session.isExpiringSoon ? "mt-0.5 font-medium text-destructive" : "mt-0.5"}>
            {session.label === "Expired"
              ? "Expired. Sign in again."
              : session.label
                ? `Active, ${session.label} left`
                : "Active"}
          </dd>
        </div>
      </dl>
    </AndamioRecordSection>
  );
}
