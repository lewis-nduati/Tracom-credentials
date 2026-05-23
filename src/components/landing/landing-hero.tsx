"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AccessTokenOnboarding } from "~/components/auth/access-token-onboarding";

const STEPS = [
  {
    step: "01",
    title: "Complete a course",
    desc: "Finish Tracom Academy coursework and assignments at your pace.",
  },
  {
    step: "02",
    title: "Submit evidence",
    desc: "Your instructor reviews and approves your submitted work.",
  },
  {
    step: "03",
    title: "Earn credential",
    desc: "Your certificate is minted on-chain, permanently recorded.",
  },
  {
    step: "04",
    title: "Unlock opportunities",
    desc: "Share your credential with any employer, anywhere in the world.",
  },
] as const;

const PROOF_CARDS = [
  {
    title: "100% Verifiable",
    desc: "Every credential is anchored on Cardano. Anyone can confirm it is real — no middlemen, no email required.",
  },
  {
    title: "Forever",
    desc: "On-chain credentials cannot be revoked, lost, or expire. Your achievement is permanent.",
  },
  {
    title: "Yours",
    desc: "Your credential lives in your wallet. You control it. You share it when you choose.",
  },
] as const;

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
      <div className="flex items-center justify-center min-h-[60vh] px-6 py-16">
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
      <section className="bg-[#1A3D6B] text-white px-6 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Credentials Employers<br />Can Trust
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-xl mx-auto leading-relaxed">
            Earn verified credentials from Tracom Academy.
          </p>
          <div className="pt-2">
            <button
              onClick={handleEnter}
              className="bg-white text-[#1A3D6B] font-semibold px-8 py-3 rounded-md hover:bg-white/90 active:bg-white/80 transition-colors text-base cursor-pointer"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </section>

      {/* 4-Step Flow */}
      <section className="bg-white px-6 py-16 sm:py-20 border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-semibold text-slate-800 mb-12">
            How it works
          </h2>
          <div className="flex flex-col sm:flex-row items-start justify-center">
            {STEPS.map(({ step, title, desc }, i) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center text-center flex-1 px-4 mb-8 sm:mb-0">
                  <div className="w-12 h-12 rounded-full border-2 border-[#1A3D6B] flex items-center justify-center mb-4 shrink-0">
                    <span className="text-sm font-bold text-[#1A3D6B]">{step}</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[160px]">{desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:flex items-start justify-center pt-5 shrink-0 text-slate-300 text-2xl">
                    →
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Proof Cards */}
      <section className="bg-slate-50 px-6 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6">
            {PROOF_CARDS.map(({ title, desc }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-md p-6"
              >
                <h3 className="font-semibold text-slate-800 text-lg mb-3">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
