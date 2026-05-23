"use client";

import Image from "next/image";
import { env } from "~/env";
import { LandingHero } from "~/components/landing/landing-hero";

export default function Home() {
  const network = env.NEXT_PUBLIC_CARDANO_NETWORK;

  return (
    <main className="bg-background text-foreground flex h-dvh flex-col overflow-x-hidden overflow-y-auto">
      <section className="flex flex-1 flex-col items-center px-6 pt-[4vh]">
        {/* Logo — pinned near top so it doesn't shift between states */}
        <Image
          src="/logos/logo-with-typography-stacked.svg"
          alt="Andamio"
          width={200}
          height={200}
          className="shrink-0"
          priority
        />

        {/* Card area — centered for short content, naturally top-anchored for tall hero */}
        <div className="flex w-full flex-1 items-center justify-center pt-[4vh] sm:pt-[6vh]">
          <LandingHero />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border/50 border-t px-6 py-4">
        <div className="text-muted-foreground flex items-center justify-center gap-6 font-mono text-xs">
          <span className="tracking-wider uppercase">{network}</span>
          <span className="text-border">•</span>
          <span>v2.2.8</span>
        </div>
      </footer>
    </main>
  );
}
