"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { DashboardProvider } from "~/contexts/dashboard-context";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";
import { AccessTokenConfirmationAlert } from "~/components/dashboard/access-token-confirmation-alert";
import {
  PostMintAuthPrompt,
  checkAndClearJustMintedFlag,
} from "~/components/dashboard/post-mint-auth-prompt";
import { AndamioRecordHeader, AndamioRecordLayout } from "~/components/andamio";
import { truncateWalletAddress } from "~/config";
import { Admission } from "~/components/dashboard/record/admission";
import { DashboardNextStep } from "~/components/dashboard/record/dashboard-next-step";
import { CoursesLedger } from "~/components/dashboard/record/courses-ledger";
import { ProjectsUnlocking } from "~/components/dashboard/record/projects-unlocking";
import { DutiesLedger } from "~/components/dashboard/record/duties-ledger";
import { ContributingLedger } from "~/components/dashboard/record/contributing-ledger";
import { PathPanel } from "~/components/dashboard/record/path-panel";
import { AccomplishmentsPanel } from "~/components/dashboard/record/accomplishments-panel";
import { RecordDetails } from "~/components/dashboard/record/record-details";
import type { AuthUser } from "~/lib/andamio-auth";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAndamioAuth();
  const [isPostMint, setIsPostMint] = React.useState(false);

  // Check if user just minted (on mount only)
  React.useEffect(() => {
    const justMinted = checkAndClearJustMintedFlag();
    if (justMinted) {
      setIsPostMint(true);
    }
  }, []);

  // Not authenticated state
  if (!isAuthenticated || !user) {
    // Post-mint: Show contextual auth prompt with step tracker
    if (isPostMint) {
      return (
        <PostMintAuthPrompt
          onAuthenticated={() => {
            setIsPostMint(false);
            router.refresh();
          }}
        />
      );
    }

    // Default: Standard auth prompt
    return (
      <ConnectWalletGate
        title="Connect to view your dashboard"
        description="Connect your Cardano wallet to see your courses, credentials, and project contributions."
      />
    );
  }

  const hasAccessToken = !!user.accessTokenAlias;

  // No access token: admission view with the alias form
  if (!hasAccessToken) {
    return (
      <div className="space-y-6">
        <AccessTokenConfirmationAlert onComplete={() => router.refresh()} />
        <Admission walletAddress={user.cardanoBech32Addr} onMinted={() => router.refresh()} />
      </div>
    );
  }

  return (
    <DashboardProvider>
      <DashboardContent user={user} />
    </DashboardProvider>
  );
}

function DashboardContent({ user }: { user: AuthUser }) {
  return (
    <>
      <AndamioRecordHeader
        label="Academic record"
        title={user.accessTokenAlias}
        meta={user.cardanoBech32Addr ? `Wallet ${truncateWalletAddress(user.cardanoBech32Addr)}` : undefined}
      />
      <AndamioRecordLayout
        main={
          <>
            <DashboardNextStep />
            <CoursesLedger />
            <ProjectsUnlocking />
            <DutiesLedger />
            <ContributingLedger />
          </>
        }
        margin={
          <>
            <PathPanel />
            <AccomplishmentsPanel />
            <RecordDetails walletAddress={user.cardanoBech32Addr} accessTokenAlias={user.accessTokenAlias} />
          </>
        }
      />
    </>
  );
}
