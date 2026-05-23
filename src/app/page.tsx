"use client";

import Image from "next/image";
import { env } from "~/env";
import { LandingHero } from "~/components/landing/landing-hero";

export default function Home() {
  const network = env.NEXT_PUBLIC_CARDANO_NETWORK;

  return (
    <div className="h-dvh flex flex-col bg-white text-slate-900 overflow-x-hidden overflow-y-auto">

      {/* Nav */}
      <nav className="bg-[#1A3D6B] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center">
          <Image
            src="/logos/tracom-logo.svg"
            alt="Tracom Academy"
            width={945}
            height={223}
            className="h-8 w-auto"
            priority
          />
        </div>
      </nav>

      {/* Main content — hero, steps, proof cards */}
      <main className="flex-1">
        <LandingHero />
      </main>

      {/* Footer */}
      <footer className="bg-[#1A3D6B] text-white/50 px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>© 2026 Tracom Academy. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a
              href="https://tracom.co.ke"
              className="hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              tracom.co.ke
            </a>
            <span className="text-white/20">·</span>
            <span className="font-mono uppercase tracking-wider">{network}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
