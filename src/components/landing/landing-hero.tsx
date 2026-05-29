"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AccessTokenOnboarding } from "~/components/auth/access-token-onboarding";
import { AndamioHeading, AndamioText } from "~/components/andamio";

// The hero headline rotates through these audiences. `accent` is the word's
// colour on the navy hero (brand tokens, defined in globals.css). `tint` is the
// hue of a subtle glow behind it: a restrained stand-in for the eventual
// background photo (swap each for a <next/image fill>: a person in a suit, a
// teacher at a board, then a crowd of bankers, farmers, scientists). Timing is
// tunable via ROTATE_MS.
const AUDIENCES = [
  { word: "employers", accent: "var(--brand-gold)", tint: "var(--brand-gold)" },
  { word: "teachers", accent: "var(--brand-steel)", tint: "var(--brand-steel)" },
  { word: "everyone", accent: "var(--brand-clay)", tint: "var(--brand-clay)" },
] as const;
const ROTATE_MS = 3600;

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

function CredentialBadge() {
  const cx = 170;
  const cy = 168;
  // Beaded ring: evenly spaced dots around the medallion edge.
  const beadCount = 48;
  const beadRadius = 132;
  const beads = Array.from({ length: beadCount }, (_, i) => {
    const angle = (i / beadCount) * Math.PI * 2;
    // Round to a fixed precision so the server- and client-rendered SVG emit
    // identical coordinate strings (raw floats can differ in their last digit
    // and trip React's hydration check).
    return {
      x: (cx + beadRadius * Math.cos(angle)).toFixed(3),
      y: (cy + beadRadius * Math.sin(angle)).toFixed(3),
    };
  });

  return (
    <svg
      viewBox="0 0 340 420"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm"
      role="img"
      aria-label="Tracom Academy on-chain credential badge"
    >
      <defs>
        <radialGradient id="badgeFace" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#F6DE8E" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#9C7C12" />
        </radialGradient>
        <linearGradient id="badgeRing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0CE6B" />
          <stop offset="100%" stopColor="#9C7C12" />
        </linearGradient>
        <linearGradient id="ribbonGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A227" />
          <stop offset="100%" stopColor="#8A6D0E" />
        </linearGradient>
        {/* Arc paths for curved lettering (concentric with the medallion). */}
        <path id="arcTop" d={`M ${cx - 96} ${cy} A 96 96 0 0 1 ${cx + 96} ${cy}`} fill="none" />
        <path id="arcBottom" d={`M ${cx - 92} ${cy + 6} A 92 92 0 0 0 ${cx + 92} ${cy + 6}`} fill="none" />
      </defs>

      {/* Ribbon tails behind the medallion */}
      <polygon points="150,250 120,250 96,400 132,372 150,400" fill="url(#ribbonGrad)" />
      <polygon points="190,250 220,250 244,400 208,372 190,400" fill="url(#ribbonGrad)" />
      <polygon points="150,250 190,250 190,330 150,330" fill="#7A5F0B" opacity="0.5" />

      {/* Outer ring + beaded edge */}
      <circle cx={cx} cy={cy} r="139" fill="none" stroke="url(#badgeRing)" strokeWidth="3" />
      {beads.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r="2.4" fill="#E7C766" />
      ))}

      {/* Medallion face */}
      <circle cx={cx} cy={cy} r="118" fill="url(#badgeFace)" stroke="#7A5F0B" strokeWidth="1.5" />
      {/* Inner engraved rings */}
      <circle cx={cx} cy={cy} r="104" fill="none" stroke="#0F2545" strokeOpacity="0.28" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="100" fill="none" stroke="#0F2545" strokeOpacity="0.2" strokeWidth="0.75" strokeDasharray="1.5 4" />

      {/* Curved lettering */}
      <text
        fill="#0F2545"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="15"
        fontWeight="bold"
        letterSpacing="3"
      >
        <textPath href="#arcTop" startOffset="50%" textAnchor="middle">
          TRACOM ACADEMY
        </textPath>
      </text>
      <text
        fill="#0F2545"
        fillOpacity="0.7"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="10"
        letterSpacing="3.5"
      >
        <textPath href="#arcBottom" startOffset="50%" textAnchor="middle">
          ON-CHAIN · CARDANO
        </textPath>
      </text>

      {/* Star separators flanking the center */}
      <text x={cx - 78} y={cy + 5} fill="#0F2545" fillOpacity="0.45" fontSize="12" textAnchor="middle">★</text>
      <text x={cx + 78} y={cy + 5} fill="#0F2545" fillOpacity="0.45" fontSize="12" textAnchor="middle">★</text>

      {/* Center verified emblem */}
      <circle cx={cx} cy={cy - 6} r="40" fill="#0F2545" />
      <circle cx={cx} cy={cy - 6} r="40" fill="none" stroke="#E7C766" strokeWidth="1.5" />
      <path
        d={`M ${cx - 17} ${cy - 6} l 11 12 l 22 -24`}
        fill="none"
        stroke="#E7C766"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x={cx}
        y={cy + 52}
        fill="#0F2545"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="9"
        fontWeight="bold"
        letterSpacing="2.5"
        textAnchor="middle"
      >
        VERIFIED
      </text>
    </svg>
  );
}

