"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AccessTokenOnboarding } from "~/components/auth/access-token-onboarding";
import { AndamioHeading, AndamioText } from "~/components/andamio";

const STEPS = [
  {
    step: "01",
    title: "Complete a course",
    desc: "Finish Tracom Academy coursework and assignments at your own pace.",
  },
  {
    step: "02",
    title: "Submit evidence",
    desc: "Your instructor reviews and approves your submitted work.",
  },
  {
    step: "03",
    title: "Earn a credential",
    desc: "Your certificate is issued permanently to your blockchain wallet.",
  },
  {
    step: "04",
    title: "Unlock opportunities",
    desc: "Share your credential with any employer, anywhere in the world.",
  },
] as const;

const VALUES = [
  {
    label: "Verified by anyone",
    body: "No central authority, no login required. Any employer can check your credential independently.",
  },
  {
    label: "Permanent record",
    body: "Stored on-chain. It doesn't expire, can't be lost, and doesn't depend on Tracom's systems.",
  },
  {
    label: "Yours alone",
    body: "Your credential lives in your wallet. You control it, share it, and take it with you.",
  },
] as const;

function CredentialDocument() {
  return (
    <svg
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm opacity-[0.18]"
      aria-hidden="true"
    >
      {/* Document */}
      <rect
        x="16" y="8" width="288" height="224" rx="4"
        fill="white" fillOpacity="0.04"
        stroke="white" strokeOpacity="0.2" strokeWidth="1.5"
      />
      {/* Header band */}
      <rect x="16" y="8" width="288" height="48" rx="4" fill="white" fillOpacity="0.07" />
      <line x1="16" y1="56" x2="304" y2="56" stroke="white" strokeOpacity="0.12" strokeWidth="1" />
      {/* Logo mark */}
      <rect x="28" y="18" width="24" height="24" rx="3" fill="white" fillOpacity="0.25" />
      {/* Institution name */}
      <rect x="60" y="22" width="88" height="7" rx="2" fill="white" fillOpacity="0.4" />
      <rect x="60" y="33" width="56" height="5" rx="2" fill="white" fillOpacity="0.18" />
      {/* Verified badge */}
      <rect x="240" y="22" width="52" height="18" rx="9" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.25" strokeWidth="1" />
      <rect x="250" y="28" width="32" height="5" rx="2" fill="white" fillOpacity="0.45" />
      {/* Awarded to label */}
      <rect x="28" y="72" width="52" height="4" rx="2" fill="white" fillOpacity="0.18" />
      {/* Recipient name */}
      <rect x="28" y="82" width="172" height="12" rx="2" fill="white" fillOpacity="0.5" />
      {/* Credential title */}
      <rect x="28" y="106" width="264" height="16" rx="2" fill="white" fillOpacity="0.32" />
      {/* Meta rows */}
      <rect x="28" y="134" width="110" height="5" rx="2" fill="white" fillOpacity="0.18" />
      <rect x="28" y="144" width="84" height="5" rx="2" fill="white" fillOpacity="0.18" />
      {/* Rule */}
      <line x1="28" y1="162" x2="292" y2="162" stroke="white" strokeOpacity="0.08" strokeWidth="1" />
      {/* Hash label */}
      <rect x="28" y="172" width="36" height="4" rx="2" fill="white" fillOpacity="0.15" />
      {/* Hash value lines */}
      <rect x="28" y="181" width="216" height="4" rx="2" fill="white" fillOpacity="0.1" />
      <rect x="28" y="189" width="176" height="4" rx="2" fill="white" fillOpacity="0.1" />
      {/* Seal ring */}
      <circle cx="266" cy="196" r="26" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
      <circle cx="266" cy="196" r="20" stroke="white" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 2" />
      {/* Checkmark */}
      <path
        d="M258 196 L264 202 L276 188"
        stroke="white" strokeOpacity="0.45" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingHero() {
  const [showEnter, setShowEnter] = React.useState(false);
  const router = useRouter();
  const { isAuthenticated, user, isWalletConnected } = useAndamioAuth();

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

  if (showEnter || isWalletConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <AccessTokenOnboarding
          onActivated={goToDashboard}
          onExistingTokenDetected={goToDashboard}
        />
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-navy px-6 py-20 text-secondary-foreground sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="max-w-xl space-y-8">
              <AndamioText
                variant="overline"
                as="div"
                className="text-white/50"
              >
                Tracom Academy
              </AndamioText>
              <AndamioHeading
                level={1}
                size="display"
                className="text-pretty text-secondary-foreground"
              >
                Credentials employers can trust.
              </AndamioHeading>
              <AndamioText
                variant="lead"
                className="max-w-md leading-relaxed text-white/65"
              >
                Complete a course. Earn a credential issued permanently to your
                blockchain wallet. Share it with any employer, anywhere.
              </AndamioText>
              <button
                onClick={handleEnter}
                className="cursor-pointer rounded-md bg-background px-8 py-3.5 text-base font-semibold text-brand-navy transition-all hover:bg-background/90 active:scale-[0.98]"
              >
                Connect Wallet
              </button>
            </div>
            <div className="hidden items-center justify-center lg:flex">
              <CredentialDocument />
            </div>
          </div>
        </div>
      </section>

      {/* Value strip */}
      <section className="bg-accent px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3 sm:gap-8">
          {VALUES.map(({ label, body }) => (
            <div key={label}>
              <AndamioHeading level={3} size="xl" className="mb-2">
                {label}
              </AndamioHeading>
              <AndamioText variant="small" className="leading-relaxed">
                {body}
              </AndamioText>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-background px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <AndamioText variant="overline" as="div" className="mb-12">
            How it works
          </AndamioText>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step}>
                <span
                  className="mb-3 block select-none text-7xl font-black leading-none text-brand-navy/[0.08]"
                  aria-hidden="true"
                >
                  {step}
                </span>
                <h3 className="mb-2 text-base font-semibold text-foreground">
                  {title}
                </h3>
                <AndamioText variant="small" className="leading-relaxed">
                  {desc}
                </AndamioText>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-brand-navy px-6 py-12 sm:py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <AndamioHeading level={2} size="2xl" className="text-secondary-foreground">
            Ready to earn your first credential?
          </AndamioHeading>
          <button
            onClick={handleEnter}
            className="cursor-pointer whitespace-nowrap rounded-md bg-background px-7 py-3 text-base font-semibold text-brand-navy transition-all hover:bg-background/90 active:scale-[0.98] sm:shrink-0"
          >
            Connect Wallet
          </button>
        </div>
      </section>
    </>
  );
}
