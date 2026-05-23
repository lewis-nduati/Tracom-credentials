"use client";

import React from "react";
import { type TransactionType, TRANSACTION_UI } from "~/config/transaction-ui";
import type { TxParams } from "~/config/transaction-schemas";
import { AndamioText, AndamioHeading } from "~/components/andamio";
import { OnChainIcon, WalletIcon, InfoIcon } from "~/components/icons";
import type { IconComponent } from "~/types/ui";
import { cn } from "~/lib/utils";

interface SummaryItemProps {
  label: string;
  value: string | React.ReactNode;
  icon?: IconComponent;
}

function SummaryItem({ label, value, icon: Icon = InfoIcon }: SummaryItemProps) {
  return (
    <div className="flex gap-3 py-2">
      <div className="mt-0.5">
        <Icon className="h-4 w-4 text-primary/60" />
      </div>
      <div>
        <AndamioText variant="small" className="font-semibold text-foreground/70 leading-tight">
          {label}
        </AndamioText>
        <div className="text-sm text-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}

interface AndamioTxSummaryProps {
  txType: TransactionType;
  params: TxParams[TransactionType];
  metadata?: Record<string, string>;
  className?: string;
}

/**
 * Transaction Summary component for "Moments of Understanding" (Design Principle 4).
 *
 * Translates technical transaction parameters into human-readable
 * intentions and outcomes before the user signs with their wallet.
 */
export function AndamioTxSummary({
  txType,
  params,
  metadata,
  className,
}: AndamioTxSummaryProps) {
  function renderSummary(): React.ReactNode {
    switch (txType) {
      case "INSTANCE_PROJECT_CREATE": {
        const p = params as TxParams["INSTANCE_PROJECT_CREATE"];
        return (
          <>
            <SummaryItem
              label="Action"
              value={`Creating a new Project: ${metadata?.title ?? "Untitled"}`}
            />
            <SummaryItem
              label="On-Chain Role"
              value="You will be the permanent Owner of this project NFT."
              icon={OnChainIcon}
            />
            {p.course_prereqs?.length > 0 && (
              <SummaryItem
                label="Prerequisites"
                value={`${p.course_prereqs.length} course requirements defined.`}
              />
            )}
          </>
        );
      }

      case "GLOBAL_GENERAL_ACCESS_TOKEN_MINT": {
        const p = params as TxParams["GLOBAL_GENERAL_ACCESS_TOKEN_MINT"];
        return (
          <>
            <SummaryItem
              label="Action"
              value={`Minting Access Token with alias: ${p.alias}`}
            />
            <SummaryItem
              label="Identity"
              value="This token becomes your permanent on-chain identity in Andamio."
              icon={WalletIcon}
            />
          </>
        );
      }

      case "COURSE_STUDENT_CREDENTIAL_CLAIM":
        return (
          <>
            <SummaryItem
              label="Action"
              value="Claiming Course Credential"
            />
            <SummaryItem
              label="On-Chain Result"
              value="A non-transferable achievement token will be minted to your wallet."
              icon={OnChainIcon}
            />
          </>
        );

      default: {
        const ui = TRANSACTION_UI[txType];
        return (
          <div className="py-2">
            <AndamioText variant="small">
              {ui.description[0]}
            </AndamioText>
          </div>
        );
      }
    }
  }

  return (
    <div className={cn("bg-muted/50 rounded-sm border p-4 space-y-1", className)}>
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
        <InfoIcon className="h-4 w-4 text-primary" />
        <AndamioHeading level={4} size="base" className="text-sm font-bold uppercase tracking-wider text-primary">
          Transaction Summary
        </AndamioHeading>
      </div>

      <div className="divide-y divide-border/30">
        {renderSummary()}
      </div>

      <div className="mt-4 pt-3 border-t border-border/50">
        <AndamioText variant="small" className="text-[10px] leading-relaxed italic">
          This transaction is permanent. Please review the details carefully before signing.
        </AndamioText>
      </div>
    </div>
  );
}