/**
 * Hero section with the rotating-audience headline and crossfading backdrop.
 * Single font, rotating accent colour per word; the background photo (placeholder
 * gradient for now) crossfades in sync. Respects prefers-reduced-motion: pins to
 * "everyone" and skips all motion.
 */
function HeroSection({ onEnter }: { onEnter: () => void }) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return; // no rotation; the derived `active` pins to "everyone"
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % AUDIENCES.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [reducedMotion]);

  // When motion is reduced, show the final "everyone" frame and never animate.
  const active = reducedMotion ? AUDIENCES[AUDIENCES.length - 1]! : AUDIENCES[index]!;

  return (
    <section className="relative overflow-hidden bg-brand-navy px-6 py-20 text-secondary-foreground sm:py-28">
      {/* Crossfading backdrop: a restrained accent glow over the navy that
          shifts per audience. Stands in for the eventual background photo, but
          stays institutional rather than reading as a gradient panel. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {AUDIENCES.map((a, i) => (
          <div
            key={a.word}
            className="absolute inset-0 transition-opacity duration-1000 ease-out"
            style={{
              opacity: i === index ? 1 : 0,
              backgroundImage: `radial-gradient(110% 120% at 82% 0%, color-mix(in oklch, ${a.tint} 22%, transparent) 0%, transparent 58%)`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="max-w-xl space-y-8">
            <AndamioText variant="overline" as="div" className="text-white/50">
              Tracom Academy
            </AndamioText>
            <AndamioHeading
              level={1}
              size="display"
              className="text-pretty text-secondary-foreground"
            >
              Credentials{" "}
              {/* Stacked invisible sizers reserve the widest word's width so
                  "can trust." never shifts as the word rotates. */}
              <span className="relative inline-grid align-baseline">
                {AUDIENCES.map((a) => (
                  <span key={a.word} aria-hidden className="invisible [grid-area:1/1]">
                    {a.word}
                  </span>
                ))}
                <span className="[grid-area:1/1]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={active.word}
                      className="inline-block"
                      style={{ color: active.accent }}
                      initial={{ opacity: 0, y: "0.3em" }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: "-0.3em" }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {active.word}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>{" "}
              can trust.
            </AndamioHeading>
            <AndamioText variant="lead" className="max-w-md leading-relaxed text-white/65">
              Finish a course and Tracom issues your credential to your wallet.
              Any employer can check it on-chain themselves.
            </AndamioText>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onEnter}
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
            <CredentialBadge />
          </div>
        </div>
      </div>
    </section>
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
      <HeroSection onEnter={handleEnter} />

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
