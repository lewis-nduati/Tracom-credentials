"use client";

import React from "react";
import Link from "next/link";
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
    title: "Prove your skills",
    desc: "Send it to any employer. They verify it on-chain themselves.",
  },
] as const;

const VALUES = [
  {
    label: "Verified by anyone",
    body: "No central authority, no login required. Any employer can check your credential independently.",
  },
  {
    label: "Permanent record",
    body: "Stored on-chain. It doesn't expire or depend on Tracom's systems staying online.",
  },
  {
    label: "Yours alone",
    body: "Your credential is in your wallet. You decide where it goes and who sees it.",
  },
] as const;

function CredentialCard() {
  return (
    <svg
      viewBox="0 0 420 290"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-md"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0c1e3d" />
          <stop offset="100%" stopColor="#1a3568" />
        </linearGradient>
        <linearGradient id="goldVert" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#A8860A" />
        </linearGradient>
        <clipPath id="cardClip">
          <rect x="20" y="10" width="374" height="262" rx="14" />
        </clipPath>
      </defs>

      {/* Shadow */}
      <rect x="28" y="20" width="374" height="262" rx="14" fill="rgba(0,0,0,0.32)" />

      {/* All card content clipped to rounded rect */}
      <g clipPath="url(#cardClip)">
        {/* White card background */}
        <rect x="20" y="10" width="374" height="262" fill="white" />

        {/* Gold left accent strip */}
        <rect x="20" y="10" width="7" height="262" fill="url(#goldVert)" />

        {/* Navy header band */}
        <rect x="27" y="10" width="367" height="72" fill="url(#headerGrad)" />

        {/* TRACOM ACADEMY */}
        <text
          x="48" y="42"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="12" fontWeight="bold" letterSpacing="4"
          fill="white"
        >
          TRACOM ACADEMY
        </text>
        <text
          x="48" y="60"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="9" letterSpacing="2.5"
          fill="rgba(255,255,255,0.45)"
        >
          NAIROBI, KENYA
        </text>

        {/* Verified pill */}
        <rect x="274" y="28" width="100" height="22" rx="11"
          fill="rgba(212,175,55,0.15)" stroke="#D4AF37" strokeWidth="1" />
        <path d="M287 39 L291 43 L300 34"
          stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="334" y="44"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="9" fontWeight="bold" letterSpacing="1"
          fill="#D4AF37" textAnchor="middle"
        >
          VERIFIED
        </text>

        {/* CERTIFICATE OF COMPLETION label */}
        <text x="48" y="108"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="8" letterSpacing="3"
          fill="rgba(15,37,69,0.4)"
        >
          CERTIFICATE OF COMPLETION
        </text>

        {/* Credential title */}
        <text x="48" y="137"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="21" fontWeight="bold"
          fill="#0F2545"
        >
          POS Systems &amp;
        </text>
        <text x="48" y="163"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="21" fontWeight="bold"
          fill="#0F2545"
        >
          Retail Technology
        </text>

        {/* Divider */}
        <line x1="48" y1="180" x2="260" y2="180"
          stroke="#0F2545" strokeOpacity="0.1" strokeWidth="1" />

        {/* Awarded to */}
        <text x="48" y="200"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="8" letterSpacing="2"
          fill="rgba(15,37,69,0.4)"
        >
          AWARDED TO
        </text>
        <text x="48" y="220"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="16" fontWeight="bold"
          fill="#0F2545"
        >
          Grace W. Mwangi
        </text>

        {/* Bottom meta */}
        <text x="48" y="256"
          fontFamily="'Courier New', Courier, monospace"
          fontSize="8"
          fill="rgba(15,37,69,0.28)"
        >
          4f2a3b8c...c1e9  ·  Cardano  ·  Mar 2026
        </text>

        {/* Seal outer ring */}
        <circle cx="348" cy="210" r="42"
          fill="rgba(212,175,55,0.07)"
          stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" />
        {/* Seal inner dashed ring */}
        <circle cx="348" cy="210" r="34"
          fill="none"
          stroke="rgba(212,175,55,0.25)" strokeWidth="0.75" strokeDasharray="2 4" />

        {/* TRACOM 2026 text in seal */}
        <text x="348" y="204"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="8" fontWeight="bold" letterSpacing="1.5"
          fill="#C9A227" textAnchor="middle"
        >
          TRACOM
        </text>
        <text x="348" y="216"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="10" fontWeight="bold" letterSpacing="1"
          fill="#C9A227" textAnchor="middle"
        >
          2026
        </text>

        {/* ON-CHAIN label below seal */}
        <text x="348" y="265"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="7" letterSpacing="2"
          fill="rgba(201,162,39,0.65)" textAnchor="middle"
        >
          ON-CHAIN
        </text>
      </g>

      {/* Card border */}
      <rect x="20" y="10" width="374" height="262" rx="14"
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
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
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand-navy px-6 py-16">
        <AccessTokenOnboarding
          onActivated={goToDashboard}
          onExistingTokenDetected={goToDashboard}
          darkLayout
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
                Finish a course and Tracom issues your credential to your
                wallet. Any employer can check it on-chain themselves.
              </AndamioText>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleEnter}
                  className="cursor-pointer rounded-md bg-white px-8 py-3.5 text-base font-semibold text-brand-navy transition-all hover:bg-white/90 active:scale-[0.98]"
                >
                  Get Started
                </button>
                <Link
                  href="/course"
                  className="rounded-md border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:border-white/60 hover:bg-white/10 active:scale-[0.98]"
                >
                  View Courses
                </Link>
              </div>
            </div>
            <div className="hidden items-center justify-center lg:flex">
              <CredentialCard />
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
              <AndamioText variant="small" className="leading-relaxed text-accent-foreground/70">
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
                  className="mb-3 block select-none text-7xl font-black leading-none text-foreground/[0.08]"
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
            className="cursor-pointer whitespace-nowrap rounded-md bg-white px-7 py-3 text-base font-semibold text-brand-navy transition-all hover:bg-white/90 active:scale-[0.98] sm:shrink-0"
          >
            Get Started
          </button>
        </div>
      </section>
    </>
  );
}
