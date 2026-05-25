"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { DashboardProvider, useDashboardData } from "~/contexts/dashboard-context";
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
import { AndamioText } from "~/components/andamio";
import type { AuthUser } from "~/lib/andamio-auth";

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
        title="Connect to view your dashboard"
        description="Connect your Cardano wallet to see your courses, credentials, and project contributions."
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
      <DashboardContent user={user} jwtExpiration={jwtExpiration} />
    </DashboardProvider>
  );
}

interface DashboardContentProps {
  user: AuthUser;
  jwtExpiration: Date | null;
}

function DashboardContent({ user, jwtExpiration }: DashboardContentProps) {
  const { teacher, projects, isLoading } = useDashboardData();

  const hasTeachingOrManaging =
    isLoading ||
    (teacher?.courses?.length ?? 0) > 0 ||
    (projects?.managing?.length ?? 0) > 0;

  const hasContributing =
    isLoading || (projects?.contributing?.length ?? 0) > 0;

  return (
    <div className="space-y-10">
      {/* Zone 1: Identity */}
      <WelcomeHero accessTokenAlias={user.accessTokenAlias!} />

      {/* Zone 2: Learning (dominant) */}
      <MyLearning />

      {/* Zone 3: Progress + Accomplishments */}
      <div className="space-y-4">
        <ProjectUnlockProgress />
        <div className="grid gap-4 md:grid-cols-2">
          <StudentAccomplishments accessTokenAlias={user.accessTokenAlias} />
          <OnChainStatus accessTokenAlias={user.accessTokenAlias} />
        </div>
      </div>

      {/* Zone 4a: Teaching & Managing (hidden when no data) */}
      {hasTeachingOrManaging && (
        <section className="space-y-4">
          <AndamioText variant="overline" as="div">
            Teaching & Managing
          </AndamioText>
          <div className="grid gap-4 md:grid-cols-2">
            <PendingReviewsSummary accessTokenAlias={user.accessTokenAlias} />
            <PendingAssessmentsSummary accessTokenAlias={user.accessTokenAlias} />
            <OwnedCoursesSummary accessTokenAlias={user.accessTokenAlias} />
            <ManagingProjectsSummary accessTokenAlias={user.accessTokenAlias} />
          </div>
        </section>
      )}

      {/* Zone 4b: Contributing (hidden when no data) */}
      {hasContributing && (
        <section className="space-y-4">
          <AndamioText variant="overline" as="div">
            Contributing
          </AndamioText>
          <ContributingProjectsSummary accessTokenAlias={user.accessTokenAlias} />
        </section>
      )}

      {/* Zone 5: Account */}
      <AccountDetailsCard
        cardanoBech32Addr={user.cardanoBech32Addr}
        accessTokenAlias={user.accessTokenAlias}
        jwtExpiration={jwtExpiration}
      />
    </div>
  );
}
