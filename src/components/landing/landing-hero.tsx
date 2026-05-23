"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AccessTokenOnboarding } from "~/components/auth/access-token-onboarding";

export function LandingHero() {
  const [showEnter, setShowEnter] = React.useState(false);
  const router = useRouter();
  const { isAuthenticated, user, isWalletConnected } = useAndamioAuth();

  // Auto-redirect authenticated users with access token to dashboard
  React.useEffect(() => {
    if (isAuthenticated && user?.accessTokenAlias) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user?.accessTokenAlias, router]);

  const goToDashboard = React.useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleEnter = () => {
    if (isAuthenticated && user?.accessTokenAlias) {
      router.push("/dashboard");
    } else {
      setShowEnter(true);
    }
  };

  // Once the wallet is connected (and authenticating or authenticated), hand
  // off to the shared onboarding component. It handles authenticating spinner,
  // V2/V1 scans, migrate card, registration flow, and the post-mint ceremony.
  if (showEnter || isWalletConnected) {
    return (
      <div className="flex flex-1 w-full items-center justify-center">
        <AccessTokenOnboarding
          onActivated={goToDashboard}
          onExistingTokenDetected={goToDashboard}
        />
      </div>
    );
  }

  // Default hero view - clean vertical CTAs
  return (
    <div className="flex flex-col items-center text-center max-w-4xl mx-auto gap-8 sm:gap-12">
      {/* Value prop: icon + text pairs with arrows */}
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-16">
        <div className="flex flex-col items-center gap-3 w-32 sm:w-44">
          <div className="relative h-24 w-24 sm:h-36 sm:w-36 translate-x-4">
            <Image
              src="/landing-page-icons/01-complete-courses-black.png"
              alt="Complete courses"
              fill
              sizes="(min-width: 640px) 144px, 96px"
              priority
              className="object-contain dark:hidden"
            />
            <Image
              src="/landing-page-icons/01-complete-courses-white.png"
              alt="Complete courses"
              fill
              sizes="(min-width: 640px) 144px, 96px"
              priority
              className="object-contain hidden dark:block"
            />
          </div>
          <span className="text-muted-foreground text-center text-sm sm:text-base">Complete courses.</span>
        </div>
        <span className="hidden sm:block text-3xl sm:text-4xl text-muted-foreground">→</span>
        <div className="flex flex-col items-center gap-3 w-32 sm:w-44">
          <div className="relative h-24 w-24 sm:h-36 sm:w-36">
            <Image
              src="/landing-page-icons/02-earn-credentials-black.png"
              alt="Earn credentials"
              fill
              sizes="(min-width: 640px) 144px, 96px"
              priority
              className="object-contain dark:hidden"
            />
            <Image
              src="/landing-page-icons/02-earn-credentials-white.png"
              alt="Earn credentials"
              fill
              sizes="(min-width: 640px) 144px, 96px"
              priority
              className="object-contain hidden dark:block"
            />
          </div>
          <span className="text-muted-foreground text-center text-sm sm:text-base translate-x-2">Earn credentials.</span>
        </div>
        <span className="hidden sm:block text-3xl sm:text-4xl text-muted-foreground">→</span>
        <div className="flex flex-col items-center gap-3 w-32 sm:w-44">
          <div className="relative h-24 w-24 sm:h-36 sm:w-36">
            <Image
              src="/landing-page-icons/03-join-projects-black.png"
              alt="Join projects"
              fill
              sizes="(min-width: 640px) 144px, 96px"
              priority
              className="object-contain dark:hidden"
            />
            <Image
              src="/landing-page-icons/03-join-projects-white.png"
              alt="Join projects"
              fill
              sizes="(min-width: 640px) 144px, 96px"
              priority
              className="object-contain hidden dark:block"
            />
          </div>
          <span className="text-muted-foreground text-center text-sm sm:text-base">Join projects.</span>
        </div>
      </div>

      {/* CTA Cards */}
      <div className="w-full max-w-4xl">
        <hr className="border-border" />
      </div>
      <div className="w-full max-w-4xl">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center p-6 gap-4">
            <AndamioHeading level={3} size="base">Get Started</AndamioHeading>
            <p className="text-sm text-muted-foreground">
              Connect your wallet and create your on-chain identity
            </p>
            <AndamioButton onClick={handleEnter} className="w-full mt-auto">
              Enter
            </AndamioButton>
          </div>

          <div className="flex flex-col items-center text-center p-6 gap-4">
            <AndamioHeading level={3} size="base">Explore</AndamioHeading>
            <p className="text-sm text-muted-foreground">
              Browse courses and projects to see what&apos;s available
            </p>
            <AndamioButton asChild variant="outline" className="w-full mt-auto">
              <Link href="/course">Browse</Link>
            </AndamioButton>
          </div>

          <div className="flex flex-col items-center text-center p-6 gap-4">
            <AndamioHeading level={3} size="base">Build</AndamioHeading>
            <p className="text-sm text-muted-foreground">
              Launch a project and onboard contributors
            </p>
            <AndamioButton asChild variant="outline" className="w-full mt-auto">
              <Link href="/studio">Launch</Link>
            </AndamioButton>
          </div>
        </div>

        <div className="pt-4 pb-8">
          <Link href="/migrate" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Have a V1 Access Token? Migrate to V2 →
          </Link>
        </div>
      </div>
    </div>
  );
}
