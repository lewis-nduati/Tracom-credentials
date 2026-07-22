"use client";

import Image from "next/image";
import Link from "next/link";
import { env } from "~/env";
import { LandingHero, GuillocheBackdrop } from "~/components/landing/landing-hero";

export default function Home() {
  const network = env.NEXT_PUBLIC_CARDANO_NETWORK;

  return (
    <div className="h-dvh flex flex-col bg-background text-foreground overflow-x-hidden overflow-y-auto">

      {/* Nav */}
      <nav className="bg-brand-navy px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Image
            src="/logos/tracom-logo.svg"
            alt="Tracom Credentials"
            width={945}
            height={223}
            className="h-8 w-auto"
            priority
          />

          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href="#how-it-works"
              className="hidden text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline"
            >
              How it works
            </a>

            <Link
              href="/consulting"
              className="rounded-md border border-white/30 px-5 py-2 text-sm font-semibold text-white transition-all hover:border-white/60 hover:bg-white/10 active:scale-[0.98]"
            >
              Consulting
            </Link>

            <Link
              href="/course"
              className="rounded-md border border-white/30 px-5 py-2 text-sm font-semibold text-white transition-all hover:border-white/60 hover:bg-white/10 active:scale-[0.98]"
            >
              Browse courses
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        <LandingHero />
      </main>

      {/* Footer */}
      <footer className="relative overflow-hidden bg-brand-navy px-6 py-6 text-secondary-foreground/50">
        <GuillocheBackdrop opacity={0.07} />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs sm:flex-row">
          <span>© 2026 Tracom Credentials. All rights reserved.</span>

          <div className="flex items-center gap-4">
            <a
              href="https://tracom.co.ke"
              className="transition-colors hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              tracom.co.ke
            </a>

            <span className="text-white/20">·</span>

            <span>Powered by Andamio on Cardano</span>

            <span className="text-white/20">·</span>

            <span className="font-mono uppercase tracking-wider">
              {network}
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}