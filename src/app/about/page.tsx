import type { Metadata } from "next";

import Hero from "~/components/about/hero";
import Story from "~/components/about/story";
import WhyCardano from "~/components/about/why-cardano";
import BuiltOnAndamio from "~/components/about/built-on-andamio";

export const metadata: Metadata = {
  title: "About",
  description:
    "Tracom Credentials issues verifiable certificates to the wallets of Tracom graduates, so employers can confirm them without contacting us.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <Story />
      <WhyCardano />
      <BuiltOnAndamio />
    </main>
  );
}
