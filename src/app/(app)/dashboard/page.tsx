"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { DashboardProvider } from "~/contexts/dashboard-context";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";
import { MyLearning } from "~/components/learner/my-learning";
import { ProjectUnlockProgress } from "~/components/learner/project-unlock-progress";
import { MintAccessToken } from "~/components/tx";
import { WelcomeHero } from "~/components/dashboard/welcome-hero";
import { GettingStarted } from "~/components/dashboard/getting-started";
import { AccessTokenConfirmationAlert } from "~/components/dashboard/access-token-confirmation-alert";
import { OnChainStatus } from "~/components/dashboard/on-chain-status";
import { AccountDetailsCard } from "~/components/dashboard/account-details";
import { PendingReviewsSummary } from "~/components/dashboard/pending-reviews-summary";
import { PendingAssessmentsSummary } from "~/components/dashboard/pending-assessments-summary";
import { StudentAccomplishments } from "~/components/dashboard/student-accomplishments";
import { ContributingProjectsSummary } from "~/components/dashboard/contributing-projects-summary";
import { ManagingProjectsSummary } from "~/components/dashboard/managing-projects-summary";
import { OwnedCoursesSummary } from "~/components/dashboard/owned-courses-summary";
import {
  PostMintAuthPrompt,
  checkAndClearJustMintedFlag,
} from "~/components/dashboard/post-mint-auth-prompt";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, jwt } = useAndamioAuth();
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
        title="Your Learning Journey Starts Here"
        description="Connect your Cardano wallet to see your courses, credentials, and project opportunities."
      />
    );
  }

  // Parse JWT to get expiration
  let jwtExpiration: Date | null = null;
  if (jwt) {
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1]!)) as { exp?: number };
      if (payload.exp) {
        jwtExpiration = new Date(payload.exp * 1000);
      }
    } catch {
      // Invalid JWT
    }
  }

  const hasAccessToken = !!user.accessTokenAlias;

  // No access token: show mint prompt
  if (!hasAccessToken) {
    return (
      <div className="space-y-6">
        <AccessTokenConfirmationAlert onComplete={() => router.refresh()} />
        <GettingStarted
          isAuthenticated={isAuthenticated}
          hasAccessToken={hasAccessToken}
        />
        <MintAccessToken onSuccess={() => router.refresh()} />
      </div>
    );
  }

  return (
    <DashboardProvider>
      <div className="space-y-6">
        {/* Welcome Hero - Main identity display */}
        <WelcomeHero accessTokenAlias={user.accessTokenAlias!} />

        {/* My Learning Section */}
        <MyLearning />

        {/* Project Unlock Progress - Shows prerequisites progress or aspirational empty state */}
        <ProjectUnlockProgress />

        {/* Accomplishments & On-Chain Data */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Accomplishments
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <StudentAccomplishments accessTokenAlias={user.accessTokenAlias} />
            <OnChainStatus accessTokenAlias={user.accessTokenAlias} />
          </div>
        </section>

        {/* Teaching & Managing */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Teaching & Managing
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <PendingReviewsSummary accessTokenAlias={user.accessTokenAlias} />
            <PendingAssessmentsSummary accessTokenAlias={user.accessTokenAlias} />
            <OwnedCoursesSummary accessTokenAlias={user.accessTokenAlias} />
            <ManagingProjectsSummary accessTokenAlias={user.accessTokenAlias} />
          </div>
        </section>

        {/* Contributing */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Contributing
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <ContributingProjectsSummary accessTokenAlias={user.accessTokenAlias} />
          </div>
        </section>

        {/* Account */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Account
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <AccountDetailsCard
              cardanoBech32Addr={user.cardanoBech32Addr}
              accessTokenAlias={user.accessTokenAlias}
              jwtExpiration={jwtExpiration}
            />
          </div>
        </section>
      </div>
    </DashboardProvider>
  );
}
