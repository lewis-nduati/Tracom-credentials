"use client";

import React from "react";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "~/components/tx/transaction-button";
import { TransactionStatus } from "~/components/tx/transaction-status";
import { parseTxErrorMessage } from "~/lib/tx-error-messages";
import { getTransactionExplorerUrl } from "~/lib/constants";
import { env } from "~/env";
import {
  AccessTokenIcon,
  SuccessIcon,
  ExternalLinkIcon,
  ForwardIcon,
  BackIcon,
} from "~/components/icons";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioButton } from "~/components/andamio/andamio-button";

interface V1MigrateCardProps {
  /** The alias extracted from the V1 access token */
  detectedAlias: string;
  /** Called on successful claim with alias + txHash */
  onMinted?: (info: { alias: string; txHash: string }) => void;
  /** Return to default hero view */
  onBack?: () => void;
}

export function V1MigrateCard({ detectedAlias, onMinted, onBack }: V1MigrateCardProps) {
  const { execute, state: txState, result, error, reset } = useTransaction();
  const { isSuccess: streamSuccess } = useTxStream(result?.txHash ?? null);

  const [claimComplete, setClaimComplete] = React.useState(false);

  // When TX succeeds, mark claim as complete
  React.useEffect(() => {
    if (txState === "success") {
      setClaimComplete(true);
    }
  }, [txState]);

  const handleClaim = async () => {
    await execute({
      txType: "GLOBAL_USER_ACCESS_TOKEN_CLAIM",
      params: { alias: detectedAlias },
    });
  };

  const handleContinue = () => {
    if (result?.txHash) {
      onMinted?.({ alias: detectedAlias, txHash: result.txHash });
    }
  };

  const explorerUrl = result?.txHash
    ? getTransactionExplorerUrl(result.txHash, env.NEXT_PUBLIC_CARDANO_NETWORK)
    : null;

  // Success state
  if (claimComplete) {
    return (
      <div className="flex flex-col items-center text-center max-w-lg mx-auto">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <SuccessIcon className="h-6 w-6 text-primary" />
        </div>
        <AndamioHeading level={1} size="2xl" className="mt-4">
          Migration Complete!
        </AndamioHeading>
        <AndamioText variant="muted" className="mt-2">
          Your V2 access token has been claimed. Check your wallet to see the transaction complete.
        </AndamioText>

        <AndamioCard className="mt-6 w-full">
          <AndamioCardContent className="space-y-4">
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-sm border bg-muted/30 p-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
              >
                View transaction on explorer
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
            )}

            {streamSuccess && (
              <div className="rounded-sm border border-primary/30 bg-primary/5 p-3 text-center">
                <AndamioText variant="small" className="font-medium text-foreground">
                  Transaction confirmed on-chain
                </AndamioText>
              </div>
            )}

            <AndamioButton
              className="w-full"
              onClick={handleContinue}
              rightIcon={<ForwardIcon className="h-4 w-4" />}
            >
              Continue
            </AndamioButton>
          </AndamioCardContent>
        </AndamioCard>
      </div>
    );
  }

  // Ready to claim state
  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <AccessTokenIcon className="h-6 w-6 text-primary" />
      </div>
      <AndamioHeading level={1} size="2xl" className="mt-4">
        V1 Token Detected
      </AndamioHeading>
      <AndamioText variant="muted" className="mt-2">
        Claim your V2 access token using your existing V1 token
      </AndamioText>

      <AndamioCard className="mt-6 w-full">
        <AndamioCardHeader>
          <AndamioCardTitle>Ready to Migrate</AndamioCardTitle>
          <AndamioCardDescription>
            Your V1 access token was found. Claim your V2 token to continue using the platform.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="rounded-sm border bg-muted/30 p-4">
            <AndamioText variant="small" className="text-muted-foreground">
              Alias
            </AndamioText>
            <p className="mt-1 font-mono text-lg font-semibold">
              {detectedAlias}
            </p>
          </div>

          <TransactionButton
            txState={txState}
            onClick={handleClaim}
            stateText={{ idle: "Claim V2 Access Token" }}
            className="w-full"
          />

          <TransactionStatus
            state={txState}
            result={result ? { ...result, success: result.success } : null}
            error={parseTxErrorMessage(error?.message)}
            onRetry={reset}
          />
        </AndamioCardContent>
      </AndamioCard>

      {onBack && (
        <AndamioButton
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mt-4"
        >
          <BackIcon className="mr-2 h-4 w-4" />
          Back
        </AndamioButton>
      )}
    </div>
  );
}
